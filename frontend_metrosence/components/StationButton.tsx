import { View, Text, Pressable } from "react-native";
import React from "react";

type Props = {
  label: String;
  onPress?: () => void;
  color?: string;        
  textColor?: string; 
};

export default function StationButton({ label, onPress, color, textColor }: Props) {
  return (
    <View className="items-center my-2">
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
        className="rounded-2xl w-full h-12 items-center justify-center shadow-lg"
        style={{ backgroundColor: color }}
        accessibilityRole="button"
        accessibilityLabel={`Estación ${label}`}
      >
        <Text className="font-bold" style={{ color: textColor }}>{label}</Text>
      </Pressable>
    </View>
  );
}