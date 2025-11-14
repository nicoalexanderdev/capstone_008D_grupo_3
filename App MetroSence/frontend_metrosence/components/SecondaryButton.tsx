import { Pressable, Text, View } from "react-native";
import React from "react";

type Props = { label: string; onPress?: () => void };

export default function SecondaryButton({ label, onPress }: Props) {
  return (
    <View className="items-center my-4 w-full px-6">
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        className="bg-neutral-400 rounded-2xl w-full h-60 items-center justify-center shadow-lg"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text className="text-white font-extrabold text-3xl text-center" numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
