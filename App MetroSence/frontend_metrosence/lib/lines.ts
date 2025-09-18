// lib/lines.ts
import { apiFetch } from './api';
import { getLineColor } from './lineColors';

export type Line = {
  id_linea: number;
  name: string;
  color?: string;
  textColor?: string;
}

export async function getAllLines(): Promise<Line[]> {
  try {
    const lines: Line[] = await apiFetch('/lineas?skip=0&limit=10/');
    
    return lines.map((line) => {
      const colorInfo = getLineColor(line.name);
      
      return {
        id_linea: line.id_linea,
        name: line.name,
        color: colorInfo.color,
        textColor: colorInfo.textColor
      };
    });
  } catch (error) {
    console.error("Failed to fetch lines:", error);
    throw error;
  }
}