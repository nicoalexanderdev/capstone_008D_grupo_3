// hooks/useRemoteTFLiteModel.ts
import { useEffect, useRef, useState } from "react";
import {
  loadTensorflowModel,
  type TensorflowModel,
} from "react-native-fast-tflite";

export type TInputDims = { n: number; h: number; w: number; c: number };

let singletonPromise: Promise<TensorflowModel | null> | null = null;

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
 * Carga un modelo TFLite desde URL (Opción A). Reutiliza una sola instancia (singleton).
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
    setLoading(true);
    setError(null);

    if (!singletonPromise) {
      singletonPromise = (async () => {
        const m = await loadTensorflowModel({ url });
        return m ?? null;
      })();
    }

    singletonPromise.then((m) => {
      if (!mountedRef.current) return;

      // DEBUG: Inspeccionar el modelo
      console.log("=== DEBUG MODELO ===");
      console.log("Modelo cargado:", !!m);
      if (m) {
        console.log("Propiedades del modelo:", Object.keys(m));
        console.log("Inputs:", (m as any).inputs || (m as any).inputTensors);
        console.log("Outputs:", (m as any).outputs || (m as any).outputTensors);

        // Ver qué métodos tiene disponibles
        console.log("Tiene runSync?", typeof (m as any).runSync);
        console.log("Tiene run?", typeof (m as any).run);
      }
      console.log("===================");

      setModel(m);
      setInputDims(detectInputDims(m));
      setLoading(false);
    });

    // Si quisieras cerrar el modelo al desmontar (no común en singleton):
    // return () => { model?.close?.(); };
  }, [url]);

  return { model, inputDims, loading, error };
}
