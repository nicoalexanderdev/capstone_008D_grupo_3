import { useEffect, useRef, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import * as Speech from "expo-speech";
import { Alert, Platform } from "react-native";

export type VoiceCaptureOptions = {
  lang?: string; // e.g., 'es-CL'
  autoPermissionPrompt?: boolean; // ask mic/speech permission on start()
  onFinalText?: (finalText: string) => void; // called after 'end' with best transcript
};

export function useVoiceCapture(options?: VoiceCaptureOptions) {
  const {
    lang = "es-CL",
    autoPermissionPrompt = true,
    onFinalText,
  } = options || {};

  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const recognizedRef = useRef("");
  const bestTextRef = useRef("");

  useEffect(() => {
    recognizedRef.current = recognizedText;
  }, [recognizedText]);

  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    const finalText = (
      bestTextRef.current ||
      recognizedRef.current ||
      ""
    ).trim();
    bestTextRef.current = ""; // reset for next session
    if (onFinalText) onFinalText(finalText);
  });

  useSpeechRecognitionEvent("result", (e: ExpoSpeechRecognitionResultEvent) => {
    // Pick best alternative (longest string)
    const alts: string[] = (e?.results ?? [])
      .map((r: any) => String(r?.transcript ?? "").trim())
      .filter(Boolean);
    const text = alts.sort((a, b) => b.length - a.length)[0] ?? "";
    setRecognizedText(text);

    // heuristic to keep best of session
    const hasNumKey = /\b\d+a?\b/.test(text.toLowerCase());
    if (hasNumKey || text.length > (bestTextRef.current?.length || 0)) {
      bestTextRef.current = text;
    }
  });

  useSpeechRecognitionEvent("error", (e) => {
    console.log("SR error:", e.error, e.message);
    setIsListening(false);
    Alert.alert("Error de voz", e.message ?? "Fallo en reconocimiento");
  });

  async function start() {
    if (isListening) return;

    if (Platform.OS === "web") {
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        Alert.alert(
          "No disponible",
          "El navegador no soporta reconocimiento de voz."
        );
        return;
      }
    }

    try {
      if (autoPermissionPrompt) {
        const perm =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Permisos denegados",
            "No se otorgaron permisos de micrófono/reconocimiento."
          );
          return;
        }
      }

      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        Alert.alert(
          "Sin servicio de reconocimiento",
          "Activa el servicio de reconocimiento de voz en tu dispositivo."
        );
        return;
      }

      await ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.log("Error start():", error);
      setIsListening(false);
      Alert.alert(
        "Error de micrófono",
        "No se pudo iniciar el reconocimiento de voz."
      );
    }
  }

  async function stop() {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.log("Error stop():", error);
    }
  }

  function speakThenListen(text: string) {
    Speech.speak(text, {
      language: lang.startsWith("es") ? "es" : lang,
      onDone: () => {
        setTimeout(() => {
          if (!isListening) void start();
        }, 200);
      },
      onStopped: () => {
        setTimeout(() => {
          if (!isListening) void start();
        }, 200);
      },
    });
  }

  return { isListening, recognizedText, start, stop, speakThenListen };
}
