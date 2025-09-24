import {
  useWindowDimensions,
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Header } from "../components/Header";
import Hero from "../components/Hero";
import Footer2 from "../components/Footer2";
import SlideMenu from "../components/SlideMenu";
import { useState } from "react";
import { LinesList } from "../components/LinesList";
import {
  matchLineFromUtterance,
  type MetroLine,
} from "../utils/voiceLinesMatch";
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import * as Speech from "expo-speech";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  const ITEM_GAP = 30;
  const isLargeScreen = width > 768;

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
      if (!cachedLines.length) return;
      const match = matchLineFromUtterance(finalText, cachedLines);
      if (match) handleLinePress(match);
    },
  });

  const [cachedLines, setCachedLines] = useState<MetroLine[]>([]);

  async function handleLinePress(line: MetroLine) {
    try {
      // corta cualquier TTS en curso
      Speech.stop();
      // corta cualquier reconocimiento en curso
      await ExpoSpeechRecognitionModule.stop();
    } catch {}

    router.push({
      pathname: "/linea/[Id]/sentidos",
      params: {
        lineId: String(line.id_linea),
        lineName: line.name,
      },
    });
  }

  function onDataLoaded(lines: MetroLine[]) {
    setCachedLines(lines);
    const lineNames = lines.map((l) => l.name).join(", ");
    Speech.speak(
      `Hola, Bienvenido a Metro Sence, ¿Dónde vamos hoy?. Líneas de Metro disponibles: ${lineNames}. Por favor, di el nombre de la línea que deseas seleccionar.`,
      {
        language: "es",
        onDone: () => {
          setTimeout(() => {
            if (!isListening) void start();
          }, 200);
        },
        onPause: () => {
          setTimeout(() => {
            if (!isListening) void start();
          }, 200);
        },
      }
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      {/** background image overlay (small screens) */}
      {!isLargeScreen && (
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require("../assets/metro-maps.png")}
            style={styles.backgroundImage}
            resizeMode="cover"
            accessibilityLabel="Mapa del Metro de fondo"
          />
          <View style={styles.backgroundOverlay} />
        </View>
      )}

      <Header onReportPress={() => {}} />
      <Hero />

      <View className="flex-1 my-5">
        <Text className="text-white/80 font-bold mb-4 text-lg px-4">
          Líneas de Metro
        </Text>

        <LinesList
          onSelect={handleLinePress}
          onDataLoaded={onDataLoaded}
          itemGap={ITEM_GAP}
          isLargeScreen={isLargeScreen}
        />

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
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

      <Footer2 onMenuPress={() => setMenuOpen(true)} />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    opacity: 0.4,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(43, 42, 51, 0.7)",
  },
});
