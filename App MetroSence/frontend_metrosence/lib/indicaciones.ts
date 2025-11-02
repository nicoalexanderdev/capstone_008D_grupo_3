import { apiFetch } from './api';

export type RecorridoType = {
  estacion_id: number;
  accedo_id: number;
  sentido_id: number;
  instrucciones: string;
  id_recorrido: number;
};

export async function getRecorrido(acceso_id: number, sentido_id: number): Promise<string[]> {
  try {
    const data: RecorridoType = await apiFetch(`/recorridos/accesos/${acceso_id}/sentidos/${sentido_id}`);
    const texto: string = data.instrucciones;
    const oraciones = separarPorPuntos(texto);
    console.log('Oraciones:', oraciones);
    return oraciones;
  } catch (error) {
    console.error("Failed to fetch recorridos:", error);
    throw error;
  }
}

function separarPorPuntos(texto: string): string[] {
  return texto
    .split('.')
    .map(oracion => oracion.trim())
    .filter(oracion => oracion.length > 0);
}