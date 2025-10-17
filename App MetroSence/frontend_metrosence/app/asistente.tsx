// app/asistente.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  const cameraRef = useRef<CameraView>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const errorCountRef = useRef<number>(0);

  const granted = !!permission?.granted;

  // Hook para MiDaS (detección de profundidad)
  const { loading: midasLoading, error: midasError, runOnImageUri, inputDims } = useMidasModel(MIDAS_MODEL_URL);
  
  // Hook para YOLO (detección de objetos)
  const { 
    loading: yoloLoading, 
    error: yoloError, 
    detectObjects,
    model: yoloModel,
    isReady: yoloReady,
  } = useYoloModel(YOLO_MODEL_URL, 0.01, 0.45);
  
  // Debug: Verificar que los modelos son diferentes
  useEffect(() => {
    if (yoloModel) {
      console.log("🤖 YOLO Model outputs:", (yoloModel as any).outputs);
      console.log("🟢 YOLO Ready:", yoloReady);
    }
  }, [yoloModel, yoloReady]);
  
  // Hook para detección de obstáculos
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
    enableHaptics: false,
  });

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

  // Función para anunciar objeto detectado más cercano
  const announceDetectedObject = (objects: YoloDetection[], obstacle: any) => {
    if (!objects || objects.length === 0) return;

    // Encontrar el objeto con mayor confianza en la zona de peligro
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

  // Función para escanear en tiempo real
const scanForObstacles = async () => {
  try {
    const cam = cameraRef.current;
    if (!cam || !isCameraReady) return;

    console.log("📸 Tomando foto...");
    const photo = await cam.takePictureAsync({
      quality: 0.7,
      base64: false,
      skipProcessing: true,
    });

    console.log("📸 Foto capturada:", photo.uri);

    // 1. Ejecutar MiDaS para obtener mapa de profundidad
    console.log("🌊 Ejecutando MiDaS...");
    const depthResult = await runOnImageUri(photo.uri);
    console.log("✅ MiDaS completado");
    
    // 2. Ejecutar YOLO para detectar objetos
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
      // Continuar incluso si YOLO falla
    }
    
    // Reset error count on success
    errorCountRef.current = 0;
    
    // 3. Analizar el mapa de profundidad
    console.log("📊 Analizando profundidad...");
    const obstacleDetected = await analyzeDepthMap(
      depthResult.data,
      inputDims.w,
      inputDims.h
    );

    // 4. Si hay obstáculo y objetos detectados, anunciar
    if (currentObstacle && currentObstacle.zone !== "safe" && objects.length > 0) {
      announceDetectedObject(objects, currentObstacle);
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

  // Iniciar escaneo continuo
  const startScanning = () => {
    if (isScanning) return;
    
    setIsScanning(true);
    resetAlerts();
    setDetectedObjects([]);
    errorCountRef.current = 0;
    Speech.speak("Detección iniciada. Explorando el entorno.", {language: "es"});

    // Escanear cada 5 segundos
    scanIntervalRef.current = setInterval(scanForObstacles, 5000);
  };

  // Detener escaneo
  const stopScanning = () => {
    if (!isScanning) return;
    
    setIsScanning(false);
    setDetectedObjects([]);
    Speech.speak("Detección detenida.", {language: "es"});
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Anunciar estado inicial
  useEffect(() => {
    if (!permission) return;
    if (granted) {
      Speech.speak("Cámara lista. Di iniciar para comenzar la detección.", {language: "es"});
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

  // Función para obtener el color según la zona
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

  return (
    <View style={styles.root}>
      {/* Vista de cámara */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setIsCameraReady(true)}
        />
        
        {/* Overlay con información */}
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

            {/* Información técnica */}
            {currentObstacle && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Distancia: {currentObstacle.closestDistance.toFixed(0)}
                </Text>
                <Text style={styles.infoText}>
                  Cobertura: {currentObstacle.percentage.toFixed(1)}%
                </Text>
              </View>
            )}

            {/* Objetos detectados */}
            {detectedObjects.length > 0 && (
              <View style={styles.objectsBox}>
                <Text style={styles.objectsTitle}>Objetos detectados:</Text>
                {detectedObjects.slice(0, 3).map((obj, idx) => (
                  <Text key={idx} style={styles.objectText}>
                    • {obj.className} ({(obj.confidence * 100).toFixed(0)}%)
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Controles */}
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
  infoBox: {
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    color: "white",
    fontSize: 14,
    fontFamily: "monospace",
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