import { apiFetch } from './api';

export type AccesoType = {
    "estacion_id": number;
    "letra": string;
    "direccion": string;
    "id_acceso": number;
};

export type HorarioType = {
    "open_weekdays": string;
    "close_weekdays": string;
    "open_saturdays": string;
    "close_saturdays": string;
    "open_holidays": string;
    "close_holidays": string;
    "id_horario": number;
};

export type DetalleEstacionType = {
    "name": string;
    "id_estacion": number;
    "accesos": AccesoType[];
    "horario": HorarioType;
};

export async function getDetallePorEstacion(estacionId: number): Promise<DetalleEstacionType> {
  try {
    const detallesEstacion: DetalleEstacionType = await apiFetch(`/stations/${estacionId}/detalles`);
    return detallesEstacion;
  } catch (error) {
    console.error("Failed to fetch estaciones:", error);
    throw error;
  }
}