import { View, Image, Text, Pressable } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onReportPress?: () => void;
};

export function Header({ onReportPress }: Props) {
  return (
    <View className="bg-[#222222]">
      {/* barra superior */}
      <View className="h-14 px-4 flex-row items-center justify-between  ml-[90px]">
        {/* Izquierda: logo + marca */}
        <View className="flex-row items-center gap-2">
          <Image
            source={require("../assets/logo_metrosence.png")}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
            accessibilityLabel="Logo MetroSence"
          />
          <Text className="text-white text-[23px] font-bold">
            Metro
            <Text style={{ color: "#D90871" }}>Sence</Text>
          </Text>
        </View>

        {/* Derecha: botón alerta */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reportar problema"
          onPress={onReportPress}
          hitSlop={10}
          className="p-1"
        >
          <Ionicons name="alert-circle-outline" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
