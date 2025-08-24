import React from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";

// Mapea tus variantes a clases de fondo y de texto de NativeWind
const LINE_STYLES: Record<
  "line1" | "line2" | "line3" | "line4" | "line4a" | "line5" | "line6",
  { bg: string; text: string }
> = {
  line1:  { bg: "bg-metro-line1",  text: "text-white" },
  line2:  { bg: "bg-metro-line2",  text: "text-black" },
  line3:  { bg: "bg-metro-line3",  text: "text-white" },
  line4:  { bg: "bg-metro-line4",  text: "text-white" },
  line4a: { bg: "bg-metro-line4a", text: "text-white" },
  line5:  { bg: "bg-metro-line5",  text: "text-white" },
  line6:  { bg: "bg-metro-line6",  text: "text-white" },
};

type Props = {
  label: string;
  variant: keyof typeof LINE_STYLES;
  onPress?: () => void;
  size?: number;           // diámetro en px (default 80)
  disabled?: boolean;
  containerStyle?: ViewStyle; // estilos extra para el wrapper
  accessibilityLabel?: string;
};

export default function MetroLineButton({
  label,
  variant,
  onPress,
  size = 80,
  disabled = false,
  containerStyle,
  accessibilityLabel,
}: Props) {
  const { bg, text } = LINE_STYLES[variant];

  return (
    <View style={containerStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}
        className={`rounded-full items-center justify-center ${bg}`}
        style={{
          width: size,
          height: size,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {({ pressed }) => (
          <Text
            className={`${text} font-bold`}
            style={{
              // Escala el font-size según el tamaño del botón
              fontSize: Math.max(16, Math.round(size * 0.45)),
              opacity: pressed ? 0.85 : 1,
            }}
            accessibilityLabel={accessibilityLabel ?? `Botón línea ${label}`}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
