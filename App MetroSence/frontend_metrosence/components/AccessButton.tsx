import { View, Text, Pressable } from "react-native";
import React from "react";

type Props = {
  label: string;
  letter: string;
  onPress?: () => void;
  color?: string;
  textColor?: string;
};

export default function AccessButton({
  label,
  letter,
  onPress,
  color,
  textColor,
}: Props) {
  return (
    <View className="items-center my-4 flex-row">
      
      {/* 🔵 Círculo de la letra — ahora grande para calzar con h-60 */}
      <View
        className="rounded-full h-20 w-20 justify-center items-center mr-4"
        style={{ backgroundColor: color }}
      >
        <Text
          className="font-bold text-3xl"
          style={{ color: textColor }}
        >
          {letter}
        </Text>
      </View>

      {/* 🔥 Botón principal grande, igual que los otros */}
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
        className="rounded-2xl flex-1 h-32 items-center justify-center"
        style={{ backgroundColor: color }}
        accessibilityRole="button"
        accessibilityLabel={`Acceso ${label}`}
      >
        <Text
          className="font-bold text-xl wrap-break-word text-center"
          style={{ color: textColor }}
        >
          {label}
        </Text>
      </Pressable>

    </View>
  );
}
