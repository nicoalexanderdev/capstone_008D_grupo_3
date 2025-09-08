// app/components/Hero.tsx
import React from "react";
import { View, Text } from "react-native";

export default function Hero() {
  return (
    <View className="px-3 pt-4 text-center items-center justify-center">
      <Text className="text-white text-3xl font-black leading-tight ">
        ¡Hola! <Text>👋</Text>
      </Text>
      <Text className="text-white text-3xl font-black leading-tight">
        ¿Dónde vamos hoy?
      </Text>
    </View>
  );
}
