// hooks/useYoloModel.ts - VERSIÓN CORREGIDA
import { useCallback, useEffect, useState } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import { useRemoteTFLiteModel } from "./useRemoteTFLiteModel";
import { Buffer as BufferPolyfill } from 'buffer';
if (typeof global.Buffer === 'undefined') {
  global.Buffer = BufferPolyfill;
}
import * as jpeg from 'jpeg-js'

// ✅ CLASES PERSONALIZADAS DEL MODELO (10 clases)
// CRÍTICO: Este orden DEBE coincidir EXACTAMENTE con el data.yaml usado en el entrenamiento
// El modelo espera shape [1, 14, 8400] donde 14 = 4 (bbox) + 10 (clases)
const CUSTOM_CLASSES = [
  "Ascensor",      // 0
  "Persona",       // 1
  "Cajero",        // 2
  "Totem",         // 3
  "PagoBip",       // 4
  "Advertencia",   // 5
  "Escaleras",     // 6
  "Asistente",     // 7
  "Entrada",       // 8
  "Anden"          // 9
];

export type YoloDetection = {
  className: string;
  classId: number;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
 * Mismo enfoque que MiDaS para compatibilidad
 */
async function imageToRGBFloat32(
  uri: string,
  width: number,
  height: number
): Promise<Float32Array> {
  console.log('Buffer disponible:', typeof Buffer !== 'undefined');

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

  const jpegBytes = base64ToUint8Array(resized.base64);
  console.log('JPEG bytes:', jpegBytes.length);

  // Convertir Uint8Array a Buffer para jpeg-js
  const buffer = Buffer.from(jpegBytes);
  console.log('Buffer creado:', buffer.length);

  // Decodificar usando jpeg-js
  const rawImageData = jpeg.decode(buffer);
  console.log(`✅ Imagen decodificada: ${rawImageData.width}x${rawImageData.height}, ${rawImageData.data.length} bytes`);

  if (rawImageData.width !== width || rawImageData.height !== height) {
    throw new Error("Dimensiones no coinciden después de decodificar");
  }

  const rgb = new Float32Array(width * height * 3);
  const rgbaData = rawImageData.data;

  let j = 0;
  for (let i = 0; i < rgbaData.length; i += 4) {
    rgb[j++] = rgbaData[i] / 255.0;     // R
    rgb[j++] = rgbaData[i + 1] / 255.0; // G
    rgb[j++] = rgbaData[i + 2] / 255.0; // B
    // Ignorar alpha
  }

  return rgb;
}

/**
 * Calcula Intersection over Union entre dos bounding boxes
 */
function calculateIoU(
  box1: YoloDetection["bbox"],
  box2: YoloDetection["bbox"]
): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area1 = box1.width * box1.height;
  const area2 = box2.width * box2.height;
  const union = area1 + area2 - intersection;

  return union > 0 ? intersection / union : 0;
}

/**
 * Aplica Non-Maximum Suppression por clase
 */
function applyNMS(detections: YoloDetection[], iouThreshold: number): YoloDetection[] {
  if (detections.length === 0) return [];

  const byClass = new Map<number, YoloDetection[]>();
  for (const det of detections) {
    if (!byClass.has(det.classId)) byClass.set(det.classId, []);
    byClass.get(det.classId)!.push(det);
  }

  const keep: YoloDetection[] = [];
  for (const group of byClass.values()) {
    const sorted = [...group].sort((a, b) => b.confidence - a.confidence);
    while (sorted.length > 0) {
      const current = sorted.shift()!;
      keep.push(current);
      for (let i = sorted.length - 1; i >= 0; i--) {
        const iou = calculateIoU(current.bbox, sorted[i].bbox);
        if (iou > iouThreshold) {
          sorted.splice(i, 1);
        }
      }
    }
  }

  return keep;
}

