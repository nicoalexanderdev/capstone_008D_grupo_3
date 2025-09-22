import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";

import type { Estacion } from "../lib/estaciones"
import {getEstacionesPorLinea} from "../lib/estaciones"

export function EstacionesList({
    lineId,
    onSelect,
    onDataLoaded,
    cardColor = "#2B2A33",
    textColor = "#FFFFFF",
}: {lineId: number;
   onSelect: (estacion: Estacion) => void; 
   onDataLoaded?: (estaciones: Estacion[]) => void;
     cardColor?: string;
   textColor?: string;
}){

    const [items, setItems] = useState<Estacion[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          (async () => {
            try {
              const data = await getEstacionesPorLinea(lineId);
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