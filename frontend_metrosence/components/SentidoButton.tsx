import { View, Text, Pressable } from "react-native";
import React from "react";

type Props = {
  estacion: string;
  onPress?: () => void;
};

export default function SentidoButton({ estacion, onPress }: Props) {
  return (
    <View className="items-center my-5">
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        className="bg-metro-red rounded-xl w-80 h-80 items-center justify-center"
      >
        <Text
          className="text-5xl text-white font-bold text-center"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {estacion}
        </Text>
      </Pressable>
    </View>
  );
}
