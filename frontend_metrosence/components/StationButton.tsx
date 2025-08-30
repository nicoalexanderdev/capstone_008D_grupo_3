import { View, Text, Pressable } from "react-native";
import React from "react";

type Props = {
  label: string;
  onPress?: () => void;
};

export default function StationButton({ label, onPress }: Props) {
  return (
    <View className="items-center my-2">
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
        className="bg-metro-red rounded-2xl w-72 h-12 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={`Estación ${label}`}
      >
        <Text className="text-white font-bold">{label}</Text>
      </Pressable>
    </View>
  );
}