// app/constants/metroLines.ts
export type MetroLine = {
  id: string;
  label: string;     // Texto visible en el botón
  color: string;     // Fondo del botón
  textColor?: string;// Color del texto (por defecto blanco)
  route?: string;    // (opcional) screen de destino
};

export const METRO_LINES: MetroLine[] = [
  { id: "l1",  label: "Línea 1",  color: "#E20E17" }, // rojo
  { id: "l2",  label: "Línea 2",  color: "#FFD100", textColor: "#1b1b1b" }, // amarillo
  { id: "l3",  label: "Línea 3",  color: "#6B3B13" }, // café
  { id: "l4",  label: "Línea 4",  color: "#0D2CB3" }, // azul
  { id: "l4a", label: "Línea 4A", color: "#2AA6E0" }, // celeste
  { id: "l5",  label: "Línea 5",  color: "#13A56F" }, // verde
  { id: "l6",  label: "Línea 6",  color: "#8E44AD" }, // morado
];
