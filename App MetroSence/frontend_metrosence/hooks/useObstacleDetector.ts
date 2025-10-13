// hooks/useObstacleDetector.ts
import { useState, useCallback, useRef } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

export type ObstacleZone = "safe" | "warning" | "danger" | "critical";

export type ObstacleInfo = {
  zone: ObstacleZone;
  distance: number; // Valor promedio de profundidad
  closestDistance: number; // Valor mínimo (más cercano)
  position: "center" | "left" | "right" | "top" | "bottom";
  percentage: number; // % del área que está en esa zona
};

export type DetectionConfig = {
  criticalThreshold: number; // Objeto MUY cercano (alarma fuerte)
  dangerThreshold: number; // Objeto cercano (alerta)
  warningThreshold: number; // Objeto a distancia media (advertencia)
  minAlertInterval: number; // Mínimo tiempo entre alertas (ms)
  enableVoice: boolean;
  enableHaptics: boolean;
  enableSound: boolean;
};

const DEFAULT_CONFIG: DetectionConfig = {
  criticalThreshold: 450, // Valores más bajos = más cerca
  dangerThreshold: 550,
  warningThreshold: 650,
  minAlertInterval: 2000, // 2 segundos entre alertas
  enableVoice: true,
  enableHaptics: true,
  enableSound: true,
};

/**
 * Hook para detectar obstáculos cercanos usando el mapa de profundidad
 */
export function useObstacleDetector(config: Partial<DetectionConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [currentObstacle, setCurrentObstacle] = useState<ObstacleInfo | null>(null);
  const [isAlerting, setIsAlerting] = useState(false);
  const lastAlertTime = useRef<number>(0);
  const alertCount = useRef<number>(0);

  /**
   * Analiza una región del mapa de profundidad
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

  /**
   * Determina la zona de peligro según la distancia
   */
  const getZone = useCallback(
    (distance: number): ObstacleZone => {
      if (distance < fullConfig.criticalThreshold) return "critical";
      if (distance < fullConfig.dangerThreshold) return "danger";
      if (distance < fullConfig.warningThreshold) return "warning";
      return "safe";
    },
    [fullConfig]
  );

  /**
   * Genera mensaje de voz según la zona y posición
   */
  const getVoiceMessage = useCallback(
    (obstacle: ObstacleInfo): string => {
      const positionText = {
        center: "al frente",
        left: "a la izquierda",
        right: "a la derecha",
        top: "arriba",
        bottom: "abajo",
      }[obstacle.position];

      switch (obstacle.zone) {
        case "critical":
          return `¡Cuidado! Objeto muy cercano ${positionText}`;
        case "danger":
          return `Atención, objeto cercano ${positionText}`;
        case "warning":
          return `Precaución ${positionText}`;
        default:
          return "";
      }
    },
    []
  );

  /**
   * Ejecuta alerta (voz + vibración + sonido)
   */
  const triggerAlert = useCallback(
    async (obstacle: ObstacleInfo) => {
      const now = Date.now();
      
      // Evitar spam de alertas
      if (now - lastAlertTime.current < fullConfig.minAlertInterval) {
        return;
      }

      lastAlertTime.current = now;
      alertCount.current++;
      setIsAlerting(true);

      // Vibración según la zona (solo si está habilitado y soportado)
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
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
              break;
            case "warning":
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              break;
          }
        } catch (err) {
          // Haptics no disponible en esta plataforma, silenciosamente ignorar
          console.log("Haptics no disponible:", err);
        }
      }

      // Mensaje de voz
      if (fullConfig.enableVoice) {
        const message = getVoiceMessage(obstacle);
        if (message) {
          // Interrumpir speech anterior si existe
          Speech.stop();
          
          // Velocidad de habla según urgencia
          const rate = obstacle.zone === "critical" ? 1.2 : 1.0;
          
          Speech.speak(message, {
            language: "es-CL",
            rate,
            pitch: obstacle.zone === "critical" ? 1.2 : 1.0,
          });
        }
      }

      // Sonido de alerta (opcional - puedes agregar Audio más adelante)
      // if (fullConfig.enableSound) { ... }

      setTimeout(() => setIsAlerting(false), 500);
    },
    [fullConfig, getVoiceMessage]
  );

  /**
   * Analiza el mapa de profundidad completo
   */
  const analyzeDepthMap = useCallback(
    async (
      depthData: Float32Array | number[],
      width: number,
      height: number
    ): Promise<ObstacleInfo | null> => {
      // Dividir la imagen en regiones
      const centerW = Math.floor(width * 0.4);
      const centerH = Math.floor(height * 0.4);
      const centerX = Math.floor(width * 0.3);
      const centerY = Math.floor(height * 0.3);

      // Analizar región central (más importante)
      const center = analyzeRegion(
        depthData,
        width,
        height,
        centerX,
        centerY,
        centerX + centerW,
        centerY + centerH
      );

      // Analizar regiones laterales
      const left = analyzeRegion(
        depthData,
        width,
        height,
        0,
        centerY,
        centerX,
        centerY + centerH
      );

      const right = analyzeRegion(
        depthData,
        width,
        height,
        centerX + centerW,
        centerY,
        width,
        centerY + centerH
      );

      // Encontrar la región con el objeto más cercano
      const regions = [
        { ...center, position: "center" as const },
        { ...left, position: "left" as const },
        { ...right, position: "right" as const },
      ];

      const closest = regions.reduce((prev, curr) =>
        curr.min < prev.min ? curr : prev
      );

      const zone = getZone(closest.min);
      
      // Calcular porcentaje del área afectada
      const threshold = fullConfig.warningThreshold;
      let affectedPixels = 0;
      for (let i = 0; i < depthData.length; i++) {
        if (depthData[i] < threshold) affectedPixels++;
      }
      const percentage = (affectedPixels / depthData.length) * 100;

      const obstacle: ObstacleInfo = {
        zone,
        distance: closest.avg,
        closestDistance: closest.min,
        position: closest.position,
        percentage,
      };

      setCurrentObstacle(obstacle);

      // Disparar alerta solo si es CRÍTICO
      if (zone === "critical") {
        await triggerAlert(obstacle);
      }

      return obstacle;
    },
    [analyzeRegion, getZone, triggerAlert, fullConfig]
  );

  /**
   * Resetea el contador de alertas
   */
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