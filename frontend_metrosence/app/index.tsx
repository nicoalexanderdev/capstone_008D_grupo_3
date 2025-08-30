// app/index.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  StatusBar,
} from "react-native";
import { router, type Href } from "expo-router";

import { Header } from "../components/Header";
import Hero from "../components/Hero";
import Footer2 from "../components/Footer2";
import SlideMenu from "../components/SlideMenu";

type MetroLine = {
  id: string;
  name: string;
  color: string;
  textColor?: string;
  to?: Href; // ruta de destino opcional
};

const LINES: MetroLine[] = [
  { id: "l1", name: "Línea 1", color: "#E20E17", to: { pathname: "/sentido", params: { line: "l1" } } },
  { id: "l2", name: "Línea 2", color: "#FFD100", textColor: "#1b1b1b" },
  { id: "l3", name: "Línea 3", color: "#6B3B13" },
  { id: "l4", name: "Línea 4", color: "#0D2CB3" },
  { id: "l4a", name: "Línea 4A", color: "#2AA6E0" },
  { id: "l5", name: "Línea 5", color: "#13A56F" },
  { id: "l6", name: "Línea 6", color: "#8E44AD" },
];

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const ITEM_GAP = 25; // ← espacio entre botones
  

  return (
    <SafeAreaView className="flex-1 bg-[#2B2A33]">
      <StatusBar barStyle="light-content" />
      <Header onReportPress={() => {}} />

      <Hero />

      <View className="flex-1 px-4 pt-3 pb-2">
        <Text className="text-white/80 font-bold mb-4">Líneas de Metro</Text>

        <FlatList<MetroLine>
          data={LINES}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: 30 }}
          ItemSeparatorComponent={() => <View style={{ height: ITEM_GAP }} />}
          ListHeaderComponent={<View style={{ height: 3 }} />}
          ListFooterComponent={<View style={{ height: 30 }} />}
         renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.name}
          onPress={() => { if (item.to) router.push(item.to); }}
          android_ripple={{ color: "rgba(255,255,255,0.15)" }}
          hitSlop={10}
          // 👇 estas 2 clases centran el contenido del botón
          className="w-full h-12 rounded-2xl items-center justify-center shadow"
          style={{ backgroundColor: item.color }}
        >
          <Text
            className="text-base font-extrabold text-center"
            style={{ color: item.textColor ?? "#fff" }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </Pressable>
          )}
        />
      </View>

      <Footer2 onMenuPress={() => setMenuOpen(true)} />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}
