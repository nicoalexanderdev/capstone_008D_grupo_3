import type { Href } from "expo-router";

export type MetroLine = {
  id: string;
  name: string;
  color: string;
  textColor?: string;
  to?: Href; // ahora coincide con router.push
};

export const METRO_LINES: MetroLine[] = [
  {
    id: "l1",
    name: "Línea 1",
    color: "#E20E17",
    to: { pathname: "/sentido", params: { line: "l1" } },
  },
  { id: "l2", name: "Línea 2", color: "#FFD100", textColor: "#1b1b1b" },
  { id: "l3", name: "Línea 3", color: "#6B3B13" },
  { id: "l4", name: "Línea 4", color: "#0D2CB3" },
  { id: "l4a", name: "Línea 4A", color: "#2AA6E0" },
  { id: "l5", name: "Línea 5", color: "#13A56F" },
  { id: "l6", name: "Línea 6", color: "#8E44AD" },
];

