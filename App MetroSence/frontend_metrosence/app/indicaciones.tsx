import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import SlideMenu from "../components/SlideMenu";
import * as Speech from "expo-speech";
import { useLocalSearchParams, router } from "expo-router";
import { getRecorrido } from "../lib/indicaciones"; 

const first = (v?: string | string[]) => Array.isArray(v) ? v[0] : v;
const toNum = (v?: string | string[]) => {
  const s = first(v);
  if (s == null) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export default function IndicacionesMapa() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [oraciones, setOraciones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useLocalSearchParams<{
    accessId?: string | string[];
    accesoId?: string | string[];  // ← fallback por si quedó el nombre antiguo
    sentidoId?: string | string[];
    idAcceso?: string | string[];  // ← otro alias posible
  }>();

const accessIdNum =
    toNum(params.accessId) ??
    toNum(params.accesoId) ??
    toNum(params.idAcceso);

  const sentidoIdNum = toNum(params.sentidoId);

    useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // LOGS ÚTILES PARA DEPURAR
        console.log("Indicaciones params crudos:", params);
        console.log("Normalizados:", { accessIdNum, sentidoIdNum });

        if (accessIdNum == null || sentidoIdNum == null) {
          setError("Parámetros incompletos (accessId/sentidoId).");
          setOraciones([]);
          return;
        }

        // ⚠️ ORDEN CORRECTO: (accessId, sentidoId)
        const data = await getRecorrido(accessIdNum, sentidoIdNum);
        setOraciones(data);
        setError(null);
      } catch (e) {
        console.error("Error al cargar recorrido:", e);
        setError("No se pudieron cargar las indicaciones");
      } finally {
        setLoading(false);
      }
    })();
  // IMPORTANTE: depende de los números ya normalizados
  }, [accessIdNum, sentidoIdNum]);

  return (
    <View className="flex-1 bg-neutral-900">
      <Header onReportPress={() => {}} />
      <View className="flex-1 px-4 pt-6">
        <View className="items-center mb-6">
          <Text className="text-white text-2xl font-extrabold text-center">
            Indicaciones
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#ffffff" />
            <Text className="text-white/60 mt-4">Cargando indicaciones...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-red-400 text-center">{error}</Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-white/80 text-base mb-4">
                Recorrido
              </Text>
            </View>

            {oraciones.map((oracion, index) => (
              <View
                key={index}
                className="bg-neutral-800 rounded-lg p-4 mb-3 border border-neutral-700"
              >
                <View className="flex-row items-start">
                  <View className="bg-blue-500 rounded-full w-8 h-8 items-center justify-center mr-3">
                    <Text className="text-white font-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-white text-base flex-1 leading-6">
                    {oracion}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <Footer
        onBackPress={() => {
          Speech.stop();
          router.back();
        }}
        onMenuPress={() => setMenuOpen(true)}
        onHomePress={() => {
          Speech.stop();
          router.replace("/");
        }}
      />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}