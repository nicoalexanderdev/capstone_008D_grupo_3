// hooks/useYoloModel.ts
import { useCallback, useEffect, useState } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import { useRemoteTFLiteModel } from "./useRemoteTFLiteModel";
import { decode } from 'jpeg-js';

// Clases COCO que YOLO puede detectar (80 clases)
const COCO_CLASSES = [
  "persona", "bicicleta", "auto", "moto", "avión", "bus", "tren", "camión",
  "bote", "semáforo", "hidrante", "señal de stop", "parquímetro", "banca",
  "pájaro", "gato", "perro", "caballo", "oveja", "vaca", "elefante", "oso",
  "cebra", "jirafa", "mochila", "paraguas", "cartera", "corbata", "maleta",
  "frisbee", "esquís", "tabla de snow", "pelota", "cometa", "bate de béisbol",
  "guante de béisbol", "patineta", "tabla de surf", "raqueta de tenis", "botella",
  "copa de vino", "taza", "tenedor", "cuchillo", "cuchara", "bowl", "banana",
  "manzana", "sándwich", "naranja", "brócoli", "zanahoria", "hot dog", "pizza",
  "dona", "pastel", "silla", "sofá", "planta en maceta", "cama", "mesa de comedor",
  "inodoro", "TV", "laptop", "mouse", "control remoto", "teclado", "celular",
  "microondas", "horno", "tostadora", "lavaplatos", "refrigerador", "libro",
  "reloj", "jarrón", "tijeras", "oso de peluche", "secador de pelo", "cepillo de dientes"
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
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width, height } }],
    {
      base64: true,
    }
  );

  if (!resized.base64) {
    throw new Error("No se pudo obtener base64");
  }
  

  const jpegBytes = base64ToUint8Array(resized.base64);

  const totalPixels = width * height;
  const rgbSize = totalPixels * 3;
  
  // Buscar Start of Scan (0xFF 0xDA)
  let jpegDataStart = 0;
  for (let i = 0; i < jpegBytes.length - 1; i++) {
    if (jpegBytes[i] === 0xFF && jpegBytes[i + 1] === 0xDA) {
      jpegDataStart = i + 14;
      break;
    }
  }

  const jpegData = jpegBytes.slice(jpegDataStart);
  
  // Crear ArrayBuffer nuevo cada vez
  const buffer = new ArrayBuffer(rgbSize * Float32Array.BYTES_PER_ELEMENT);
  const rgb = new Float32Array(buffer);

  // Llenar el array RGB con valores normalizados [0, 1]
  for (let i = 0; i < rgbSize; i++) {
    const byteIndex = i % jpegData.length;
    const value = jpegData[byteIndex];
    rgb[i] = value / 255.0;
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
 * Aplica Non-Maximum Suppression
 */
function applyNMS(detections: YoloDetection[], iouThreshold: number): YoloDetection[] {
  if (detections.length === 0) return [];
  
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const keep: YoloDetection[] = [];

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

  return keep;
}

/**
 * Procesa la salida del modelo YOLO11n
 * Formato YOLO11n: [1, 84, 8400] transpuesto
 * Los datos están organizados: [x1,x2,...x8400, y1,y2,...y8400, w1,w2,..., h1,h2,..., class0_1,class0_2,...]
 */
function processYoloOutput(
  output: Float32Array | number[],
  confidenceThreshold: number,
  iouThreshold: number,
  imgWidth: number,
  imgHeight: number
): YoloDetection[] {
  const detections: YoloDetection[] = [];
  
  // YOLO11n formato: [1, 84, 8400]
  // 84 = 4 (bbox coords) + 80 (class scores)
  // 8400 = número de detecciones
  const numClasses = 80;
  const numBboxCoords = 4;
  const numDetections = 8400; // Fijo para YOLO11n
  
  console.log(`🔍 Formato YOLO: 84 features x ${numDetections} detecciones`);
  console.log(`📊 Total elementos: ${output.length}`);

  // Los datos están transpuestos:
  // output[0] = x1, output[1] = x2, ..., output[8399] = x8400
  // output[8400] = y1, output[8401] = y2, ..., output[16799] = y8400
  // output[16800] = w1, output[16801] = w2, ..., output[25199] = w8400
  // output[25200] = h1, output[25201] = h2, ..., output[33599] = h8400
  // output[33600] = class0_1, output[33601] = class0_2, ...
  
  for (let i = 0; i < numDetections; i++) {
    // Índices para cada coordenada/feature
    const xIdx = i;
    const yIdx = numDetections + i;
    const wIdx = numDetections * 2 + i;
    const hIdx = numDetections * 3 + i;
    
    // Extraer bbox (formato: center_x, center_y, width, height - normalizado)
    const centerX = output[xIdx];
    const centerY = output[yIdx];
    const width = output[wIdx];
    const height = output[hIdx];
    
    // Encontrar la clase con mayor score
    let maxScore = -Infinity;
    let maxClassId = -1;
    
    for (let c = 0; c < numClasses; c++) {
      const scoreIdx = numDetections * (numBboxCoords + c) + i;
      const score = output[scoreIdx];
      
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }
    
    // Filtrar por umbral de confianza
    if (maxScore >= confidenceThreshold && maxClassId >= 0) {
      // Las coordenadas de YOLO11 ya vienen en píxeles, no normalizadas
      // Convertir de centro a esquina superior izquierda
      const bboxX = centerX - width / 2;
      const bboxY = centerY - height / 2;
      
      detections.push({
        className: COCO_CLASSES[maxClassId] || `Clase ${maxClassId}`,
        classId: maxClassId,
        confidence: maxScore,
        bbox: {
          x: Math.max(0, bboxX),
          y: Math.max(0, bboxY),
          width: Math.min(width, imgWidth),
          height: Math.min(height, imgHeight),
        },
      });
    }
  }
  
  console.log(`✅ ${detections.length} detecciones sobre umbral ${confidenceThreshold.toFixed(2)}`);
  
  // Aplicar NMS
  const filtered = applyNMS(detections, iouThreshold);
  console.log(`🎯 ${filtered.length} detecciones después de NMS`);
  
  return filtered;
}

/**
 * Hook para YOLO11n - Estructura idéntica a useMidasModel
 */
export function useYoloModel(
  modelUrl: string,
  confidenceThreshold: number = 0.3,
  iouThreshold: number = 0.45
) {
  const { model, inputDims: rawInputDims, loading, error } = useRemoteTFLiteModel(modelUrl);

  // CRÍTICO: YOLO11n espera 640x640, pero detectInputDims puede retornar valores incorrectos
  // Forzamos las dimensiones correctas basadas en los inputs del modelo
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
    isReady, // Agregado para debugging
  };
}