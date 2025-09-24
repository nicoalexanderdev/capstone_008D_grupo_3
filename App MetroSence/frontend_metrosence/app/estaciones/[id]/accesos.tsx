import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../../../components/Header";
import Footer from "../../../components/Footer";
import SlideMenu from "../../../components/SlideMenu";
import { getLineColor } from "../../../lib/lineColors";
import {
  DetalleEstacionType,
  getDetallePorEstacion,
} from "../../../lib/accesos";
import AccessButton from "../../../components/AccessButton";
import {
  isGoBack,
  matchAccessFromUtterance,
} from "../../../utils/voiceAccesosMatch";
import * as Speech from "expo-speech";

import { useVoiceCapture } from "../../../hooks/useVoiceCapture";

// Función para formatear la hora (eliminar segundos si existen)
const formatTime = (timeString: string) => {
  if (!timeString) return "";
  return timeString.slice(0, 5); // Tomar solo HH:MM
};

export default function AccessScreen() {
  const { idParam, lineName, estacionDestinoName, estacionTerminalName } =
    useLocalSearchParams();

  const id = idParam ? parseInt(idParam as string) : null;

  const lineColorInfo = useMemo(
    () =>
      lineName
        ? getLineColor(lineName as string)
        : { color: "#3A3845", textColor: "#FFFFFF" },
    [lineName]
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleEstacionType>();

  // ===== Hook de voz =====
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
      if (isGoBack(finalText)) {
        router.back();
        return;
      }
      const match = matchAccessFromUtterance(finalText, detalle);
      if (match) {
        goConfirm(match.direccion, match.letra);
      } else {
        Alert.alert(
          "No se reconoció el acceso",
          'Di, por ejemplo: "Acceso A" o "Entrada Independencia". También puedes decir "atrás" para volver.'
        );
      }
    },
  });

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        if (id) {
          const detalleData = await getDetallePorEstacion(id);
          setDetalle(detalleData);
          if (detalleData.accesos.length > 0) {
            const letras = detalleData.accesos.map((a) => a.letra).join(", ");
            const direcciones = detalleData.accesos
              .map((a) => a.direccion)
              .join(", ");
            speakThenListen(
              `Accesos disponibles para ${estacionDestinoName}. Letras: ${letras}. Direcciones: ${
                direcciones || ""
              }. Di, por ejemplo: Acceso A o Entrada ${
                detalleData.accesos[2]?.direccion || "Principal"
              }. También puedes decir atrás para volver.`
            );
          } else {
            speakThenListen(
              `No se encontraron accesos para la estación ${estacionDestinoName}. Por favor di atrás para volver.`
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchDetalles();
  }, [id]);

  const goConfirm = (accessName: string, letra: string) => {
    Speech.stop();
    router.push({
      pathname: "/confirmacion",
      params: {
        station: String(estacionDestinoName || ""),
        letra: letra,
        access: accessName,
        direction: estacionTerminalName,
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#2B2A33] justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-4">Cargando accesos...</Text>
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

  // Verificar si detalle existe y tiene accesos
  if (!detalle || !detalle.accesos || detalle.accesos.length === 0) {
    return (
      <View className="flex-1 bg-neutral-900">
        <Header onReportPress={() => router.push("/report")} />

        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-white text-center text-lg">
            No se encontraron accesos para esta estación
          </Text>
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

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => router.push("/report")} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-2">
          <Text className="text-white text-2xl font-extrabold text-center">
            {estacionDestinoName}
          </Text>
        </View>

        <Text className="text-white/90 text-base mb-3 font-semibold">
          Elije un acceso a la estación
        </Text>

        {detalle.accesos.map((acceso) => (
          <AccessButton
            key={acceso.id_acceso} // Usar id_acceso como key único
            label={acceso.direccion}
            letter={acceso.letra}
            onPress={() => goConfirm(acceso.direccion, acceso.letra)}
            color={lineColorInfo.color}
            textColor={lineColorInfo.textColor}
          />
        ))}

        {/* Sección de Horario */}
        {detalle.horario && (
          <View className="mt-6 p-4 bg-[#3A3845] rounded-lg">
            <Text className="text-white text-lg font-bold mb-3 text-center">
              Horario de Atención
            </Text>

            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-white/80">Lunes a Viernes:</Text>
                <Text className="text-white">
                  {formatTime(detalle.horario.open_weekdays)} -{" "}
                  {formatTime(detalle.horario.close_weekdays)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-white/80">Sábados:</Text>
                <Text className="text-white">
                  {formatTime(detalle.horario.open_saturdays)} -{" "}
                  {formatTime(detalle.horario.close_saturdays)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-white/80">Domingos y Festivos:</Text>
                <Text className="text-white">
                  {formatTime(detalle.horario.open_holidays)} -{" "}
                  {formatTime(detalle.horario.close_holidays)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botón manual de micrófono + feedback */}
      <View style={{ paddingVertical: 16 }}>
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
