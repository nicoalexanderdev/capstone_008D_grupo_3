import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SlideMenu from "../components/SlideMenu";
import SecondaryButton from "../components/SecondaryButton";

export default function ConfirmacionScreen() {
  const { station, access, direction } = useLocalSearchParams<{
    station?: string;
    access?: string;
    direction?: string;
  }>();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const stationLabel = station ?? "-";
  const accessLabel = access ?? "-";
  const destinoLabel = direction ? `Andén - ${direction}` : "Andén - -";

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => router.push("/report")} />

      <View className="flex-1 px-4 pt-6">
        <View className="items-center mb-6">
          <Text className="text-white text-2xl font-extrabold text-center">
            Confirmación{"\n"}de información
          </Text>
        </View>

        <Text className="text-white/80 text-base mb-1">Estación de ingreso:</Text>
        <Text className="text-white text-2xl font-extrabold mb-4">{stationLabel}</Text>

        <Text className="text-white/80 text-base mb-1">Acceso de estación:</Text>
        <Text className="text-white text-2xl font-extrabold mb-4">{accessLabel}</Text>

        <Text className="text-white/80 text-base mb-1">Destino:</Text>
        <Text className="text-white text-2xl font-extrabold mb-8">{destinoLabel}</Text>

        <View className="items-center">
          <SecondaryButton
            label="INICIAR ASISTENTE VIRTUAL"
            onPress={() => router.push("/asistente")}
          />
        </View>
      </View>

      <Footer onBackPress={() => router.back()} onMenuPress={() => setMenuOpen(true)} onHomePress={() => router.replace("/")}  />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