/**
 * Procesa la salida del modelo YOLO PERSONALIZADO
 * 
 * ⚠️ IMPORTANTE: Tu modelo tiene shape [1, 14, 8400] NO [1, 84, 8400]
 * 
 * Formato: [1, num_features, num_detections]
 * - num_features = 4 (bbox) + 10 (clases personalizadas) = 14
 * - num_detections = 8400 (posiciones de anclas)
 * 
 * Sin embargo, tu log muestra [1, 16, 8400], lo que sugiere que:
 * - Puede tener 2 features adicionales (objectness, padding, etc.)
 * - O el modelo exportado tiene un formato ligeramente diferente
 * 
 * Features por detección:
 * [0-3]: cx, cy, w, h (bbox normalizado 0-1)
 * [4-13]: scores de las 10 clases personalizadas
 * [14-15]: posiblemente objectness o padding (ignorar)
 */
function processYoloOutput(
  output: Float32Array | number[],
  confidenceThreshold: number,
  iouThreshold: number,
  imgWidth: number,
  imgHeight: number
): YoloDetection[] {
  const detections: YoloDetection[] = [];
  
  // ✅ NÚMERO CORRECTO DE CLASES (10 personalizadas, NO 80 de COCO)
  const numClasses = CUSTOM_CLASSES.length; // 10
  const numDetections = 8400;
  
  // Detectar el número de features basándose en el tamaño del output
  // Tu log muestra: 134400 elementos = output.length
  // Si es [14, 8400] aplanado: 14 * 8400 = 117,600
  // Si es [16, 8400] aplanado: 16 * 8400 = 134,400 ✅
  const numFeatures = output.length / numDetections;
  
  console.log(`🔍 Formato YOLO: ${numFeatures} features x ${numDetections} detecciones`);
  console.log(`📊 Total elementos: ${output.length}`);
  console.log(`🎯 Clases esperadas: ${numClasses} (${CUSTOM_CLASSES[0]}, ${CUSTOM_CLASSES[1]}, ...)`);

  // Validación
  if (output.length !== numFeatures * numDetections) {
    console.error(`❌ Error: Tamaño de salida inesperado`);
    console.error(`   Esperado: ${numFeatures} * ${numDetections} = ${numFeatures * numDetections}`);
    console.error(`   Recibido: ${output.length}`);
    return [];
  }

  for (let i = 0; i < numDetections; i++) {
    // Indices para bbox (siempre los primeros 4 features)
    const xIdx = i;
    const yIdx = numDetections + i;
    const wIdx = numDetections * 2 + i;
    const hIdx = numDetections * 3 + i;
    
    // Extraer bbox (formato: center_x, center_y, width, height - normalizado 0-1)
    const centerX = output[xIdx];
    const centerY = output[yIdx];
    const width = output[wIdx];
    const height = output[hIdx];
    
    // Encontrar la clase con mayor score (features 4 a 13, o 4 a numClasses+3)
    let maxScore = -Infinity;
    let maxClassId = -1;
    
    for (let c = 0; c < numClasses; c++) {
      const scoreIdx = numDetections * (4 + c) + i;
      const score = output[scoreIdx];
      
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }
    
    if (maxScore >= confidenceThreshold && maxClassId >= 0 && maxClassId < numClasses) {
      // Escalar a píxeles
      const bboxX = (centerX - width / 2) * imgWidth;
      const bboxY = (centerY - height / 2) * imgHeight;
      const bboxW = width * imgWidth;
      const bboxH = height * imgHeight;
      
      detections.push({
        className: CUSTOM_CLASSES[maxClassId] || `Clase ${maxClassId}`,
        classId: maxClassId,
        confidence: maxScore,
        bbox: {
          x: Math.max(0, bboxX),
          y: Math.max(0, bboxY),
          width: Math.max(0, Math.min(bboxW, imgWidth - bboxX)),
          height: Math.max(0, Math.min(bboxH, imgHeight - bboxY)),
        },
      });
    }
  }
  
  console.log(`✅ ${detections.length} detecciones sobre umbral ${confidenceThreshold.toFixed(2)}`);
  
  // Aplicar NMS por clase
  const filtered = applyNMS(detections, iouThreshold);
  console.log(`🎯 ${filtered.length} detecciones después de NMS`);
  
  return filtered;
}

/**
 * Hook para YOLO personalizado - Estructura idéntica a useMidasModel
 */
