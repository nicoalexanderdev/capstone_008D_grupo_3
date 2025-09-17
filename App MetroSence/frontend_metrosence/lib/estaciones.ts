import { apiFetch } from './api';

export type Estacion = {
  id_estacion: number;
  name: string;
};

export async function getEstacionesPorLinea(lineaId: number): Promise<Estacion[]> {
  try {
    const estaciones: Estacion[] = await apiFetch(`/lineas-estaciones/linea/${lineaId}/estaciones`);
    return estaciones;
  } catch (error) {
    console.error("Failed to fetch estaciones:", error);
    throw error;
  }
}

// Si necesitas obtener todas las estaciones
export async function getAllEstaciones(): Promise<Estacion[]> {
  try {
    const estaciones: Estacion[] = await apiFetch('/estaciones?skip=0&limit=100');
    return estaciones;
  } catch (error) {
    console.error("Failed to fetch estaciones:", error);
    throw error;
  }
}