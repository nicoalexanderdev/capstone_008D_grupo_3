import { apiFetch } from './api';

export type AccesoType = {
    "estacion_id": number,
    "letra": string,
    "direccion": string,
    "id": number
};

export async function getAccesosPorEstacion(estacionId: number): Promise<AccesoType[]> {
  try {
    const accesos: AccesoType[] = await apiFetch(`/accesos/estacion/${estacionId}`);
    return accesos;
  } catch (error) {
    console.error("Failed to fetch estaciones:", error);
    throw error;
  }
}