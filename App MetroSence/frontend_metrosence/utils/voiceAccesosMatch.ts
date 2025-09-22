import {
  DetalleEstacionType,
  getDetallePorEstacion,
} from "../lib/accesos";

const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!¡¿?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const LETTER_WORDS: Record<string, string> = {
  a: "a",
  be: "b",
  b: "b",
  ce: "c",
  c: "c",
  de: "d",
  d: "d",
  e: "e",
  efe: "f",
  f: "f",
  ge: "g",
  g: "g",
};

export function isGoBack(text: string) {
  const t = normalize(text);
  if (!t) return false;
  if (/\b(atr|atra|atras|atr\u00E1s|atrás)\b/.test(t)) return true;
  if (t.includes("volver atras") || t.includes("volver atrás")) return true;
  if (t.split(" ").includes("volver") || t.split(" ").includes("regresar"))
    return true;
  return false;
}

export function extractLetter(utterance: string): string | null {
  const u = normalize(utterance);
  // patrones tipo: "acceso a", "entrada b", "acceso: c" o solo "a"
  const m = u.match(/\b(?:acceso|entrada)?\s*([a-zñ])\b/);
  if (m && m[1]) return m[1];
  // letra por nombre ("be", "ce", "equis", etc.)
  for (const [word, letter] of Object.entries(LETTER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(u)) return letter;
  }
  return null;
}

export function matchAccessFromUtterance(
  utterance: string,
  detalle?: DetalleEstacionType
) {
  if (!utterance || !detalle?.accesos?.length) return null;
  const u = normalize(utterance);

  // 1) Coincidencia por dirección completa
  for (const a of detalle.accesos) {
    const dir = normalize(a.direccion);
    if (dir && u.includes(dir)) return a;
  }

  // 2) Coincidencia por última palabra distintiva de la dirección
  for (const a of detalle.accesos) {
    const dir = normalize(a.direccion);
    const parts = dir.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      if (last.length >= 4 && u.split(" ").includes(last)) return a;
    }
  }

  // 3) Coincidencia por letra (A, B, C...)
  const letter = extractLetter(u);
  if (letter) {
    const found = detalle.accesos.find(
      (a) => normalize(String(a.letra)) === letter
    );
    if (found) return found;
  }

  return null;
}