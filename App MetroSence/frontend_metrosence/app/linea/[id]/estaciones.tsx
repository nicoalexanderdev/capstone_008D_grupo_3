import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "../../../components/Header";
import Footer from "../../../components/Footer";
import SlideMenu from "../../../components/SlideMenu";
import StationButton from "../../../components/StationButton";
import { getEstacionesPorLinea, Estacion } from "../../../lib/estaciones";
import { getLineColor } from "../../../lib/lineColors";
import * as Speech from "expo-speech";

export default function StationsScreen() {
  const { lineId, lineName, estacionTerminalName } = useLocalSearchParams();

  const id = lineId ? parseInt(lineId as string) : null;

  const [stations, setStations] = useState<Estacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const lineColorInfo = lineName
    ? getLineColor(lineName as string)
    : { color: "#3A3845", textColor: "#FFFFFF" };

  useEffect(() => {
    const fetchStations = async () => {
      try {
        if (id) {
          const estaciones = await getEstacionesPorLinea(id);
          setStations(estaciones);
          if (estaciones.length > 0) {
            const estacionNames = estaciones.map((estacion) => estacion.name).join(", ");
            Speech.speak(
              `Estaciones de la ${lineName}: ${estacionNames}. Por favor, di el nombre de la estacion que deseas seleccionar.`,
              { language: "es" }
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [id]);

  const handleStationPress = (station: Estacion) => {
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

  if (loading) {
    return (
      <View className="flex-1 bg-[#2B2A33] justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-4">Cargando estaciones...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-[#2B2A33] justify-center items-center">
        <Text className="text-white text-center">Error: {error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => router.push("/report")} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-lg mb-3 font-semibold">
          Estaciones de {lineName}
        </Text>
        <Text className="text-white/70 text-sm mb-6">
          Dirección: {estacionTerminalName}
        </Text>

        {stations.map((station) => (
          <StationButton
            key={station.id_estacion}
            label={station.name}
            onPress={() => handleStationPress(station)}
            color={lineColorInfo.color}
            textColor={lineColorInfo.textColor}
          />
        ))}
      </ScrollView>

      <Footer
        onBackPress={() => router.back()}
        onMenuPress={() => setMenuOpen(true)}
        onHomePress={() => router.replace("/")}
      />

      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
