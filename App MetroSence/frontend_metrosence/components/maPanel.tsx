// app/components/maPanel.tsx
import React, { useState } from "react";
import { View, Image, Text, StyleSheet } from "react-native";

type Props = {
  height?: number;   // alto fijo (para móvil, por ejemplo)
  minWidth?: number; // ancho mínimo de la columna
  fill?: boolean;    // ocupar todo el alto disponible del contenedor
};

export default function MaPanel({ height = 520, minWidth = 240, fill = false }: Props) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <View style={[{ minWidth }, fill ? styles.fillBox : { height }]} className="rounded-lg bg-neutral-700">
        <Text className="text-white p-3">No se encontró ./assets/mapa_metro.png</Text>
      </View>
    );
  }

  return (
    <View style={[{ minWidth }, fill ? styles.fillBox : { height }]}>
      <Image
        source={require("../assets/metro-maps.png")}
        resizeMode="cover"
        onError={() => setError(true)}
        style={fill ? styles.fillImage : { width: "100%", height }}
        className="rounded-lg"
        accessibilityLabel="Mapa de líneas del Metro de Santiago"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fillBox: { flex: 1, width: "100%", minHeight: 0 },
  fillImage: { flex: 1, width: "100%", height: undefined },
});
