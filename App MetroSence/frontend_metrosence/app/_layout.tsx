import { Slot } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import React from "react";

const RootLayout = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default RootLayout;
