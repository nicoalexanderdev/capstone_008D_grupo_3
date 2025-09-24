import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Speech from "expo-speech";

import { Header } from "../../../components/Header";
import Footer from "../../../components/Footer";
import SlideMenu from "../../../components/SlideMenu";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

import { SentidosList } from "../../../components/SentidosList";
import {
  matchSentidoFromUtterance,
  isGoBack,
  type SentidoType,
} from "../../../utils/voiceSentidoMatch";
import { getLineColor } from "../../../lib/lineColors";

// Hook reutilizable de captura de voz
import { useVoiceCapture } from "../../../hooks/useVoiceCapture";

export default function SentidoScreen() {
  const { lineId, lineName, autoVoice } = useLocalSearchParams<{
    lineId: string;
    lineName: string;
    autoVoice?: string;
  }>();
  const id = lineId ? parseInt(lineId as string) : null;
  const shouldAutoVoice = autoVoice !== "0";

  const [menuOpen, setMenuOpen] = useState(false);
  const [cached, setCached] = useState<SentidoType[]>([]);
  const [announced, setAnnounced] = useState(false);

  const lineColorInfo = useMemo(
    () =>
      lineName
        ? getLineColor(String(lineName))
        : { color: "#2B2A33", textColor: "#FFFFFF" },
    [lineName]
  );

  const {
    isListening,
    recognizedText,
    start,
    stop,
    speakThenListen,
    interruptTTSAndStart,
  } = useVoiceCapture({
    lang: "es-CL",
    onFinalText: (finalText) => {
      if (!finalText) return;
      if (isGoBack(finalText)) {
        router.back();
        return;
      }
      const match = matchSentidoFromUtterance(finalText, cached);
      if (match) handleSentidoPressVoice(match);
    },
  });

  // helper para cortar todo antes de navegar
async function stopVoiceStack() {
  try { Speech.stop(); } catch {}
  try { await ExpoSpeechRecognitionModule.stop(); } catch {}
}

  function onDataLoaded(items: SentidoType[]) {
    setCached(items);
    if (!announced) {
      const names = items.map((s) => s.estacion.name).join(", ");
        speakThenListen(
          `Sentidos disponibles para la ${lineName}. Hacia: ${names}. Puedes decir atrás para volver. Di el sentido que deseas seleccionar.`
        );
        setAnnounced(true);
    }
  }

// ⚠️ separa handlers según origen
async function handleSentidoPressVoice(sentido: SentidoType) {
  await stopVoiceStack();
  router.push({
    pathname: "/linea/[Id]/estaciones",
    params: {
      lineId: sentido.linea_id,
      lineName,
      estacionTerminalName: sentido.estacion.name,
      // NOTA: sin autoVoice -> la pantalla estaciones sí puede hablar/escuchar
    },
  });
}

async function handleSentidoPressTap(sentido: SentidoType) {
  await stopVoiceStack();
  router.push({
    pathname: "/linea/[Id]/estaciones",
    params: {
      lineId: sentido.linea_id,
      lineName,
      estacionTerminalName: sentido.estacion.name,
      autoVoice: "0", // ← si vino por tap, NO auto-hables/escuches
    },
  });
}

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => {}} />

      <View className="flex-1 px-4 py-3">
        <Text className="text-white/80 font-bold mb-4 text-lg">
          Sentidos disponibles para {lineName}
        </Text>

        <SentidosList
          lineId={id || 1}
          onSelect={handleSentidoPressTap}
          onDataLoaded={onDataLoaded}
          cardColor={lineColorInfo.color}
          textColor={lineColorInfo.textColor}
        />

        <View style={{ paddingVertical: 12 }}>
          <Pressable
            onPress={() => {
              if (isListening) {
                stop();
              } else {
                interruptTTSAndStart();
              }
            }}
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
        onBackPress={() => {Speech.stop(); router.back();}}
        onMenuPress={() => setMenuOpen(true)}
        onHomePress={() => {Speech.stop(); router.replace("/")}}
      />

      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
