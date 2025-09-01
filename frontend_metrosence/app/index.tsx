// app/index.tsx
import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { router, type Href } from "expo-router";

import { Header } from "../components/Header";
import Hero from "../components/Hero";
import Footer2 from "../components/Footer2";
import SlideMenu from "../components/SlideMenu";
import { getAllLines, Line } from "../lib/lines";

// Define el tipo para las líneas
type MetroLine = Line;

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const ITEM_GAP = 25; // espacio entre botones


  useEffect(() => {
    const fetchLines = async () => {
      try {
        const linesData = await getAllLines();
        setLines(linesData);
      } catch (err) {
        // Maneja el error de tipo unknown
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
        console.error("Error fetching lines:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLines();
  }, []);

  const handleLinePress = (line: MetroLine) => {
    router.push({
      pathname: "/[linea]/sentidos",
      params: { 
        linea: line.id.toString(),
        lineName: line.name 
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#2B2A33] justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-4">Cargando líneas...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#2B2A33] justify-center items-center">
        <Text className="text-white text-center">Error al cargar las líneas: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#2B2A33]">
      <Header onReportPress={() => {}} />

      <Hero />

      <View className="flex-1 px-4 pt-3 pb-2">
        <Text className="text-white/80 font-bold mb-4 text-lg">Líneas de Metro</Text>

        <FlatList
          data={lines}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 28 }}
          ItemSeparatorComponent={() => <View style={{ height: ITEM_GAP }} />}
          ListHeaderComponent={<View style={{ height: 2 }} />}
          ListFooterComponent={<View style={{ height: 2 }} />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.name}
              onPress={() => handleLinePress(item)}
              android_ripple={{ color: "rgba(255,255,255,0.15)" }}
              hitSlop={10}
              className="w-full h-12 rounded-2xl items-center justify-center shadow-lg"
              style={{ 
                backgroundColor: item.color,
                shadowColor: item.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text
                className="text-base font-extrabold text-center"
                style={{ color: item.textColor }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <Footer2 onMenuPress={() => setMenuOpen(true)} />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}