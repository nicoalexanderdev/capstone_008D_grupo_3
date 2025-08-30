import { View } from "react-native";
import React from "react";
import SentidoButton from "../components/SentidoButton";
import { Header } from "../components/Header";
import { useRouter } from "expo-router";

export default function sentido() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-neutral-900">
      <Header />
      <View className="px-4 py-3">
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
    </View>
  );
}

