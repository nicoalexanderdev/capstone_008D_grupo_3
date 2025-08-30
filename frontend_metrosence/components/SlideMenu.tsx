// components/SlideMenu.tsx
import React from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  Text,
  View,
  Image,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = { visible: boolean; onClose: () => void };

const APP_BG = "#171717";     // Tailwind neutral-900
const PANEL_BORDER = "#5A5A5A"; // Gris un poco más claro (≈ gray-600)

export default function SlideMenu({ visible, onClose }: Props) {
  const screenW = Dimensions.get("window").width;
  // Panel más angosto para NO ocupar toda la pantalla
  const panelW = Math.min(screenW * 0.72, 320);

  // Animación
  const animX = React.useRef(new Animated.Value(-panelW)).current;
  const [mounted, setMounted] = React.useState(visible);

  React.useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(animX, {
      toValue: visible ? 0 : -panelW,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) setMounted(false);
    });
  }, [visible]);

  if (!mounted) return null;

  // Acciones
  const call1488 = () => Linking.openURL("tel:1488");
  const openSettings = () =>
    Alert.alert("Configuración", "Pantalla pendiente de implementar.");
  const openTerms = () =>
    Alert.alert("Términos y Condiciones", "Pantalla pendiente de implementar.");

  // Ítem
  const MenuItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color="white" />
      <Text style={{ color: "white", fontSize: 18, marginLeft: 12 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
      {/* Overlay con tono del fondo de la app */}
      <Pressable
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(23,23,23,0.6)", // neutral-900 con opacidad
        }}
        onPress={onClose}
      />

      {/* Panel */}
      <Animated.View
        style={{
          width: panelW,
          height: "100%",
          backgroundColor: APP_BG,
          // Contorno gris y esquinas derechas redondeadas
          borderColor: PANEL_BORDER,
          borderWidth: 1,
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          // Sombra/elevación para separarlo
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 14,
          elevation: 12,
          transform: [{ translateX: animX }],
        }}
        accessibilityRole="menu"
      >
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Encabezado del panel */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 24 }}>
            <Image
              source={require("../assets/logo_2024.png")}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
              accessibilityLabel="Logo MetroSence"
            />
            <Text style={{ color: "white", fontSize: 22, fontWeight: "bold", marginLeft: 8 }}>
              Metro<Text style={{ color: "#D90871" }}>Sence</Text>
            </Text>
          </View>

          {/* Opciones */}
          <MenuItem icon="call-outline" label="1488 Teléfono" onPress={call1488} />
          <MenuItem icon="settings-outline" label="Configuración" onPress={openSettings} />
          <MenuItem icon="alert-circle-outline" label="Terms. y Cond." onPress={openTerms} />

          {/* Botón inferior: flecha para cerrar */}
          <View style={{ flex: 1 }} />
          <View style={{ paddingVertical: 14, alignItems: "flex-start", marginBottom: 8 }}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

