// hooks/useObstacleDetector.ts
import { useState, useCallback, useRef } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

export type ObstacleZone = "safe" | "danger" | "critical";

export type ObstacleInfo = {
  zone: ObstacleZone;
  distance: number;
  closestDistance: number;
  position: "center" | "left" | "right";
  percentage: number;
};

export type DetectionConfig = {
  criticalThreshold: number;  // Objeto MUY cercano
  dangerThreshold: number;    // Objeto cercano
  // Todo > dangerThreshold = SAFE (sin alerta)
  minAlertInterval: number;
  enableVoice: boolean;
  enableHaptics: boolean;
  enableSound: boolean;
};

const DEFAULT_CONFIG: DetectionConfig = {
  // 🔧 UMBRALES OPTIMIZADOS basados en datos reales
  criticalThreshold: 380,  // < 380 = CRÍTICO (ej: 284, 318, 323, 353, 357, 359, 371)
  dangerThreshold: 480,    // < 480 = PELIGRO (ej: 387, 395, 411, 421, 449, 462, 474)
  // >= 480 = SEGURO (ej: 476, 500, 502, 522, 528, 539+)
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

  /**
   * 🔧 MEJORADO: Solo analiza región horizontal (ignora top/bottom)
   */
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
    (distance: number): ObstacleZone => {
      if (distance < fullConfig.criticalThreshold) return "critical";
      if (distance < fullConfig.dangerThreshold) return "danger";
      return "safe";
    },
    [fullConfig]
  );

  const getVoiceMessage = useCallback(
    (obstacle: ObstacleInfo): string => {
      const positionText = {
        center: "al frente",
        left: "a la izquierda",
        right: "a la derecha",
      }[obstacle.position];

      switch (obstacle.zone) {
        case "critical":
          return `¡Cuidado! Objeto muy cercano ${positionText}`;
        case "danger":
          return `Atención, objeto cercano ${positionText}`;
        default:
          return "";
      }
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
              // Vibración fuerte y repetida
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
              );
              setTimeout(() => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                ).catch(() => {});
              }, 200);
              break;
            case "danger":
              // Vibración moderada
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
              break;
          }
        } catch (err) {
          console.log("Haptics no disponible:", err);
        }
      }

      if (fullConfig.enableVoice) {
        const message = getVoiceMessage(obstacle);
        if (message) {
          Speech.stop();
          const rate = obstacle.zone === "critical" ? 1.2 : 1.0;
          Speech.speak(message, {
            language: "es-CL",
            rate,
            pitch: obstacle.zone === "critical" ? 1.2 : 1.0,
          });
        }
      }

      setTimeout(() => setIsAlerting(false), 500);
    },
    [fullConfig, getVoiceMessage]
  );

  /**
   * 🔧 CLAVE: Solo analiza la FRANJA HORIZONTAL central
   * Ignora píxeles de arriba y abajo que causan falsos positivos
   */
  const analyzeDepthMap = useCallback(
    async (
      depthData: Float32Array | number[],
      width: number,
      height: number
    ): Promise<ObstacleInfo | null> => {
      // 🔧 SOLUCIÓN DEFINITIVA: Usar TODA la imagen verticalmente (100%)
      // No ignorar nada - MiDaS necesita toda la información
      const stripStartY = 0;           // Desde el inicio
      const stripEndY = height;        // Hasta el final
      const stripHeight = height;      // 100% de altura

      // 🔧 NUEVO: Buscar el mínimo GLOBAL dentro de la franja horizontal
      let globalMinInStrip = Infinity;
      let globalMinX = 0;
      let globalMinY = 0;

      for (let y = stripStartY; y < stripEndY; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (idx < depthData.length) {
            const val = depthData[idx];
            if (val < globalMinInStrip) {
              globalMinInStrip = val;
              globalMinX = x;
              globalMinY = y;
            }
          }
        }
      }

      // Determinar en qué región está el píxel más cercano
      let position: "center" | "left" | "right";
      const thirdWidth = Math.floor(width / 3);
      
      if (globalMinX < thirdWidth) {
        position = "left";
      } else if (globalMinX < thirdWidth * 2) {
        position = "center";
      } else {
        position = "right";
      }

      // Analizar las 3 regiones para obtener promedios (para información adicional)
      const left = analyzeRegion(
        depthData,
        width,
        height,
        0,
        stripStartY,
        thirdWidth,
        stripEndY
      );

      const center = analyzeRegion(
        depthData,
        width,
        height,
        thirdWidth,
        stripStartY,
        thirdWidth * 2,
        stripEndY
      );

      const right = analyzeRegion(
        depthData,
        width,
        height,
        thirdWidth * 2,
        stripStartY,
        width,
        stripEndY
      );

      // Obtener el promedio de la región donde está el obstáculo más cercano
      const regionAvg = position === "left" ? left.avg :
                        position === "center" ? center.avg :
                        right.avg;

      // 🔧 CRÍTICO: Usar el mínimo GLOBAL de la franja para determinar zona
      const zone = getZone(globalMinInStrip);
      
      // Calcular porcentaje de píxeles en zona de peligro (solo en franja)
      const dangerThreshold = fullConfig.dangerThreshold;
      let affectedPixels = 0;
      let totalPixelsInStrip = 0;

      // Solo contar píxeles dentro de la franja horizontal
      for (let y = stripStartY; y < stripEndY; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (idx < depthData.length) {
            totalPixelsInStrip++;
            if (depthData[idx] < dangerThreshold) {
              affectedPixels++;
            }
          }
        }
      }

      const percentage = totalPixelsInStrip > 0 
        ? (affectedPixels / totalPixelsInStrip) * 100 
        : 0;

      const obstacle: ObstacleInfo = {
        zone,
        distance: regionAvg,
        closestDistance: globalMinInStrip,  // Ahora es el mínimo REAL de la franja
        position,
        percentage,
      };

      setCurrentObstacle(obstacle);

      // Alertar en zonas peligrosas
      if (zone === "critical") {
        await triggerAlert(obstacle);
      }

      // 🔧 DEBUG: Ahora muestra el mínimo REAL de la franja
      console.log(
        `🎯 ${zone.toUpperCase()} | Min franja: ${globalMinInStrip.toFixed(0)} | ` +
        `Avg región: ${regionAvg.toFixed(0)} | Pos: ${position} | ` +
        `Cobertura: ${percentage.toFixed(1)}%`
      );

      return obstacle;
    },
    [analyzeRegion, getZone, triggerAlert, fullConfig]
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