import { Pressable, Text, View } from "react-native";
import React from "react";

type Props = { label: string; onPress?: () => void };

export default function SecondaryButton({ label, onPress }: Props) {
  return (
    <View className="items-center my-2">
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        className="bg-neutral-400 rounded-2xl w-72 h-12 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text className="text-white font-bold">{label}</Text>
      </Pressable>
    </View>
  );
}
