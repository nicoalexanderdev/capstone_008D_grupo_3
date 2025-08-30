import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onMenuPress?: () => void;
};

export default function Footer2({ onMenuPress }: Props) {
  return (
    <View className="bg-[#222222] border-t border-white/10">
      <View className="h-14 flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú"
          onPress={onMenuPress}
          hitSlop={10}
          className="px-6"
        >
          <Ionicons name="menu" size={28} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
