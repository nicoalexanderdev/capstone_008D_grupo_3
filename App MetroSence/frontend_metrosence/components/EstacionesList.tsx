import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";

import type { Estacion } from "../lib/estaciones";
import { getEstacionesPorLinea } from "../lib/estaciones";

export function EstacionesList({
  lineId,
  onSelect,
  onDataLoaded,
  cardColor = "#2B2A33",
  textColor = "#FFFFFF",
  skip = 0,
}: {
  lineId: number;
  onSelect: (estacion: Estacion) => void;
  onDataLoaded?: (estaciones: Estacion[], hasMore: boolean) => void;
  cardColor?: string;
  textColor?: string;
  skip?: number;
}) {
  const [items, setItems] = useState<Estacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const data = await getEstacionesPorLinea(lineId, skip);
        setItems(data);
        const hasMore = data.length === 10;
        onDataLoaded?.(data, hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [lineId, skip]);


  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-white mt-4">Cargando estaciones...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-center">Error: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id_estacion)}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item)}
          android_ripple={{ color: "rgba(255,255,255,0.15)" }}
          className="w-full h-30 rounded-2xl items-center justify-center shadow-lg"
          style={{ backgroundColor: cardColor }}
        >
          <Text
            className="text-xl"
            style={{ color: textColor }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </Pressable>
      )}
    />
  );
}