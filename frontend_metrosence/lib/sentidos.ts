// lib/sentidos.ts
import { apiFetch } from './api';

export type SentidoType = {
  id: number;
  estacion_id: number;
  linea_id: number;
  estacion: {
    name: string;
  };
};

export async function getSentidosPorLinea(lineaId: number): Promise<SentidoType[]> {
  try {
    const sentidos: SentidoType[] = await apiFetch(`/sentidos/linea/${lineaId}`);
    return sentidos;
  } catch (error) {
    console.error("Failed to fetch sentidos:", error);
    throw error;
  }
}