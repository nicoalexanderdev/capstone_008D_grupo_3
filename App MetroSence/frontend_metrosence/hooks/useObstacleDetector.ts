// hooks/useObstacleDetector.ts
import { useState, useCallback, useRef } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { YoloDetection } from "./useYoloModel";

export type ObstacleZone = "safe" | "danger" | "critical";

export type ObstacleInfo = {
  zone: ObstacleZone;
  distance: number;
  closestDistance: number;
  position: "center" | "left" | "right";
  percentage: number;
};

export type DetectionConfig = {
  criticalThreshold: number;
  dangerThreshold: number;
  minAlertInterval: number;
  enableVoice: boolean;
  enableHaptics: boolean;
  enableSound: boolean;
};

const DEFAULT_CONFIG: DetectionConfig = {
  criticalThreshold: 380,
  dangerThreshold: 480,
  minAlertInterval: 2000,
  enableVoice: true,
  enableHaptics: true,
  enableSound: true,
};

export function useObstacleDetector(config: Partial<DetectionConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [currentObstacle, setCurrentObstacle] = useState<ObstacleInfo | null>(null);
  const [isAlerting, setIsAlerting] = useState(false);
  const lastAlertTime = useRef<number>(0);
  const alertCount = useRef<number>(0);

  const analyzeRegion = useCallback(
    (
      depthData: Float32Array | number[],
      width: number,
      height: number,
      startX: number,
      startY: number,
      endX: number,
      endY: number
    ): { min: number; avg: number; count: number } => {
      let sum = 0;
      let min = Infinity;
      let count = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = y * width + x;
          if (idx < depthData.length) {
            const val = depthData[idx];
            sum += val;
            if (val < min) min = val;
            count++;
          }
        }
      }

      return {
        min,
        avg: count > 0 ? sum / count : Infinity,
        count,
      };
    },
    []
  );

  const getZone = useCallback(
    (distance: number, minDepth: number, maxDepth: number, coverage: number): ObstacleZone => {
      const range = maxDepth - minDepth;
      // Inverted for disparity (higher = closer): thresholds now subtracted from max
      const criticalThreshold = maxDepth - 0.3 * range;
      const dangerThreshold = maxDepth - 0.5 * range;

      // Inverted condition: check if distance (robust max) > thresholds
      if (coverage > 50 && distance > dangerThreshold) {
        return distance > criticalThreshold ? "critical" : "danger";
      }
      return "safe";
    },
    []
  );

  // Renamed and inverted for robust max (higher = closer); sort descending and trim extreme highs
  const getRobustMax = useCallback(
    (
      depthData: Float32Array | number[],
      width: number,
      height: number,
      x: number,
      y: number
    ): number => {
      let values: number[] = [];
      const radius = 2;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = ny * width + nx;
            if (idx < depthData.length) {
              values.push(depthData[idx]);
            }
          }
        }
      }
      if (values.length > 0) {
        // Sort descending (high to low)
        values.sort((a, b) => b - a);
        const percentile5 = Math.floor(values.length * 0.05);
        // Slice removes extreme highs, averages the next highest values
        return values.slice(percentile5).reduce((sum, val) => sum + val, 0) / (values.length - percentile5);
      }
      return depthData[y * width + x];
    },
    []
  );

  const triggerAlert = useCallback(
    async (obstacle: ObstacleInfo) => {
      const now = Date.now();
      
      if (now - lastAlertTime.current < fullConfig.minAlertInterval) {
        return;
      }

      lastAlertTime.current = now;
      alertCount.current++;
      setIsAlerting(true);

      if (fullConfig.enableHaptics) {
        try {
          switch (obstacle.zone) {
            case "critical":
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
              }, 200);
              break;
            case "danger":
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              break;
          }
        } catch (err) {
          console.log("Haptics no disponible:", err);
        }
      }

      setTimeout(() => setIsAlerting(false), 500);
    },
    [fullConfig]
  );

  const analyzeDepthMap = useCallback(
    async (
      depthData: Float32Array | number[],
      width: number,
      height: number,
      yoloDetections: YoloDetection[]
    ): Promise<ObstacleInfo | null> => {
      const stripStartY = 0;
      const stripEndY = height;
      const stripHeight = height;

      let globalMinInStrip = Infinity;
      let globalMaxInStrip = -Infinity;
      let globalMaxX = 0; // Changed to track max position
      let globalMaxY = 0;
      let analyzedPixels = 0;

      let topDetection: YoloDetection | null = null;
      if (yoloDetections.length > 0) {
        topDetection = yoloDetections.reduce((prev, curr) =>
          curr.confidence > prev.confidence ? curr : prev
        );
      }

      const scaleX = width / 640;
      const scaleY = height / 640;

      // Calcular píxeles afectados para cobertura ANTES de getZone
      let affectedPixels = 0;
      let totalPixelsInStrip = 0;
      const dangerThreshold = fullConfig.dangerThreshold;

      if (topDetection) {
        const margin = 0.1;
        const x1 = Math.floor((topDetection.bbox.x + topDetection.bbox.width * margin) * scaleX);
        const y1 = Math.floor((topDetection.bbox.y + topDetection.bbox.height * margin) * scaleY);
        const x2 = Math.floor((topDetection.bbox.x + topDetection.bbox.width * (1 - margin)) * scaleX);
        const y2 = Math.floor((topDetection.bbox.y + topDetection.bbox.height * (1 - margin)) * scaleY);

        console.log(`🔍 Analizando bbox de ${topDetection.className} (${(topDetection.confidence * 100).toFixed(1)}%)`);

        for (let y = Math.max(stripStartY, y1); y < Math.min(stripEndY, y2); y++) {
          for (let x = Math.max(0, x1); x < Math.min(width, x2); x++) {
            const idx = y * width + x;
            if (idx < depthData.length) {
              const val = depthData[idx];
              analyzedPixels++;
              totalPixelsInStrip++;
              // Inverted: count as affected if > threshold (higher = closer)
              if (val > dangerThreshold) {
                affectedPixels++;
              }
              if (val < globalMinInStrip) {
                globalMinInStrip = val;
              }
              if (val > globalMaxInStrip) {
                globalMaxInStrip = val;
                globalMaxX = x;
                globalMaxY = y;
              }
            }
          }
        }
        console.log(`🔍 Analizados ${analyzedPixels} píxeles dentro de bbox de ${topDetection.className}`);
      } else {
        console.log(`⚠️ No hay detecciones YOLO - Analizando toda la imagen`);
        for (let y = stripStartY; y < stripEndY; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (idx < depthData.length) {
              const val = depthData[idx];
              analyzedPixels++;
              totalPixelsInStrip++;
              // Inverted: count as affected if > threshold (higher = closer)
              if (val > dangerThreshold) {
                affectedPixels++;
              }
              if (val < globalMinInStrip) {
                globalMinInStrip = val;
              }
              if (val > globalMaxInStrip) {
                globalMaxInStrip = val;
                globalMaxX = x;
                globalMaxY = y;
              }
            }
          }
        }
      }

      if (globalMaxInStrip === -Infinity) { // Changed check to max
        console.log(`⚠️ No se encontraron píxeles válidos`);
        return null;
      }

      const percentage = totalPixelsInStrip > 0 ? (affectedPixels / totalPixelsInStrip) * 100 : 0;

      let position: "center" | "left" | "right";
      const thirdWidth = Math.floor(width / 3);
      // Changed to use globalMaxX for position (location of closest point)
      if (globalMaxX < thirdWidth) {
        position = "left";
      } else if (globalMaxX < thirdWidth * 2) {
        position = "center";
      } else {
        position = "right";
      }

      const left = analyzeRegion(depthData, width, height, 0, stripStartY, thirdWidth, stripEndY);
      const center = analyzeRegion(depthData, width, height, thirdWidth, stripStartY, thirdWidth * 2, stripEndY);
      const right = analyzeRegion(depthData, width, height, thirdWidth * 2, stripStartY, width, stripEndY);

      const regionAvg = position === "left" ? left.avg : position === "center" ? center.avg : right.avg;

      // Changed to robustMax
      const robustMax = getRobustMax(depthData, width, height, globalMaxX, globalMaxY);

      // Pass min/max correctly (min=far, max=close)
      const zone = getZone(robustMax, globalMinInStrip, globalMaxInStrip, percentage);

      const obstacle: ObstacleInfo = {
        zone,
        distance: robustMax, // Changed to robustMax
        closestDistance: robustMax, // Changed to robustMax
        position,
        percentage,
      };

      setCurrentObstacle(obstacle);

      if (zone === "critical" || zone === "danger") {
        await triggerAlert(obstacle);
      }

      // Updated log labels for clarity (max franja instead of min)
      console.log(
        `🎯 ${zone.toUpperCase()} | Min franja: ${globalMinInStrip.toFixed(0)} | ` +
        `Max franja: ${globalMaxInStrip.toFixed(0)} | Robust max: ${robustMax.toFixed(0)} | ` +
        `Avg región: ${regionAvg.toFixed(0)} | Pos: ${position} | ` +
        `Cobertura: ${percentage.toFixed(1)}%`
      );

      return obstacle;
    },
    [analyzeRegion, getZone, triggerAlert, fullConfig, getRobustMax] // Updated dependency
  );

  const resetAlerts = useCallback(() => {
    alertCount.current = 0;
    lastAlertTime.current = 0;
    setCurrentObstacle(null);
  }, []);

  return {
    analyzeDepthMap,
    currentObstacle,
    isAlerting,
    alertCount: alertCount.current,
    resetAlerts,
  };
}