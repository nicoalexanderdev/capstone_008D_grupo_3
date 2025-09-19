import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';

import { Header } from "../components/Header";
import Hero from "../components/Hero";
import Footer2 from "../components/Footer2";
import SlideMenu from "../components/SlideMenu";
import { getAllLines, Line } from "../lib/lines";

type MetroLine = Line;

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const { width } = useWindowDimensions();

  const ITEM_GAP = 30;
  const isLargeScreen = width > 768;

  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  
  useEffect(() => {
    // Verificar si Voice está disponible
    const checkVoiceAvailability = async () => {
      try {
        // En development build, Voice debería estar disponible
        // Intentamos una verificación más simple
        console.log("Verificando disponibilidad de Voice...");
        setIsVoiceAvailable(true); // Asumimos que está disponible en development build
        
        // Configurar event listeners
        Voice.onSpeechStart = () => {
          console.log("onSpeechStart");
          setIsListening(true);
        };
        
        Voice.onSpeechEnd = () => {
          console.log("onSpeechEnd");
          setIsListening(false);
        };
        
        Voice.onSpeechError = (event) => {
          console.log("onSpeechError", event.error);
          setIsListening(false);
        };
        
        Voice.onSpeechResults = (event) => {
          if (event.value && event.value.length > 0) {
            const spokenText = event.value[0].toLowerCase();
            console.log("onSpeechResults", spokenText);
            setTranscript(spokenText);
            
            // Buscar coincidencia con las líneas
            const matchedLine = lines.find(line => 
              spokenText.includes(line.name.toLowerCase())
            );
            
            if (matchedLine) {
              // Si encontramos una coincidencia, navegamos a la línea
              handleLinePress(matchedLine);
            }
          }
        };
      } catch (error) {
        console.log("Voice no está disponible:", error);
        setIsVoiceAvailable(false);
      }
    };

    checkVoiceAvailability();

    return () => {
      // Limpiar listeners al desmontar
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [lines]);

  // Función para iniciar reconocimiento de voz
  const startSpeechToText = useCallback(async () => {
    if (!isVoiceAvailable) {
      console.log("El reconocimiento de voz no está disponible");
      return;
    }
    
    try {
      console.log("Iniciando reconocimiento de voz...");
      await Voice.start("es-ES");
    } catch (error) {
      console.error("Error al iniciar reconocimiento de voz:", error);
    }
  }, [isVoiceAvailable]);

  // Función para detener reconocimiento de voz
  const stopSpeechToText = useCallback(async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error("Error al detener reconocimiento de voz:", error);
    }
  }, []);

  // Efecto principal para cargar líneas y iniciar voz
  useEffect(() => {
    const fetchLines = async () => {
      try {
        const linesData = await getAllLines();
        setLines(linesData);
        
        // Hablar automáticamente los nombres de las líneas
        if (linesData.length > 0) {
          const lineNames = linesData.map(line => line.name).join(', ');
          Speech.speak(`Líneas disponibles: ${lineNames}. Por favor, di el nombre de la línea que deseas seleccionar.`, {
            language: 'es',
            onDone: () => {
              // Iniciar reconocimiento de voz después de que termine de hablar
              startSpeechToText();
            }
          });
        }
      } catch (err) {
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
  }, [startSpeechToText]);

  const handleLinePress = useCallback((line: MetroLine) => {
    // Detener reconocimiento de voz si está activo
    if (isListening) {
      stopSpeechToText();
    }
    
    router.push({
      pathname: "/linea/[Id]/sentidos",
      params: {
        lineId: line.id_linea.toString(),
        lineName: line.name,
      },
    });
  }, [isListening, stopSpeechToText]);

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
    <View className="flex-1 bg-neutral-900">
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
          />
          <View className="flex-1">
            <FlatList
              data={lines}
              keyExtractor={(item) => item.id_linea.toString()}
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
        
        {/* Mostrar estado de reconocimiento de voz */}
        {isListening && (
          <View className="p-4 bg-blue-500/20 rounded-lg mx-4 mt-4">
            <Text className="text-white text-center">
              Escuchando... {transcript && `Dijiste: ${transcript}`}
            </Text>
            <ActivityIndicator size="small" color="#FFFFFF" className="mt-2" />
          </View>
        )}
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
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43, 42, 51, 0.7)',
  }
});