import React from "react";
import { SafeAreaView, View } from "react-native";
import MetroLineButton from "./MetroLineButton";
import { useRouter } from "expo-router";

export default function Buttons() {
  const router = useRouter();

  const goToSentido = (line: string) => {
    router.push({ pathname: "/sentido", params: { line } });
  };

  return (
    <SafeAreaView>
      <View className="flex-col items-center gap-10 my-10">
        {/* Primera fila: 3 columnas */}

        <View className="flex-row justify-center gap-10">
            <MetroLineButton
              label="1"
              variant="line1"
              onPress={() => goToSentido("1")}
            />
          <MetroLineButton
            label="2"
            variant="line2"
            onPress={() => goToSentido("2")}
          />
          <MetroLineButton
            label="3"
            variant="line3"
            onPress={() => goToSentido("3")}
          />
        </View>

        {/* Segunda fila: 3 columnas */}
        <View className="flex-row justify-center gap-10">
          <MetroLineButton
            label="4"
            variant="line4"
            onPress={() => goToSentido("4")}
          />
          <MetroLineButton
            label="4A"
            variant="line4a"
            onPress={() => goToSentido("4A")}
          />
          <MetroLineButton
            label="5"
            variant="line5"
            onPress={() => goToSentido("5")}
          />
        </View>

        {/* Tercera fila: 1 botón centrado */}
        <View className="flex-row justify-center">
          <MetroLineButton
            label="6"
            variant="line6"
            onPress={() => goToSentido("6")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
