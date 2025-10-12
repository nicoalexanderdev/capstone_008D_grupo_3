// hooks/useMidasModel.ts
import { useState, useEffect } from 'react';

export function useMidasModel() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  const loadModel = async () => {
    try {
      setIsLoading(true);
      // Simular carga del modelo
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      setModelLoaded(true);
      console.log('Modelo MiDaS simulado - listo para uso');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const estimateDepth = async (imageUri: string): Promise<number[] | null> => {
    if (!modelLoaded) {
      setError('Modelo no cargado');
      return null;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Procesando imagen:', imageUri);
      
      // Simular procesamiento
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
      
      // Generar datos de profundidad realistas simulados
      const width = 256;
      const height = 256;
      const depthMap = new Array(width * height);
      
      // Simular un mapa de profundidad con patrones realistas
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2)
          );
          const normalizedDistance = distanceFromCenter / (width/2);
          
          // Profundidad simulada: más cerca del centro = más lejano
          const depth = 1.0 + Math.sin(normalizedDistance * 3) * 5 + Math.random() * 0.5;
          depthMap[y * width + x] = depth;
        }
      }
      
      console.log('✅ Mapa de profundidad simulado generado');
      return depthMap;
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModel();
  }, []);

  return {
    isLoading,
    error,
    estimateDepth,
    reloadModel: loadModel,
    modelLoaded
  };
}