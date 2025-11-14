
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SlideMenu from "../components/SlideMenu";
import SecondaryButton from "../components/SecondaryButton";
import { isGoBack, isStartAssistant } from "../utils/voiceConfirmacionMatch";
import * as Speech from "expo-speech";
import { useVoiceCapture } from "../hooks/useVoiceCapture";

export default function ConfirmacionScreen() {
  const { station, access, direction, letra, sentidoId, accessId } =
    useLocalSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [announced, setAnnounced] = useState(false);

  const stationLabel = station ?? "-";
  const accessLabel = access ?? "-";
  const destinoLabel = direction
    ? `Andén - ${direction}`
    : "Andén - -";

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
      if (isGoBack(finalText)) return router.back();
      if (isStartAssistant(finalText)) return router.push("/asistente");

      setTimeout(() => {
        if (!isListening) start();
      }, 150);
    },
  });

  useEffect(() => {
    if (announced) return;
    const msg =
      `Confirmación de la información. Has seleccionado la estación ${stationLabel}. ` +
      `Acceso letra ${letra}. Dirección ${accessLabel}. Destino Andén ${direction}. ` +
      `Para continuar, di iniciar, confirmar o siguiente. También puedes decir atrás.`;

    speakThenListen(msg);
    setAnnounced(true);
  }, []);

  const first = (v?: string | string[]) =>
    Array.isArray(v) ? v[0] : v;

  function goAsistente() {
    Speech.stop();
    router.push("/asistente");
  }

  function goIndicaciones() {
    Speech.stop();
    const sid = first(sentidoId);
    const aid = first(accessId);
    router.push({
      pathname: "/indicaciones",
      params: { sentidoId: String(sid ?? ""), accessId: String(aid ?? "") },
    });
  }

  return (
    <View className="flex-1 bg-neutral-900">

      {/* HEADER */}
      <Header onReportPress={() => router.push("/report")} />

      {/* ⭐ SCROLL DEL CONTENIDO */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 30,
          paddingHorizontal: 20,
          paddingBottom: 250, // espacio para el botón fijo + footer
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <Text className="text-white text-2xl font-extrabold text-center">
            Confirmación{"\n"}de información
          </Text>
        </View>

        {/* INFO */}
        <View>
          <Text className="text-white/80 text-base mb-1">Estación de ingreso:</Text>
          <Text className="text-white text-2xl font-extrabold mb-4">{stationLabel}</Text>
        </View>

        <View>
          <Text className="text-white/80 text-base mb-1">Acceso:</Text>

          <Text className="text-white/80 text-base mb-1">Letra:</Text>
          <Text className="text-white text-2xl font-extrabold mb-4">{letra}</Text>

          <Text className="text-white/80 text-base mb-1">Dirección:</Text>
          <Text className="text-white text-2xl font-extrabold mb-4">{accessLabel}</Text>
        </View>

        <View>
          <Text className="text-white/80 text-base mb-1">Destino:</Text>
          <Text className="text-white text-2xl font-extrabold mb-8">{destinoLabel}</Text>
        </View>

        {/* BOTONES */}
        <View className="items-center mb-4">
          <SecondaryButton label="INICIAR ASISTENTE VIRTUAL" onPress={goAsistente} />
        </View>

        <View className="items-center mb-4">
          <SecondaryButton label="INICIAR INDICACIONES MAPA" onPress={goIndicaciones} />
        </View>
      </ScrollView>

      {/* ⭐⭐ FOOTER DE GRABAR — EXACTO COMO LA IMAGEN 1 ⭐⭐ */}
      <View
        style={{
          position: "absolute",
          bottom: 95,  // justo arriba del footer original
          left: 0,
          right: 0,
          paddingHorizontal: 16,
        }}
      >
        <Pressable
          onPress={() => {
            if (isListening) stop();
            else interruptTTSAndStart();
          }}
          className="w-full h-14 bg-slate-300 rounded-3xl items-center justify-center shadow-lg"
          android_ripple={{ color: "rgba(0,0,0,0.15)" }}
        >
          <Text className="font-bold text-neutral-900 text-lg">
            {isListening ? "Detener" : "Grabar"}
          </Text>
        </Pressable>

        {Boolean(recognizedText) && (
          <Text className="text-white text-center mt-2">
            {recognizedText}
          </Text>
        )}
      </View>

      {/* ⭐ FOOTER ORIGINAL — SIN TOCAR ⭐ */}
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
