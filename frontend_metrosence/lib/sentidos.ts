// lib/sentidos.ts
import { apiFetch } from './api';

export type Sentido = {
  id: number;
  nombre: string;
  estacion: {
    id: number;
    name: string;
  };
};

export async function getSentidosPorLinea(lineaId: number): Promise<Sentido[]> {
  try {
    const sentidos: Sentido[] = await apiFetch(`/sentidos/linea/${lineaId}`);
    return sentidos;
  } catch (error) {
    console.error("Failed to fetch sentidos:", error);
    throw error;
  }
}