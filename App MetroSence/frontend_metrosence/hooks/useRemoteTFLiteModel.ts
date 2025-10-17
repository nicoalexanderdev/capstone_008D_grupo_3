// hooks/useRemoteTFLiteModel.ts
import { useEffect, useRef, useState } from "react";
import {
  loadTensorflowModel,
  type TensorflowModel,
} from "react-native-fast-tflite";

export type TInputDims = { n: number; h: number; w: number; c: number };

// CAMBIO CRÍTICO: Usar un Map para múltiples modelos en lugar de un singleton global
const modelCache = new Map<string, Promise<TensorflowModel | null>>();

function detectInputDims(m: TensorflowModel | null | undefined): TInputDims {
  // Distintas versiones exponen inputs como { dims } o { shape }
  const arr: any[] =
    (m as any)?.inputs || (m as any)?.inputTensors || (m as any)?._inputs || [];

  const dims =
    Array.isArray(arr) && arr[0]?.dims
      ? arr[0].dims
      : Array.isArray(arr) && arr[0]?.shape
        ? arr[0].shape
        : [1, 256, 256, 3];

  const [n, h, w, c] = dims;
  return {
    n: Number.isFinite(n) ? n : 1,
    h: Number.isFinite(h) ? h : 256,
    w: Number.isFinite(w) ? w : 256,
    c: Number.isFinite(c) ? c : 3,
  };
}

/**
 * Carga un modelo TFLite desde URL.
 * Reutiliza instancias por URL (cache basado en URL).
 * Soporta múltiples modelos simultáneos.
 * Requiere Development Build o Release (no funciona en Expo Go).
 */
export function useRemoteTFLiteModel(url: string) {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [inputDims, setInputDims] = useState<TInputDims>({
    n: 1,
    h: 256,
    w: 256,
    c: 3,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!url) {
      setError(new Error("URL del modelo no proporcionada"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Verificar si ya existe una promesa de carga para esta URL
    if (!modelCache.has(url)) {
      console.log(`📥 Cargando modelo desde: ${url}`);
      
      // Crear nueva promesa de carga y guardarla en el cache
      const loadPromise = (async () => {
        try {
          const m = await loadTensorflowModel({ url });
          console.log(`✅ Modelo cargado exitosamente desde: ${url}`);
          return m ?? null;
        } catch (err) {
          console.error(`❌ Error cargando modelo desde ${url}:`, err);
          // Remover del cache si falla la carga
          modelCache.delete(url);
          throw err;
        }
      })();

      modelCache.set(url, loadPromise);
    } else {
      console.log(`♻️ Reutilizando modelo cacheado: ${url}`);
    }

    // Obtener el modelo del cache
    modelCache.get(url)!.then((m) => {
      if (!mountedRef.current) return;

      // DEBUG: Inspeccionar el modelo
      console.log("=== DEBUG MODELO ===");
      console.log("URL:", url);
      console.log("Modelo cargado:", !!m);
      if (m) {
        console.log("Propiedades del modelo:", Object.keys(m));
        console.log("Inputs:", (m as any).inputs || (m as any).inputTensors);
        console.log("Outputs:", (m as any).outputs || (m as any).outputTensors);
      }
      console.log("===================");

      setModel(m);
      setInputDims(detectInputDims(m));
      setLoading(false);
    }).catch((err) => {
      if (!mountedRef.current) return;
      console.error("Error al obtener modelo del cache:", err);
      setError(err);
      setLoading(false);
    });

    // Nota: No cerramos los modelos al desmontar porque pueden estar
    // siendo usados por otros componentes (cache compartido)
  }, [url]);

  return { model, inputDims, loading, error };
}

/**
 * Función para limpiar el cache de modelos (útil para debugging o cambios de modelo)
 */
export function clearModelCache(url?: string) {
  if (url) {
    modelCache.delete(url);
    console.log(`🗑️ Cache limpiado para: ${url}`);
  } else {
    modelCache.clear();
    console.log("🗑️ Todo el cache de modelos limpiado");
  }
}