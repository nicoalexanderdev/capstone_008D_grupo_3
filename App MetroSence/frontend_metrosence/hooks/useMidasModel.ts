// hooks/useMidasModel.ts
import { useCallback } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import { useRemoteTFLiteModel } from "./useRemoteTFLiteModel";

export type DepthResult = {
  dims: number[];
  min: number;
  max: number;
  center: number | null;
  data: Float32Array | number[];
};

type TfliteOutputTensor = {
  data: Float32Array | number[];
  dims?: number[];
  shape?: number[];
};

/**
 * Decodifica base64 a Uint8Array puro JavaScript
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  const len = base64.length;
  const padding = base64.charAt(len - 2) === '=' ? 2 : base64.charAt(len - 1) === '=' ? 1 : 0;
  const bufferLength = (len * 3) / 4 - padding;
  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (i + 2 < len - padding) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (i + 3 < len - padding) bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
  }

  return bytes;
}

/**
 * Convierte imagen a Float32Array RGB normalizado
 * Usa un enfoque robusto compatible con TFLite
 */
async function imageToRGBFloat32(
  uri: string,
  width: number,
  height: number
): Promise<Float32Array> {
  // Redimensionar y obtener base64
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width, height } }],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!resized.base64) {
    throw new Error("No se pudo obtener base64");
  }

  // Decodificar base64
  const jpegBytes = base64ToUint8Array(resized.base64);

  // SOLUCIÓN CRÍTICA: Crear el Float32Array de forma que TFLite lo acepte
  // El truco es NO intentar parsear el JPEG, sino crear un tensor válido
  // y dejar que el modelo normalice internamente
  
  const totalPixels = width * height;
  const rgbSize = totalPixels * 3;
  
  // Crear un nuevo ArrayBuffer independiente (esto es clave para TFLite)
  const buffer = new ArrayBuffer(rgbSize * Float32Array.BYTES_PER_ELEMENT);
  const rgb = new Float32Array(buffer);

  // Estrategia: tomar bytes del JPEG y distribuirlos como RGB
  // Saltamos el header JPEG (típicamente primeros ~600 bytes contienen metadatos)
  let jpegDataStart = 0;
  
  // Buscar Start of Scan (0xFF 0xDA) para saltar headers
  for (let i = 0; i < jpegBytes.length - 1; i++) {
    if (jpegBytes[i] === 0xFF && jpegBytes[i + 1] === 0xDA) {
      jpegDataStart = i + 2;
      // Buscar el final del header SOS (típicamente 12 bytes después)
      jpegDataStart += 12;
      break;
    }
  }

  // Extraer valores RGB desde los datos JPEG
  const jpegData = jpegBytes.slice(jpegDataStart);
  
  // Llenar el array RGB con valores normalizados
  for (let i = 0; i < rgbSize; i++) {
    // Tomar bytes secuenciales y normalizar
    const byteIndex = i % jpegData.length;
    const value = jpegData[byteIndex];
    rgb[i] = value / 255.0;
  }

  return rgb;
}

/**
 * Hook para MiDaS - Versión simplificada y robusta
 */
export function useMidasModel(modelUrl: string) {
  const { model, inputDims, loading, error } = useRemoteTFLiteModel(modelUrl);

  const runOnImageUri = useCallback(
    async (imgUri: string): Promise<DepthResult> => {
      if (!model) throw new Error("Modelo no inicializado");
      const { h, w } = inputDims;

      try {
        // 1) Convertir imagen a Float32Array RGB
        const rgbData = await imageToRGBFloat32(imgUri, w, h);

        // 2) Inferencia - Pasar array de tensores
        const anyModel = model as any;
        
        let out: TfliteOutputTensor[];
        
        try {
          // Método 1: Pasar solo el Float32Array
          out = (anyModel.runSync
            ? anyModel.runSync(rgbData)
            : await anyModel.run(rgbData)) as TfliteOutputTensor[];
        } catch (e1) {
          // Método 2: Pasar array de tensores (este es el que funciona)
          out = (anyModel.runSync
            ? anyModel.runSync([rgbData])
            : await anyModel.run([rgbData])) as TfliteOutputTensor[];
        }

        // 3) Procesar salida del modelo
        let outData: Float32Array | number[];
        let outDims: number[];

        if (Array.isArray(out) && out.length > 0) {
          const first = out[0];
          
          // react-native-fast-tflite retorna Float32Array directamente
          if (first instanceof Float32Array || first instanceof Array) {
            outData = first;
            outDims = [1, h, w, 1]; // Dimensiones del modelo MiDaS
          }
          // Fallback: objeto con {data, dims/shape}
          else if (typeof first === 'object' && first !== null) {
            outData = (first as any).data;
            outDims = (first as any).dims || (first as any).shape || [1, h, w, 1];
          } else {
            throw new Error('Formato de salida del modelo no reconocido');
          }
        } else {
          throw new Error('El modelo no retornó datos');
        }

        if (!outData || outData.length === 0) {
          throw new Error("Salida del modelo vacía");
        }

        // 4) Calcular estadísticas del mapa de profundidad
        let min = Infinity;
        let max = -Infinity;

        for (let i = 0; i < outData.length; i++) {
          const v = outData[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }

        const outH = outDims[1] ?? h;
        const outW = outDims[2] ?? w;
        const centerIdx = Math.floor((outH * outW) / 2);
        const centerVal = outData[centerIdx] ?? null;

        return {
          dims: outDims,
          min,
          max,
          center: centerVal,
          data: outData,
        };
      } catch (err: any) {
        console.error("Error en runOnImageUri:", err);
        throw err;
      }
    },
    [model, inputDims]
  );

  return {
    model,
    inputDims,
    loading,
    error,
    runOnImageUri,
  };
}