import { View, Image, Text, Pressable } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onReportPress?: () => void;
};

export function Header({ onReportPress }: Props) {
  return (
    <View className="bg-black">
      <View className="px-4 py-3 flex-row items-center justify-between">
        {/* Logo M + MetroSence */}
        <View className="flex-row items-center gap-2">
          {/* Usa tu asset actual como ícono “M” hasta tener el definitivo */}
          <Image
            source={require("../assets/logo_metrosence.png")}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
            accessibilityLabel="Logo MetroSence"
          />
          <Text className="text-white text-xl font-bold">
            Metro
            <Text style={{ color: "#D90871" }}>Sence</Text>
          </Text>
        </View>

        {/* Botón Reportar problema */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reportar problema"
          onPress={onReportPress}
          hitSlop={10}
        >
          <Ionicons name="alert-circle-outline" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
}