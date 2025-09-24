import { apiFetch } from './api';

export type Estacion = {
  id_estacion: number;
  name: string;
};

export async function getEstacionesPorLinea(lineaId: number, skip: number): Promise<Estacion[]> {
  try {
    const estaciones: Estacion[] = await apiFetch(`/lineas-estaciones/linea/${lineaId}/estaciones?skip=${skip}&limit=10`);
    return estaciones;
  } catch (error) {
    console.error("Failed to fetch estaciones:", error);
    throw error;
  }
}

// Nueva función para obtener TODAS las estaciones de una línea
export async function getAllEstacionesPorLinea(lineaId: number): Promise<Estacion[]> {
  try {
    // Hacemos una llamada con un límite muy alto para obtener todas las estaciones
    const estaciones: Estacion[] = await apiFetch(`/lineas-estaciones/linea/${lineaId}/estaciones?skip=0&limit=100`);
    return estaciones;
  } catch (error) {
    console.error("Failed to fetch all estaciones for line:", error);
    throw error;
  }
}