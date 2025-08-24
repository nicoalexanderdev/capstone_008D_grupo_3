import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Hero() {
  return (
      <SafeAreaView>
        <View className="items-center justify-center my-10">
          <Text className="text-4xl">¡Hola!👋☺️ ¿Dónde vamos hoy?</Text>
        </View>
      </SafeAreaView>
  );
}
