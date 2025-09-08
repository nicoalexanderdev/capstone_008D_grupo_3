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
    <View className="items-center my-2 flex-row">
      {/* Contenedor de la letra */}
      <View
        className="rounded-full h-12 w-12 justify-center items-center shadow-lg mr-3"
        style={{ backgroundColor: color }}
      >
        <Text className="font-bold text-xl" style={{ color: textColor }}>
          {letter}
        </Text>
      </View>
      
      {/* Botón principal */}
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
        className="rounded-2xl flex-1 h-12 items-center justify-center shadow-lg"
        style={{ backgroundColor: color }}
        accessibilityRole="button"
        accessibilityLabel={`Acceso ${label}`}
      >
        <Text className="font-bold" style={{ color: textColor }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}