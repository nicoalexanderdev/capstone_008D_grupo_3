import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../../../components/Header";
import Footer from "../../../components/Footer";
import SlideMenu from "../../../components/SlideMenu";
import SecondaryButton from "../../../components/SecondaryButton";
import CounterBar from "../../../components/CounterBar";
import { getLineColor } from "../../../lib/lineColors";
import {
  DetalleEstacionType,
  getDetallePorEstacion,
} from "../../../lib/accesos";
import AccessButton from "../../../components/AccessButton";

// Función para formatear la hora (eliminar segundos si existen)
const formatTime = (timeString: string) => {
  if (!timeString) return "";
  return timeString.slice(0, 5); // Tomar solo HH:MM
};

export default function AccessScreen() {
  const { idParam, lineName, estacionDestinoName } = useLocalSearchParams();

  const id = idParam ? parseInt(idParam as string) : null;

  const lineColorInfo = lineName
    ? getLineColor(lineName as string)
    : { color: "#3A3845", textColor: "#FFFFFF" };

  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleEstacionType>();

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        if (id) {
          const detalleData = await getDetallePorEstacion(id);
          setDetalle(detalleData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchDetalles();
  }, [id]);

  console.log(detalle);

  const goConfirm = (accessName: String) => {
    router.push({
      pathname: "/confirmacion",
      // params: { station: estacionDestinoName, access: accessName, direction },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#2B2A33] justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-4">Cargando accesos...</Text>
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
            onPress={() => goConfirm(acceso.direccion)}
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

        <CounterBar value={0} />

        <SecondaryButton
          label="ESCANEAR ACCESO"
          onPress={() => goConfirm("Escaneo")}
        />
        <View className="h-16" />
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