export function useYoloModel(
  modelUrl: string,
  confidenceThreshold: number = 0.3,
  iouThreshold: number = 0.45
) {
  const { model, inputDims: rawInputDims, loading, error } = useRemoteTFLiteModel(modelUrl);

  // CRÍTICO: YOLO espera 640x640
  const [inputDims, setInputDims] = useState({ w: 640, h: 640 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (model && !loading && !error) {
      const inputs = (model as any).inputs || [];
      if (inputs.length > 0) {
        const shape = inputs[0].shape || [1, 640, 640, 3];
        const h = shape[1] || 640;
        const w = shape[2] || 640;
        setInputDims({ w, h });
        setIsReady(true);
        console.log(`✅ YOLO listo - Dimensiones: ${w}x${h}`);
        console.log(`📋 Detectando ${CUSTOM_CLASSES.length} clases personalizadas`);
      }
    }
  }, [model, loading, error]);

  const detectObjects = useCallback(
    async (imgUri: string): Promise<YoloDetection[]> => {
      console.log("🔵 detectObjects llamado");
      console.log("  - isReady:", isReady);
      console.log("  - model:", !!model);
      console.log("  - loading:", loading);
      console.log("  - error:", !!error);

      if (!isReady || !model) {
        console.warn("⚠️ Modelo YOLO no está listo");
        console.warn("  - isReady:", isReady, "- model:", !!model);
        return [];
      }

      const { h, w } = inputDims;

      try {
        console.log("🚀 Iniciando detección YOLO");
        console.log(`📐 Dimensiones: ${w}x${h}`);
        
        // 1) Convertir imagen a Float32Array RGB
        const rgbData = await imageToRGBFloat32(imgUri, w, h);
        console.log(`✅ Imagen procesada: ${rgbData.length} elementos`);

        // 2) Delay para evitar que el GC libere el buffer
        await new Promise<void>(resolve => setTimeout(resolve, 50));

        // 3) Verificar buffer válido
        if (!rgbData.buffer || rgbData.buffer.byteLength === 0) {
          throw new Error("ArrayBuffer inválido");
        }

        // 4) Mantener referencia fuerte al buffer
        const bufferRef = rgbData.buffer;
        
        // 5) Inferencia
        const anyModel = model as any;
        let out: any;
        
        try {
          out = anyModel.runSync
            ? anyModel.runSync(rgbData)
            : await anyModel.run(rgbData);
        } catch (e1) {
          out = anyModel.runSync
            ? anyModel.runSync([rgbData])
            : await anyModel.run([rgbData]);
        }

        // Mantener referencia del buffer
        if (bufferRef.byteLength > 0) {
          // Buffer aún válido
        }

        console.log("✅ Inferencia completada");

        // 6) Procesar salida
        let outData: Float32Array | number[];

        if (Array.isArray(out) && out.length > 0) {
          const first = out[0];
          
          if (first instanceof Float32Array || first instanceof Array) {
            outData = first;
          } else if (typeof first === 'object' && first !== null) {
            outData = (first as any).data;
          } else {
            throw new Error('Formato de salida no reconocido');
          }
        } else if (out instanceof Float32Array || out instanceof Array) {
          outData = out;
        } else if (typeof out === 'object' && out !== null && (out as any).data) {
          outData = (out as any).data;
        } else {
          throw new Error('El modelo no retornó datos válidos');
        }

        if (!outData || outData.length === 0) {
          throw new Error("Salida del modelo vacía");
        }

        console.log(`📊 Salida del modelo: ${outData.length} elementos`);

        // 7) Procesar detecciones YOLO
        const detections = processYoloOutput(
          outData,
          confidenceThreshold,
          iouThreshold,
          w,
          h
        );

        return detections;
      } catch (err: any) {
        console.error("❌ Error en YOLO detectObjects:", err);
        return [];
      }
    },
    [isReady, model, inputDims, confidenceThreshold, iouThreshold]
  );

  return {
    model,
    inputDims,
    loading,
    error,
    detectObjects,
    isReady,
  };
}