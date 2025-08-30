import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SlideMenu from "../components/SlideMenu";
import StationButton from "../components/StationButton";
import SecondaryButton from "../components/SecondaryButton";
import CounterBar from "../components/CounterBar";
import { ACCESSES } from "../constants/accesses";

export default function AccessScreen() {
  const { station, direction } = useLocalSearchParams<{ station?: string; direction?: string }>();
  const stationName = station ?? "Manuel Montt";
  const accesses = ACCESSES[stationName] ?? [];
  const [menuOpen, setMenuOpen] = React.useState(false);

  const goConfirm = (accessName: string) => {
    router.push({
      pathname: "/confirmacion",
      params: { station: stationName, access: accessName, direction },
    });
  };

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => router.push("/report")} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-2">
          <Text className="text-white text-2xl font-extrabold text-center">{stationName}</Text>
        </View>

        <Text className="text-white/90 text-base mb-3 font-semibold">
          Elije un acceso a la estación
        </Text>

        {accesses.map((name) => (
          <StationButton key={name} label={name} onPress={() => goConfirm(name)} />
        ))}

        <CounterBar value={0} />

        <SecondaryButton label="ESCANEAR ACCESO" onPress={() => goConfirm("Escaneo")} />
        <View className="h-16" />
      </ScrollView>

      <Footer onBackPress={() => router.back()} onMenuPress={() => setMenuOpen(true)} onHomePress={() => router.replace("/")} />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}