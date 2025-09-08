import { View, Pressable } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onMenuPress?: () => void;
  onBackPress?: () => void;
  onHomePress?: () => void;
};

export default function Footer({ onMenuPress, onBackPress, onHomePress }: Props) {
  return (
    <View className="bg-[#222222]">
      {/* 3 columnas iguales para que la flecha quede EXACTAMENTE al centro */}
      <View className="h-14 flex-row items-center">
        {/* Menú (izquierda) */}
        <View className="flex-1 px-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menú"
            onPress={onMenuPress}
            hitSlop={10}
          >
            <Ionicons name="menu" size={28} color="white" />
          </Pressable>
        </View>

        {/* Volver (centro) */}
        <View className="flex-1 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onBackPress}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </Pressable>
        </View>

        {/* Home (derecha) */}
        <View className="flex-1 px-6 items-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir al inicio"
            onPress={onHomePress}
            hitSlop={10}
          >
            <Ionicons name="home-outline" size={28} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
