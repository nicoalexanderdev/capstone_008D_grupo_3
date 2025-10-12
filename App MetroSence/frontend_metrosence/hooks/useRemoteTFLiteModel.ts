import { useEffect, useState } from "react";
import { loadTensorflowModel, type TensorflowModel } from "react-native-fast-tflite";

/** Carga un modelo TFLite desde una URL HTTPS (Opción A). */
let singletonPromise: Promise<TensorflowModel | null> | null = null; // evita cargas duplicadas

export function useRemoteTFLiteModel(url: string) {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    if (!singletonPromise) {
      singletonPromise = (async () => {
        try {
          // Carga directa desde tu API/CDN
          const m = await loadTensorflowModel({ url });
          return m ?? null;
        } catch (e) {
          throw e;
        }
      })();
    }

    singletonPromise
      .then((m) => {
        if (mounted) {
          setModel(m);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e);
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [url]);

  return { model, loading, error };
}
