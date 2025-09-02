// app/index.tsx
import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  StyleSheet
} from "react-native";
import { router, type Href } from "expo-router";
import { BlurView } from "expo-blur";

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
  const { width } = useWindowDimensions();

  const ITEM_GAP = 30; // espacio entre botones
  const isLargeScreen = width > 768;

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
      pathname: "/linea/[Id]/sentidos",
      params: {
        lineId: line.id.toString(),
        lineName: line.name,
      },
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
        <Text className="text-white text-center">
          Error al cargar las líneas: {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">

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

        <View className="flex-1">
          <BlurView
              intensity={isLargeScreen ? 0 : 30}
              tint="dark"
              style={isLargeScreen ? {} : { borderRadius: 16, overflow: "hidden" }}
            ></BlurView>
          <View className="flex-1">
            <FlatList
              data={lines}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 28,
              }}
              ItemSeparatorComponent={() => (
                <View style={{ height: ITEM_GAP }} />
              )}
              ListHeaderComponent={<View style={{ height: 2 }} />}
              ListFooterComponent={<View style={{ height: 2 }} />}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  onPress={() => handleLinePress(item)}
                  android_ripple={{ color: "rgba(255,255,255,0.15)" }}
                  hitSlop={10}
                  className="h-12 rounded-2xl items-center justify-center shadow-lg"
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
        </View>
      </View>

      <Footer2 onMenuPress={() => setMenuOpen(true)} />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43, 42, 51, 0.7)', // Fondo semi-transparente
  }
});
