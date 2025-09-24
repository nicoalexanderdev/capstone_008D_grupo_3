import React, { useState, useMemo, useEffect } from "react";
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
import { getAllEstacionesPorLinea } from "../../../lib/estaciones";
import {
  matchStationFromUtterance,
  isGoBack,
  type EstacionType,
} from "../../../utils/voiceEstacionMatch";
import * as Speech from "expo-speech";

export default function StationsScreen() {
  const { lineId, lineName, estacionTerminalName } = useLocalSearchParams();

  const id = lineId ? parseInt(lineId as string) : null;

  const [skip, setSkip] = useState(0);
  const [cached, setCached] = useState<EstacionType[]>([]);
  const [allStations, setAllStations] = useState<EstacionType[]>([]);

  const [announced, setAnnounced] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingAllStations, setLoadingAllStations] = useState(true);

  const lineColorInfo = useMemo(
    () =>
      lineName
        ? getLineColor(lineName as string)
        : { color: "#3A3845", textColor: "#FFFFFF" },
    [lineName]
  );

    useEffect(() => {
    if (id) {
      setLoadingAllStations(true);
      (async () => {
        try {
          const allStationsData = await getAllEstacionesPorLinea(id);
          setAllStations(allStationsData);
        } catch (error) {
          console.error("Error loading all stations:", error);
        } finally {
          setLoadingAllStations(false);
        }
      })();
    }
  }, [id]);

  // ===== Hook de voz =====
  const { isListening, recognizedText, start, stop, speakThenListen, interruptTTSAndStart } =
    useVoiceCapture({
      lang: "es-CL",
      onFinalText: (finalText) => {
        if (!finalText) return;
        if (isGoBack(finalText)) {
          router.back();
          return;
        }
        if (finalText.toLowerCase() === "más" || finalText.toLowerCase() === "mas") {
          if (!hasMore) {
            // Si no hay más estaciones, avisar al usuario
            Speech.speak("Ya has llegado a la última estación. No hay más estaciones para mostrar.", {
              language: "es"
            });
            return;
          }
          const newSkip = skip + 10;
          setSkip(newSkip);
          // Reiniciar announced para que se anuncie la nueva lista
          setAnnounced(false);
          return;
        }
        const match = matchStationFromUtterance(finalText, allStations);
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

  const getCurrentRangeText = () => {
    const startRange = skip + 1;
    const endRange = skip + 10;
    return `estaciones ${startRange} a ${endRange}`;
  };

  function onDataLoaded(items: EstacionType[], hasMoreItems: boolean) {
    setCached(items);
    setHasMore(hasMoreItems);

    if (!announced) {
      const names = items.map((s) => s.name).join(", ");

      const moreMessage = hasMoreItems 
        ? 'Di "más" para nombrarte las siguientes 10 estaciones.'
        : 'Estas son todas las estaciones de la línea.';

      speakThenListen(
        `Estaciones de la ${lineName} con dirección hacia ${estacionTerminalName}. 
        Por favor, di el nombre de la estación que deseas seleccionar, aprieta el botón de grabar si ya sabes la estación en la que estas.
        Puedes decir atrás para volver.
        Te nombraré las  ${getCurrentRangeText()}: ${names}. ${moreMessage}.`
      );
      setAnnounced(true);
    }
  }

  const handleStationPress = (station: EstacionType) => {
    Speech.stop();
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

  useEffect(() => {
    setSkip(0);
    setHasMore(true);
    setAnnounced(false);
  }, [lineId, estacionTerminalName]);

   // Si estamos cargando todas las estaciones, mostrar un indicador
  if (loadingAllStations) {
    return (
      <View className="flex-1 bg-neutral-900 items-center justify-center">
        <Text className="text-white text-lg">Cargando estaciones...</Text>
      </View>
    );
  }


  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => router.push("/report")} />

      <Text className="text-white text-3xl mt-5 font-semibold">
        Estaciones de {lineName}
      </Text>
      <Text className="text-white/70 text-lg my-5">
        Dirección: {estacionTerminalName}
      </Text>

      {/* Indicador de página actual */}
      <Text className="text-white/50 text-sm mb-5">
        Mostrando {getCurrentRangeText()}
        {!hasMore && " (Últimas estaciones)"}
      </Text>

      <EstacionesList
        lineId={id || 1}
        onSelect={handleStationPress}
        onDataLoaded={onDataLoaded}
        cardColor={lineColorInfo.color}
        textColor={lineColorInfo.textColor}
        skip={skip}
      />

      {/* Botón manual por si el usuario quiere reintentar */}
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

      <Footer
        onBackPress={() => {Speech.stop(); router.back();}}
        onMenuPress={() => setMenuOpen(true)}
        onHomePress={() => {Speech.stop(); router.replace("/")}}
      />

      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
