// app/_layout.tsx
import { Slot } from "expo-router";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import "../global.css";
import React, { useEffect, useState } from "react";

// permisos
import { Camera } from "expo-camera";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log("🔄 Iniciando preparación...");

        const [cameraPermission, speechPermission] = await Promise.all([
          Camera.requestCameraPermissionsAsync(),
          ExpoSpeechRecognitionModule.requestPermissionsAsync(),
        ]);

        console.log("📷 Camera permission:", cameraPermission.status);
        console.log("🎤 Speech permission:", speechPermission);
      } catch (e) {
        console.error("❌ Permission error:", e);
      } finally {
        console.log("✅ App ready!");
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    console.log("🎯 appIsReady changed to:", appIsReady);
    if (appIsReady) {
      console.log("🚀 Hiding splash...");
      SplashScreen.hideAsync().then(() => {
        console.log("✨ Splash hidden!");
      });
    }
  }, [appIsReady]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
