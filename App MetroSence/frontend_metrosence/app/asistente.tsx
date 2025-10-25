// app/asistente.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions, Camera } from "expo-camera";
import * as Speech from "expo-speech";
import { useMidasModel } from "../hooks/useMidasModel";
import { useObstacleDetector } from "../hooks/useObstacleDetector";
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import { useYoloModel, type YoloDetection } from "../hooks/useYoloModel";

const MIDAS_MODEL_URL = process.env.EXPO_PUBLIC_TFLITE_MIDAS_URL || "";
const YOLO_MODEL_URL = process.env.EXPO_PUBLIC_TFLITE_YOLO_URL || "";

// Debug: Verificar URLs
console.log("🔗 URL MiDaS:", MIDAS_MODEL_URL);
console.log("🔗 URL YOLO:", YOLO_MODEL_URL);

function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!¡¿?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function intentFromSpeech(text: string): "accept" | "deny" | "back" | "start" | "stop" | "none" {
  const t = normalize(text);
  if (!t) return "none";
  
  if (/\b(permitir|aceptar|conceder|otorgar|si|sí|ok|continuar)\b/.test(t))
    return "accept";
  if (/\b(no|rechazar|denegar|cancelar)\b/.test(t)) return "deny";
  if (/\b(iniciar|empezar|comenzar|activar|start)\b/.test(t)) return "start";
  if (/\b(detener|parar|stop|desactivar)\b/.test(t)) return "stop";
  if (
    t.includes("volver atras") ||
    t.includes("volver atrás") ||
    /\b(atras|atrás|regresar|volver)\b/.test(t)
  )
    return "back";
  return "none";
}

