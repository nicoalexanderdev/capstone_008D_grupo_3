// lib/lineColors.ts
export const lineColors: Record<string, { color: string; textColor: string }> = {
  "Línea 1": { color: "#E20E17", textColor: "#FFFFFF" },
  "Línea 2": { color: "#FFD100", textColor: "#1B1B1B" },
  "Línea 3": { color: "#6B3B13", textColor: "#FFFFFF" },
  "Línea 4": { color: "#0D2CB3", textColor: "#FFFFFF" },
  "Línea 4A": { color: "#2AA6E0", textColor: "#FFFFFF" },
  "Línea 5": { color: "#13A56F", textColor: "#FFFFFF" },
  "Línea 6": { color: "#8E44AD", textColor: "#FFFFFF" },
};

export const getLineColor = (lineName: string) => {
  return lineColors[lineName] || { color: "#666666", textColor: "#FFFFFF" };
};