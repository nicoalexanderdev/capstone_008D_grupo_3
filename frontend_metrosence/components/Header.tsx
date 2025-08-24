import { View, Image } from "react-native";

export function Header() {
  return (
    <View className="bg-metro-red">
      <View className="px-4 py-3 items-center">
        <Image
          source={require("../assets/logo_2024.png")}
          style={{
            width: 50,
            height: 50,
          }}
          resizeMode="contain"
          accessibilityLabel="Logo Metro"
        />
      </View>
    </View>
  );
}
