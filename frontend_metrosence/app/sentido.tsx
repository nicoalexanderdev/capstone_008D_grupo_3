// app/sentido.tsx
import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SentidoButton from "../components/SentidoButton";
import SlideMenu from "../components/SlideMenu";

export default function Sentido() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View className="flex-1 bg-neutral-900 bg-[#2B2A33]" >
      <Header onReportPress={() => {}} />

      <View className="flex-1 px-4 py-3">
        <SentidoButton
          estacion="San Pablo"
          onPress={() =>
            router.push({ pathname: "/estaciones", params: { direction: "San Pablo" } })
          }
        />
        <SentidoButton
          estacion="Los Dominicos"
          onPress={() =>
            router.push({ pathname: "/estaciones", params: { direction: "Los Dominicos" } })
          }
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



