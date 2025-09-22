// app/confirmacion.tsx (voz + TTS + comandos)
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SlideMenu from "../components/SlideMenu";
import SecondaryButton from "../components/SecondaryButton";
import {isGoBack, isStartAssistant } from "../utils/voiceConfirmacionMatch";

// Hook de voz reutilizable
import { useVoiceCapture } from "../hooks/useVoiceCapture";

export default function ConfirmacionScreen() {
  const { station, access, direction, letra } = useLocalSearchParams<{
    station?: string;
    access?: string;
    direction?: string;
    letra?: string;
  }>();

  const [menuOpen, setMenuOpen] = useState(false);
  const [announced, setAnnounced] = useState(false);

  const stationLabel = station ?? "-";
  const accessLabel = access ?? "-";
  const destinoLabel = direction ? `Andén - ${direction}` : "Andén - -";

  // Hook de voz
  const { isListening, recognizedText, start, stop, speakThenListen } =
    useVoiceCapture({
      lang: "es-CL",
      onFinalText: (finalText) => {
        if (!finalText) return;
        if (isGoBack(finalText)) {
          router.back();
          return;
        }
        if (isStartAssistant(finalText)) {
          router.push("/asistente");
          return;
        }
        // Si dijo otra cosa, seguimos escuchando para otro intento sutilmente
        setTimeout(() => {
          if (!isListening) void start();
        }, 150);
      },
    });

  // Anunciar confirmación y activar micrófono automáticamente
  useEffect(() => {
    if (announced) return;
    const msg =
      `Confirmación de la información. Has seleccionado la estación ${stationLabel}. Acceso letra ${letra}. Dirección de acceso ${accessLabel}. Destino Andén ${direction}.` +
      `Para continuar, di: iniciar, confirmar, o siguiente para iniciar el asistente visual. También puedes decir atrás para volver.`;
    speakThenListen(msg);
    setAnnounced(true);
  }, [announced, stationLabel, accessLabel, speakThenListen]);

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => router.push("/report")} />

      <View className="flex-1 px-4 pt-6">
        <View className="items-center mb-6">
          <Text className="text-white text-2xl font-extrabold text-center">
            Confirmación{"\n"}de información
          </Text>
        </View>
        <View>
          <Text className="text-white/80 text-base mb-1">
            Estación de ingreso:
          </Text>
          <Text className="text-white text-2xl font-extrabold mb-4">
            {stationLabel}
          </Text>
        </View>
        <View>
          <Text className="text-white/80 text-base mb-1">Acceso:</Text>
          <Text className="text-white/80 text-base mb-1">Letra:</Text>
          <Text className="text-white text-2xl font-extrabold mb-4">
            {letra}
          </Text>
          <Text className="text-white/80 text-base mb-1">Dirección:</Text>
          <Text className="text-white text-2xl font-extrabold mb-4">
            {accessLabel}
          </Text>
        </View>
        <View>
          <Text className="text-white/80 text-base mb-1">Destino:</Text>
          <Text className="text-white text-2xl font-extrabold mb-8">
            {destinoLabel}
          </Text>
        </View>

        <View className="items-center mb-6">
          <SecondaryButton
            label="INICIAR ASISTENTE VIRTUAL"
            onPress={() => router.push("/asistente")}
          />
        </View>

        {/* Botón manual por si el usuario quiere reintentar */}
        <View style={{ paddingVertical: 100 }}>
          <Pressable
            onPress={() => (isListening ? stop() : start())}
            className="h-12 rounded-2xl items-center justify-center shadow-lg bg-slate-300"
          >
            <Text>{isListening ? "Detener" : "Grabar"}</Text>
          </Pressable>

          {Boolean(recognizedText) && (
            <Text
              className="text-white px-1 mt-2"
              accessibilityLabel="Texto reconocido"
            >
              {recognizedText}
            </Text>
          )}
        </View>
      </View>

      <Footer
        onBackPress={() => router.back()}
        onMenuPress={() => setMenuOpen(true)}
        onHomePress={() => router.replace("/")}
      />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
