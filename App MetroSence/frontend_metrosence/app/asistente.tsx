// app/asistente.tsx (voz para pedir permisos + confirmar/denegar)
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
} from "react-native";
import { router } from "expo-router";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SlideMenu from "../components/SlideMenu";
import * as Speech from "expo-speech";
import { useRemoteTFLiteModel } from "../hooks/useRemoteTFLiteModel";

// Hook de voz reutilizable
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import { useMidasModel } from "../hooks/useMidasModel";

function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!¡¿?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function intentFromSpeech(text: string): "accept" | "deny" | "back" | "none" {
  const t = normalize(text);
  if (!t) return "none";
  // aceptar: permitir, aceptar, conceder, otorgar, si, sí, ok, continuar
  if (/\b(permitir|aceptar|conceder|otorgar|si|sí|ok|continuar)\b/.test(t))
    return "accept";
  // denegar: no, rechazar, denegar, cancelar
  if (/\b(no|rechazar|denegar|cancelar)\b/.test(t)) return "deny";
  // volver atrás
  if (
    t.includes("volver atras") ||
    t.includes("volver atrás") ||
    /\b(atras|atrás|regresar|volver)\b/.test(t)
  )
    return "back";
  return "none";
}

export default async function AssistantScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [depthMap, setDepthMap] = useState<number[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const granted = !!permission?.granted;

  const { model, loading, error } = useRemoteTFLiteModel(
    process.env.EXPO_PUBLIC_TFLITE_MIDAS_URL
  );

  if (model) {
    console.log("Modelo MiDaS cargado:", model);
  }

  if (error) {
    console.error("Error cargando modelo MiDaS:", error);
  }

  // Hook de MiDaS
  const {
    isLoading: modelLoading,
    error: modelError,
    estimateDepth,
    reloadModel,
  } = useMidasModel();

  // Hook de voz: lee el mensaje y escucha la respuesta del usuario
  const {
    isListening,
    recognizedText,
    start,
    stop,
    speakThenListen,
    interruptTTSAndStart,
  } = useVoiceCapture({
    lang: "es-CL",
    onFinalText: async (finalText) => {
      const intent = intentFromSpeech(finalText);
      if (intent === "accept") {
        const res = await requestPermission();
        if (res?.granted) {
          // Confirmar por voz que se concedió
          Speech.speak(
            "Permiso concedido. La cámara está lista. Puedes decir volver para regresar."
          );
        } else {
          speakThenListen(
            "No se concedió el permiso. ¿Deseas intentarlo otra vez? Di permitir u ok, o di no para cancelar."
          );
        }
        return;
      }
      if (intent === "deny") {
        speakThenListen(
          "Entendido, no activaré la cámara. Puedes decir volver para regresar."
        );
        return;
      }
      if (intent === "back") {
        router.back();
        return;
      }
      // Si no entendimos, repreguntamos
      if (!granted) {
        speakThenListen(
          "No te escuché bien. ¿Deseas permitir el uso de la cámara? Di permitir u ok, o di no para cancelar."
        );
      }
    },
  });

  // Capturar y procesar imagen
  // En tu función captureAndProcess:
  const captureAndProcess = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      Speech.speak("Capturando imagen para análisis de profundidad.", {language: "es"});

      // Tomar foto
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      setCapturedImage(photo.uri);

      // Procesar con MiDaS
      const depth = await estimateDepth(photo.uri);
      setDepthMap(depth);

      if (depth) {
        Speech.speak("Análisis de profundidad completado exitosamente.",  {language: "es"});
        console.log("Mapa de profundidad:", depth.length, "puntos");
      } else {
        Speech.speak("No se pudo analizar la profundidad.");
      }
    } catch (error) {
      console.error("Error:", error);
      Speech.speak("Error al procesar la imagen.",  {language: "es"});
    } finally {
      setIsProcessing(false);
    }
  };

  // Reiniciar cámara
  const resetCamera = () => {
    setCapturedImage(null);
    setDepthMap(null);
  };

  // Al entrar o cuando cambie el estado de permisos, anuncia y activa escucha
  useEffect(() => {
    if (!permission) return; // aún cargando
    if (granted) {
      // Ya está concedido
      Speech.speak("Permiso de cámara concedido.", { language: "es" });
    } else {
      speakThenListen(
        "Para continuar necesito tu permiso para usar la cámara. Di permitir u ok para conceder, o di no para cancelar."
      );
    }
  }, [granted, !!permission]);

  return (
    <View style={styles.root}>
      <Header onReportPress={() => router.push("/report")} />

      {!granted ? (
        <View style={styles.permissionsContainer}>
          <Text style={styles.message}>
            Necesitamos tu permiso para usar la cámara y el modelo MiDaS de
            profundidad.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryText}>Conceder permiso</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (isListening) stop();
              else interruptTTSAndStart();
            }}
            style={[styles.micBtn, isListening && { opacity: 0.85 }]}
          >
            <Text style={styles.micText}>
              {isListening ? "Detener" : "Usar Voz"}
            </Text>
          </Pressable>

          {!!recognizedText && (
            <Text style={styles.recognized}>Escuché: {recognizedText}</Text>
          )}
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          {!capturedImage ? (
            <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          ) : (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.previewImage}
              />
              {depthMap && (
                <View style={styles.depthInfo}>
                  <Text style={styles.depthText}>
                    Análisis MiDaS completado. {depthMap.length} puntos de
                    profundidad.
                  </Text>
                  <Text style={styles.depthStats}>
                    Rango: {Math.min(...depthMap).toFixed(2)} -{" "}
                    {Math.max(...depthMap).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Controles */}
          <View style={styles.controlsContainer}>
            {!capturedImage ? (
              <>
                <Pressable
                  onPress={captureAndProcess}
                  style={[styles.captureBtn, isProcessing && { opacity: 0.6 }]}
                  disabled={isProcessing || modelLoading}
                >
                  <Text style={styles.captureText}>
                    {isProcessing ? "Procesando..." : "Analizar Profundidad"}
                  </Text>
                </Pressable>

                {modelLoading && (
                  <Text style={styles.modelStatus}>
                    Cargando modelo MiDaS...
                  </Text>
                )}

                {modelError && (
                  <Text style={styles.errorText}>Error: {modelError}</Text>
                )}
              </>
            ) : (
              <Pressable onPress={resetCamera} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Nueva Captura</Text>
              </Pressable>
            )}

            {/* Micrófono */}
            <Pressable
              onPress={() => {
                if (isListening) stop();
                else interruptTTSAndStart();
              }}
              style={[styles.micBtn, isListening && { opacity: 0.85 }]}
            >
              <Text style={styles.micText}>
                {isListening ? "Detener" : "Comandos Voz"}
              </Text>
            </Pressable>

            {!!recognizedText && (
              <Text style={styles.recognized}>Escuché: {recognizedText}</Text>
            )}
          </View>
        </View>
      )}

      <Footer
        onBackPress={() => {
          Speech.stop();
          router.back();
        }}
        onMenuPress={() => setMenuOpen(true)}
        onHomePress={() => {
          Speech.stop();
          router.replace("/");
        }}
      />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0f" },
  permissionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cameraContainer: { flex: 1 },
  message: {
    textAlign: "center",
    paddingBottom: 12,
    color: "white",
    opacity: 0.9,
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: "#7dd3fc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryText: {
    color: "#0b0b0f",
    fontWeight: "700",
  },
  camera: { flex: 1 },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  previewImage: {
    width: "100%",
    height: "70%",
    resizeMode: "contain",
  },
  depthInfo: {
    padding: 16,
    alignItems: "center",
  },
  depthText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  depthStats: {
    color: "#7dd3fc",
    fontSize: 14,
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  captureBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  captureText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryText: {
    color: "white",
    fontWeight: "700",
  },
  modelStatus: {
    color: "#fbbf24",
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 8,
  },
  micBtn: {
    backgroundColor: "#cbd5e1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  micText: {
    color: "#0b0b0f",
    fontWeight: "700",
  },
  recognized: {
    color: "white",
    marginTop: 8,
    opacity: 0.8,
    textAlign: "center",
  },
});
