import React from "react";
import { View, Text, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SlideMenu from "../components/SlideMenu"; // 👈 importa el menú
import StationButton from "../components/StationButton";
import { LINE1_STATIONS } from "../constants/stations";
import { useRouter } from "expo-router";

export default function StationsScreen() {
  const { direction } = useLocalSearchParams<{ direction?: string }>();
  const stations = LINE1_STATIONS;

  const [menuOpen, setMenuOpen] = React.useState(false); // 👈 estado

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => router.push("/report")} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-lg mb-3 font-semibold">
          Elige la estación de destino
        </Text>

        {stations.map((name) => (
          <StationButton
            key={name}
            label={name}
            onPress={() =>
              router.push({
                pathname: "/acceso",
                params: { station: name, direction },
              })
            }
          />
        ))}
        <View className="h-16" />
      </ScrollView>

      <Footer
        onBackPress={() => router.replace("/sentido")}
        onMenuPress={() => setMenuOpen(true)}  // 👈 abrir menú
        onHomePress={() => router.replace("/")}   // 👈 Home

      />

      {/* Menú encima de todo */}
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
