// app/[linea]/[sentido].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../../components/Header";
import Footer from "../../components/Footer";
import SlideMenu from "../../components/SlideMenu";
import { getSentidosPorLinea } from "../../lib/sentidos";
import { getLineColor } from "../../lib/lineColors";

// Define el tipo para los sentidos
type Sentido = {
  id: number;
  nombre: string;
  estacion: {
    id: number;
    name: string;
  };
};

export default function SentidoScreen() {
  const { linea, lineName } = useLocalSearchParams();
  const lineId = linea ? parseInt(linea as string) : null;
  
  const [sentidos, setSentidos] = useState<Sentido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Obtener el color de la línea actual
  const lineColorInfo = lineName ? getLineColor(lineName as string) : { color: "#2B2A33", textColor: "#FFFFFF" };

  useEffect(() => {
    const fetchSentidos = async () => {
      try {
        if (lineId) {
          const sentidosData = await getSentidosPorLinea(lineId);
          setSentidos(sentidosData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchSentidos();
  }, [lineId]);

  const handleSentidoPress = (sentido: Sentido) => {
    router.push({
      pathname: "/[lineId]/estaciones",
      params: {
        lineId: lineId,
        lineName: lineName,
        sentidoId: sentido.id,
        estacionTerminalId: sentido.estacion.id,
        estacionTerminalName: sentido.estacion.name
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#2B2A33] justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-4">Cargando sentidos...</Text>
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
      <Header onReportPress={() => {}} />

      <View className="flex-1 px-4 py-3">
        <Text className="text-white/80 font-bold mb-4 text-lg">
          Sentidos disponibles para {lineName}
        </Text>

        <FlatList
          data={sentidos}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSentidoPress(item)}
              android_ripple={{ color: "rgba(255,255,255,0.15)" }}
              className="w-full h-60 rounded-2xl items-center justify-center shadow-lg"
              style={{ backgroundColor: lineColorInfo.color }}
            >
              <Text
                className="text-base font-extrabold text-center"
                style={{ color: lineColorInfo.textColor }}
                numberOfLines={2}
              >
                {item.nombre}
              </Text>
              <Text
                className="text-3xl"
                style={{ color: lineColorInfo.textColor }}
                numberOfLines={1}
              >
                Hacia: {item.estacion.name}
              </Text>
            </Pressable>
          )}
        />
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