import { View, Text } from "react-native";
import React from "react";

export default function CounterBar({ value = 0 }: { value?: number }) {
  return (
    <View className="flex-row items-center justify-center my-5 px-6">
      <View className="flex-1 h-[1px] bg-neutral-500 mx-2" />
      <Text className="text-white text-lg font-semibold">{value}</Text>
      <View className="flex-1 h-[1px] bg-neutral-500 mx-2" />
    </View>
  );
}
