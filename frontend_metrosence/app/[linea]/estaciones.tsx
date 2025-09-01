import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView 
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "../../components/Header";
import Footer from "../../components/Footer";
import SlideMenu from "../../components/SlideMenu";
import StationButton from "../../components/StationButton";
import { getEstacionesPorLinea, Estacion } from "../../lib/estaciones";
import { getLineColor } from "../../lib/lineColors"; 


export default function StationsScreen() {
  
  const { 
    linea, 
    lineName, 
    sentidoId, 
    sentidoName, 
    estacionTerminalId, 
    estacionTerminalName 
  } = useLocalSearchParams();

  console.log(lineName, sentidoName)

  const lineId = linea ? parseInt(linea as string) : null;
  
  const [stations, setStations] = useState<Estacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const lineColorInfo = lineName ? getLineColor(lineName as string) : { color: "#3A3845", textColor: "#FFFFFF" };

  useEffect(() => {
    const fetchStations = async () => {
      try {
        if (lineId) {
          const estaciones = await getEstacionesPorLinea(Number(lineId));
          setStations(estaciones);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [lineId]);

  const handleStationPress = (station: Estacion) => {
    router.push({
      pathname: "/acceso",
      params: { 
        lineId,
        lineName,
        sentidoId,
        sentidoName,
        estacionTerminalId,
        estacionTerminalName,
        estacionDestinoId: station.id,
        estacionDestinoName: station.name
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#2B2A33] justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-4">Cargando estaciones...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#2B2A33] justify-center items-center">
        <Text className="text-white text-center">Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#2B2A33]">
      <Header onReportPress={() => router.push("/report")} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-lg mb-3 font-semibold">
          Estaciones de {lineName}
        </Text>
        <Text className="text-white/70 text-sm mb-6">
          Dirección: {sentidoName}
        </Text>

        {stations.map((station) => (
          <StationButton
            key={station.id}
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