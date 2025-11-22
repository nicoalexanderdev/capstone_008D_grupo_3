import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SlideMenu from "../components/SlideMenu";
import SecondaryButton from "../components/SecondaryButton";
import { isGoBack, isStartAssistant, isIndicacionesMapa } from "../utils/voiceConfirmacionMatch";
import * as Speech from "expo-speech";
import { useVoiceCapture } from "../hooks/useVoiceCapture";

export default function ConfirmacionScreen() {
  const { station, access, direction, letra, sentidoId, accessId } =
    useLocalSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [announced, setAnnounced] = useState(false);

  const stationLabel = station ?? "-";
  const accessLabel = access ?? "-";
  const destinoLabel = direction ? `Andén - ${direction}` : "Andén - -";

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

      const normalized = finalText.toLowerCase();

      // 1. Atrás
      if (isGoBack(finalText)) {
        Speech.stop();
        router.back();
        return;
      }

      // 2. Asistente virtual (por palabra clave o comando general)
      if (normalized.includes("asistente") || isStartAssistant(finalText)) {
        Speech.stop();
        router.push("/asistente");
        return;
      }

      // 3. Indicaciones mapa
      if (isIndicacionesMapa(finalText)) {
        Speech.stop();
        goIndicaciones();
        return;
      }

      // 4. NO se reconoció ninguna opción válida
      Speech.speak(
        "No entendí tu selección. Puedes decir: asistente virtual, indicaciones mapa, iniciar, confirmar o atrás.",
        {
          language: "es-CL",
          rate: 1.1,
          onDone: () => {
            setTimeout(() => start(), 500);
          },
        }
      );
    },
  });

  useEffect(() => {
    if (announced) return;

    const msg = `Confirmación de la información. Estación: ${stationLabel}. Acceso letra ${letra}, dirección ${accessLabel}. Destino: ${destinoLabel}. ` +
      `Di "asistente virtual" para ayuda guiada, o "indicaciones mapa" para ver el recorrido. También puedes decir iniciar, confirmar o atrás.`;

    speakThenListen(msg);
    setAnnounced(true);
  }, [announced, speakThenListen]);

  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

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
    <View className="flex-1 bg-neutral-950">
      {/* HEADER */}
      <Header onReportPress={() => router.push("/report")} />

      <View className="items-center my-5">
        <Text className="text-white text-2xl font-extrabold text-center leading-9">
          Confirmación{"\n"}de información
        </Text>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView
        className="flex-1"
        // contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6 pt-6">
          {/* INFO */}
          <View className="gap-6">
            <View>
              <Text className="text-white/80 text-base mb-1">
                Estación de ingreso:
              </Text>
              <Text className="text-white text-2xl font-extrabold">
                {stationLabel}
              </Text>
            </View>

            <View>
              <Text className="text-white/80 text-base mb-1">Acceso:</Text>

              <View className="ml-4">
                <Text className="text-white/80 text-base mb-1">• Letra:</Text>
                <Text className="text-white text-2xl font-extrabold mb-3">
                  {letra}
                </Text>

                <Text className="text-white/80 text-base mb-1">
                  • Dirección:
                </Text>
                <Text className="text-white text-2xl font-extrabold">
                  {accessLabel}
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-white/80 text-base mb-1">Destino:</Text>
              <Text className="text-white text-2xl font-extrabold">
                {destinoLabel}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTONES */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 20 }}>
        <View className="px-6 pb-4 pt-4 bg-neutral-950 border-t border-neutral-800">
          <View className="gap-0">
            <SecondaryButton
              label="INICIAR ASISTENTE VIRTUAL"
              onPress={goAsistente}
            />

            <SecondaryButton
              label="INICIAR INDICACIONES MAPA"
              onPress={goIndicaciones}
            />
          </View>
        </View>
      </ScrollView>

      {/* BOTÓN DE VOZ FIJO ENCIMA DEL FOOTER */}
      <View
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
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
            className="text-white px-1 my-2"
            accessibilityLabel="Texto reconocido"
          >
            {recognizedText}
          </Text>
        )}
      </View>

      {/* FOOTER */}
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
