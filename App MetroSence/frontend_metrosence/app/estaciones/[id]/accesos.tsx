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
import StationButton from "../../../components/StationButton";
import SecondaryButton from "../../../components/SecondaryButton";
import CounterBar from "../../../components/CounterBar";
import { getLineColor } from "../../../lib/lineColors";
//import { ACCESSES } from "../../../constants/accesses";
import { AccesoType, getAccesosPorEstacion } from "../../../lib/accesos";
import AccessButton from "../../../components/AccessButton";

export default function AccessScreen() {
  const {
    idParam,
    lineName,
    estacionDestinoName,
  } = useLocalSearchParams();

  const id = idParam ? parseInt(idParam as string) : null;

  const lineColorInfo = lineName
    ? getLineColor(lineName as string)
    : { color: "#3A3845", textColor: "#FFFFFF" };

  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accesos, setAccesos] = useState<AccesoType[]>([]);

  useEffect(() => {
    const fetchAccesos = async () => {
      try {
        if (id) {
          const accesos = await getAccesosPorEstacion(id);
          setAccesos(accesos);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchAccesos();
  }, [id]);

  console.log(accesos)

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

        {accesos.map((acceso) => (
          <AccessButton
            key={acceso.id}
            label={acceso.direccion}
            letter={acceso.letra}
            onPress={() => goConfirm(acceso.direccion)}
            color={lineColorInfo.color}        
            textColor={lineColorInfo.textColor}
          />
        ))}

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
