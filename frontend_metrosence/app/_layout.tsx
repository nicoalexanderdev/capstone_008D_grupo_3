import { Slot, Stack } from "expo-router";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import "../global.css";
import React from "react";

const RootLayout = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <StatusBar backgroundColor="black" />
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default RootLayout;
