import { useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import Voice from "@react-native-voice/voice";

export function useVoiceAvailability() {
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  const [recognitionServices, setRecognitionServices] = useState<string[]>([]);
  const isAndroid = Platform.OS === "android";

  useEffect(() => {
    // Registra listeners mínimos (opcional pero recomendado)
    Voice.onSpeechStart = () => console.log("onSpeechStart");
    Voice.onSpeechEnd = () => console.log("onSpeechEnd");
    Voice.onSpeechError = (e) => console.log("onSpeechError", e);
    Voice.onSpeechResults = (e) => console.log("onSpeechResults", e.value);
    Voice.onSpeechPartialResults = (e) =>
      console.log("onSpeechPartialResults", e.value);

    const check = async () => {
      try {
        console.log("Verificando disponibilidad de Voice...");
        const available = await Voice.isAvailable(); // boolean
        setIsVoiceAvailable(Boolean(available));

        // Android: lista de motores instalados (útil para debug)
        if (isAndroid) {
          try {
            const services = await Voice.getSpeechRecognitionServices();
            if (Array.isArray(services)) setRecognitionServices(services);
            console.log("Motores de reconocimiento:", services);
          } catch (e) {
            console.log("No se pudo obtener servicios de reconocimiento:", e);
          }
        }
      } catch (err) {
        console.log("Voice no está disponible:", err);
        setIsVoiceAvailable(false);
      }
    };

    check();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Llama a esto antes de Voice.start(...) (especialmente en Android)
  const ensureMicPermission = async () => {
    if (!isAndroid) return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  return { isVoiceAvailable, recognitionServices, ensureMicPermission };
}