export default function AssistantScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<YoloDetection[]>([]);
  const [cameraDimensions, setCameraDimensions] = useState({ width: 0, height: 0 });
  const cameraRef = useRef<CameraView>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const errorCountRef = useRef<number>(0);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const granted = !!permission?.granted;

  const { loading: midasLoading, error: midasError, runOnImageUri, inputDims } = useMidasModel(MIDAS_MODEL_URL);
  const { 
    loading: yoloLoading, 
    error: yoloError, 
    detectObjects,
    model: yoloModel,
    isReady: yoloReady,
  } = useYoloModel(YOLO_MODEL_URL, 0.30, 0.45);
  const {
    analyzeDepthMap,
    currentObstacle,
    isAlerting,
    resetAlerts,
  } = useObstacleDetector({
    criticalThreshold: 380,
    dangerThreshold: 480,
    minAlertInterval: 2500,
    enableVoice: true,
    enableHaptics: true,
  });

  useEffect(() => {
    if (yoloModel) {
      console.log("🤖 YOLO Model outputs:", (yoloModel as any).outputs);
      console.log("🟢 YOLO Ready:", yoloReady);
    }
  }, [yoloModel, yoloReady]);

  const handleCameraLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraDimensions({ width, height });
    console.log(`📏 Camera container: ${width}x${height}`);
  };

  const { speakThenListen } = useVoiceCapture({
    lang: "es-CL",
    onFinalText: async (finalText) => {
      const intent = intentFromSpeech(finalText);
      
      if (intent === "accept") {
        const res = await requestPermission();
        if (res?.granted) {
          Speech.speak("Permiso concedido. Di iniciar para comenzar la detección.");
        } else {
          speakThenListen(
            "No se concedió el permiso. ¿Deseas intentarlo otra vez?"
          );
        }
        return;
      }
      
      if (intent === "start") {
        if (!isScanning) {
          startScanning();
        }
        return;
      }
      
      if (intent === "stop") {
        if (isScanning) {
          stopScanning();
        }
        return;
      }
      
      if (intent === "back") {
        stopScanning();
        router.back();
        return;
      }
      
      if (intent === "deny") {
        speakThenListen("Entendido. Puedes decir volver para regresar.");
        return;
      }
    },
  });

  const announceDetectedObject = (objects: YoloDetection[], obstacle: any) => {
    if (!objects || objects.length === 0) return;

    const topObject = objects.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );

    if (topObject.confidence > 0.5) {
      const position = obstacle.position === "center" 
        ? "al frente" 
        : obstacle.position === "left" 
        ? "a la izquierda" 
        : "a la derecha";
      
      Speech.speak(
        `${topObject.className} detectado ${position}`,
        { language: "es" }
      );
    }
  };

  const scanForObstacles = async () => {
    try {
      const cam = cameraRef.current;
      if (!cam || !isCameraReady) return;

      console.log("📸 Tomando foto...");
      const photo = await cam.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
        shutterSound: false,
      });

      console.log("📸 Foto capturada:", photo.uri);

      console.log("🌊 Ejecutando MiDaS...");
      const depthResult = await runOnImageUri(photo.uri);
      console.log("✅ MiDaS completado");
      
      console.log("🚀 Iniciando YOLO...");
      let objects: YoloDetection[] = [];
      try {
        console.log("📞 Llamando a detectObjects...");
        objects = await detectObjects(photo.uri);
        console.log(`🎯 YOLO retornó: ${objects.length} objetos`);
        setDetectedObjects(objects);
        console.log(`🎯 YOLO completado: ${objects.length} objetos detectados`);
        
        if (objects.length > 0) {
          objects.forEach((obj, idx) => {
            console.log(`   ${idx + 1}. ${obj.className} (${(obj.confidence * 100).toFixed(1)}%)`);
          });
        }
      } catch (yoloErr) {
        console.error("❌ Error en YOLO:", yoloErr);
      }
      
      errorCountRef.current = 0;
      
      console.log("📊 Analizando profundidad...");
      const obstacleDetected = await analyzeDepthMap(
        depthResult.data,
        inputDims.w,
        inputDims.h,
        objects
      );

      if (obstacleDetected && obstacleDetected.zone !== "safe" && objects.length > 0) {
        announceDetectedObject(objects, obstacleDetected);
      }

    } catch (err: any) {
      console.error("❌ Error en scanForObstacles:", err);
      errorCountRef.current++;
      console.log(`⚠️ Conteo de errores: ${errorCountRef.current}`);
      
      if (errorCountRef.current > 3) {
        stopScanning();
        Speech.speak("Se detuvo la detección por errores técnicos.");
        Alert.alert(
          "Error",
          "Hubo problemas con la detección. Revisa la consola para más detalles."
        );
      }
    }
  };

  const startScanning = () => {
    if (isScanning) return;
    
    setIsScanning(true);
    resetAlerts();
    setDetectedObjects([]);
    errorCountRef.current = 0;
    Speech.speak("Detección iniciada. Explorando el entorno.", { language: "es" });

    scanIntervalRef.current = setInterval(scanForObstacles, 6000);
  };

  const stopScanning = () => {
    if (!isScanning) return;
    
    setIsScanning(false);
    setDetectedObjects([]);
    Speech.speak("Detección detenida.", { language: "es" });
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!permission) return;
    if (granted) {
      Speech.speak("Cámara lista. Di iniciar para comenzar la detección.", { language: "es" });
    } else {
      speakThenListen(
        "Para continuar necesito tu permiso para usar la cámara. Di permitir para conceder."
      );
    }
  }, [granted, !!permission]);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando permisos…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionsContainer}>
        <Text style={styles.message}>Necesito permiso de cámara</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getZoneColor = () => {
    if (!currentObstacle) return "#10b981";
    switch (currentObstacle.zone) {
      case "critical": return "#ef4444";
      case "danger": return "#f59e0b";
      default: return "#10b981";
    }
  };

  const getZoneText = () => {
    if (!currentObstacle) return "Sin obstáculos";
    switch (currentObstacle.zone) {
      case "critical": return "⚠️ PELIGRO CRÍTICO";
      case "danger": return "⚠️ OBJETO CERCANO";
      default: return "✓ RUTA DESPEJADA";
    }
  };

  const modelsLoading = midasLoading || yoloLoading;
  const modelsError = midasError || yoloError;

  const getTopDetection = (): YoloDetection | null => {
    if (detectedObjects.length === 0) return null;
    
    return detectedObjects.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );
  };

  const scaleBoundingBox = (bbox: YoloDetection["bbox"]) => {
    const yoloWidth = 640;
    const yoloHeight = 640;
    const targetWidth = cameraDimensions.width > 0 ? cameraDimensions.width : screenWidth;
    const targetHeight = cameraDimensions.height > 0 ? cameraDimensions.height : screenHeight;
    
    const scaled = {
      x: (bbox.x / yoloWidth) * targetWidth,
      y: (bbox.y / yoloHeight) * targetHeight,
      width: (bbox.width / yoloWidth) * targetWidth,
      height: (bbox.height / yoloHeight) * targetHeight,
    };
    
    console.log(
      `📍 BBox: ${bbox.x.toFixed(0)},${bbox.y.toFixed(0)},${bbox.width.toFixed(0)},${bbox.height.toFixed(0)} ` +
      `-> Scaled: ${scaled.x.toFixed(0)},${scaled.y.toFixed(0)},${scaled.width.toFixed(0)},${scaled.height.toFixed(0)}`
    );
    
    return scaled;
  };

  return (
    <View style={styles.root}>
      <View style={styles.cameraContainer} onLayout={handleCameraLayout}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setIsCameraReady(true)}
        />
        
        {isScanning && (
          <View style={styles.overlay}>
            {currentObstacle && (
              <View
                style={[
                  styles.alertBanner,
                  { backgroundColor: getZoneColor() },
                  isAlerting && styles.alertBannerPulsing,
                ]}
              >
                <Text style={styles.alertText}>{getZoneText()}</Text>
                <Text style={styles.alertSubtext}>
                  {currentObstacle.position === "center"
                    ? "Al frente"
                    : currentObstacle.position === "left"
                    ? "A la izquierda"
                    : "A la derecha"}
                </Text>
              </View>
            )}

            {/* Bounding boxes de YOLO (máximo 3, ordenados por confianza) */}
            {[...detectedObjects]
              .sort((a, b) => b.confidence - a.confidence) // Ordenar por confianza descendente
              .slice(0, 3) // Tomar solo los primeros 3
              .map((obj, index) => {
                const scaledBbox = scaleBoundingBox(obj.bbox);
                const borderColor = obj.confidence > 0.7 ? "#3b82f6" : "#ef4444";
                return (
                  <View
                    key={index}
                    style={[
                      styles.bbox,
                      {
                        left: scaledBbox.x,
                        top: scaledBbox.y,
                        width: scaledBbox.width,
                        height: scaledBbox.height,
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={styles.bboxText}>
                      {obj.className} ({(obj.confidence * 100).toFixed(0)}%)
                    </Text>
                  </View>
                );
              })}

            {detectedObjects.length > 0 && (() => {
              const topObject = getTopDetection();
              if (!topObject) return null;
              
              return (
                <View style={styles.objectsBox}>
                  <Text style={styles.objectsTitle}>Objeto Principal:</Text>
                  <Text style={styles.objectText}>
                    • {topObject.className} ({(topObject.confidence * 100).toFixed(0)}%)
                  </Text>
                </View>
              );
            })()}
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.modelStatus}>
          MiDaS: {midasLoading ? "Cargando…" : midasError ? "Error" : "✅"}
          {" | "}
          YOLO: {yoloLoading ? "Cargando…" : yoloError ? "Error" : "✅"}
        </Text>
        
        {!isScanning ? (
          <TouchableOpacity
            disabled={modelsLoading || !!modelsError || !isCameraReady}
            onPress={startScanning}
            style={[
              styles.startBtn,
              (modelsLoading || modelsError || !isCameraReady) && styles.btnDisabled,
            ]}
          >
            <Text style={styles.btnText}>▶ Iniciar Detección</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={stopScanning}
            style={styles.stopBtn}
          >
            <Text style={styles.btnText}>■ Detener</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            stopScanning();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Text style={styles.btnText}>← Volver</Text>
        </TouchableOpacity>

        {isScanning && (
          <View style={styles.scanningIndicator}>
            <View style={styles.pulse} />
            <Text style={styles.scanningText}>Escaneando...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0f" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cameraContainer: { flex: 1, position: "relative" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 40,
  },
  alertBanner: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
    minWidth: "80%",
  },
  alertBannerPulsing: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  alertText: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  alertSubtext: {
    color: "white",
    fontSize: 16,
    marginTop: 4,
    opacity: 0.9,
  },
  bbox: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "solid",
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  bboxText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 4,
    borderRadius: 4,
    position: "absolute",
    top: -20,
  },
  objectsBox: {
    marginTop: 12,
    backgroundColor: "rgba(59, 130, 246, 0.8)",
    padding: 12,
    borderRadius: 8,
    minWidth: "70%",
  },
  objectsTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  objectText: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: "#1a1a1f",
  },
  modelStatus: {
    color: "#fbbf24",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 12,
  },
  startBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  stopBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: "#6b7280",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  message: {
    marginBottom: 16,
    fontSize: 16,
    color: "white",
  },
  primaryBtn: {
    backgroundColor: "#7dd3fc",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryText: {
    color: "#0b0b0f",
    fontWeight: "700",
    fontSize: 16,
  },
  scanningIndicator: {
    marginTop: 16,
    alignItems: "center",
  },
  pulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    marginBottom: 8,
  },
  scanningText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600",
  },
});