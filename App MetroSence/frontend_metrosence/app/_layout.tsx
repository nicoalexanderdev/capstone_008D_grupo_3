// app/_layout.tsx
import { Slot } from "expo-router";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import "../global.css";
import React, { useCallback, useEffect, useState } from "react";

// permisos
import { Camera } from "expo-camera";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 4000,
  fade: true,
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 1) Pedir permisos en paralelo
        const requests: Promise<any>[] = [];

        // Cámara (y mic para grabación de video si lo usaras)
        requests.push(Camera.requestCameraPermissionsAsync());
        // Si en algún punto grabas video con audio vía expo-camera, también:
        // requests.push(Camera.requestMicrophonePermissionsAsync());

        // Reconocimiento de voz (pide micrófono + permiso de speech en iOS)
        requests.push(ExpoSpeechRecognitionModule.requestPermissionsAsync());

        // En web, el permiso puede gestionarse diferente, pero la llamada es no-op si no aplica
        await Promise.all(requests);

        // (Opcional) verificar disponibilidad del servicio de reconocimiento
        // const available = ExpoSpeechRecognitionModule.isRecognitionAvailable?.();
        // console.log("Speech service available:", available);
      } catch (e) {
        console.warn("Permission bootstrap error:", e);
      } finally {
        // 2) Pasar a ready: al montar la vista raíz se ocultará el Splash
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        {appIsReady ? <Slot /> : <View onLayout={onLayoutRootView} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
