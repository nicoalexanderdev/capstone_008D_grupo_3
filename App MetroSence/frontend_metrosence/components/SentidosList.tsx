import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import type { SentidoType } from "../utils/voiceSentidoMatch";
import { getSentidosPorLinea } from "../lib/sentidos";

export function SentidosList({
  lineId,
  onSelect,
  onDataLoaded,
  cardColor = "#2B2A33",
  textColor = "#FFFFFF",
}: {
  lineId: number;
  onSelect: (sentido: SentidoType) => void;
  onDataLoaded?: (sentidos: SentidoType[]) => void;
  cardColor?: string;
  textColor?: string;
}) {
  const [items, setItems] = useState<SentidoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSentidosPorLinea(lineId);
        setItems(data);
        onDataLoaded?.(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [lineId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-white mt-4">Cargando sentidos...</Text>
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
      keyExtractor={(item) => String(item.id_sentido)}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item)}
          android_ripple={{ color: "rgba(255,255,255,0.15)" }}
          className="w-full h-60 rounded-2xl items-center justify-center shadow-lg"
          style={{ backgroundColor: cardColor }}
        >
          <Text
            className="text-3xl"
            style={{ color: textColor }}
            numberOfLines={1}
          >
            {item.estacion.name}
          </Text>
        </Pressable>
      )}
    />
  );
}
