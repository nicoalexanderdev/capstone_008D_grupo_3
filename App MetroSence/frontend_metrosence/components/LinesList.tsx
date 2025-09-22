import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import type { MetroLine } from "../utils/voiceLinesMatch";
import { getAllLines } from "../lib/lines";

export function LinesList({
  onSelect,
  onDataLoaded,
  itemGap = 30,
  isLargeScreen = false,
}: {
  onSelect: (line: MetroLine) => void;
  onDataLoaded?: (lines: MetroLine[]) => void;
  itemGap?: number;
  isLargeScreen?: boolean;
}) {
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllLines();
        setLines(data);
        onDataLoaded?.(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-white mt-4">Cargando líneas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-center">
          Error al cargar las líneas: {error}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <BlurView
        intensity={isLargeScreen ? 0 : 30}
        tint="dark"
        style={isLargeScreen ? {} : { borderRadius: 16, overflow: "hidden" }}
      />
      <FlatList
        data={lines}
        keyExtractor={(item) => String(item.id_linea)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
        ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
        ListHeaderComponent={<View style={{ height: 2 }} />}
        ListFooterComponent={<View style={{ height: 2 }} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => onSelect(item)}
            android_ripple={{ color: "rgba(255,255,255,0.15)" }}
            hitSlop={10}
            className="h-12 rounded-2xl items-center justify-center shadow-lg"
            style={{
              backgroundColor: (item as any).color,
              shadowColor: (item as any).color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              className="text-base font-extrabold text-center"
              style={{ color: (item as any).textColor || "#000" }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
