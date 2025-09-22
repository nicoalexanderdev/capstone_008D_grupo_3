import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Alert,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "../../../components/Header";
import Footer from "../../../components/Footer";
import SlideMenu from "../../../components/SlideMenu";
import { getLineColor } from "../../../lib/lineColors";
import { useVoiceCapture } from "../../../hooks/useVoiceCapture";
import { EstacionesList } from "../../../components/EstacionesList";
import {
  matchStationFromUtterance,
  isGoBack,
  type EstacionType,
} from "../../../utils/voiceEstacionMatch";

export default function StationsScreen() {
  const { lineId, lineName, estacionTerminalName } = useLocalSearchParams();

  const id = lineId ? parseInt(lineId as string) : null;

  const [cached, setCached] = useState<EstacionType[]>([]);
  const [announced, setAnnounced] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const lineColorInfo = useMemo(
    () =>
      lineName
        ? getLineColor(lineName as string)
        : { color: "#3A3845", textColor: "#FFFFFF" },
    [lineName]
  );

  // ===== Hook de voz =====
  const { isListening, recognizedText, start, stop, speakThenListen } =
    useVoiceCapture({
      lang: "es-CL",
      onFinalText: (finalText) => {
        if (!finalText) return;
        if (isGoBack(finalText)) {
          router.back();
          return;
        }
        const match = matchStationFromUtterance(finalText, cached);
        if (match) {
          handleStationPress(match);
        } else {
          Alert.alert(
            "No se reconoció la estación",
            'Di, por ejemplo: "Universidad de Chile" o "Hacia Ñuble". También puedes decir "atrás" para volver.'
          );
        }
      },
    });

  function onDataLoaded(items: EstacionType[]) {
    setCached(items);
    if (!announced) {
      const names = items.map((s) => s.name).join(", ");
      speakThenListen(
        `Estaciones de la ${lineName} con dirección hacia ${estacionTerminalName}: ${names}. Puedes decir atrás para volver. Por favor, di el nombre de la estacion que deseas seleccionar.`
      );
      setAnnounced(true);
    }
  }

  const handleStationPress = (station: EstacionType) => {
    if (!station || !station.id_estacion) {
      console.error("Estación inválida:", station);
      return; // No navegar si la estación no es válida
    }
    router.push({
      pathname: "/estaciones/[id]/accesos",
      params: {
        idParam: station.id_estacion,
        lineName,
        estacionTerminalName,
        estacionDestinoId: station.id_estacion,
        estacionDestinoName: station.name,
      },
    });
  };

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => router.push("/report")} />

      <Text className="text-white text-3xl mt-5 font-semibold">
        Estaciones de {lineName}
      </Text>
      <Text className="text-white/70 text-lg my-5">
        Dirección: {estacionTerminalName}
      </Text>

      <EstacionesList
        lineId={id || 1}
        onSelect={handleStationPress}
        onDataLoaded={onDataLoaded}
        cardColor={lineColorInfo.color}
        textColor={lineColorInfo.textColor}
      />

      {/* Botón manual por si el usuario quiere reintentar */}
      <View style={{ paddingVertical: 12 }}>
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

      <Footer
        onBackPress={() => router.back()}
        onMenuPress={() => setMenuOpen(true)}
        onHomePress={() => router.replace("/")}
      />

      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
