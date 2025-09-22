export type MetroLine = {
  id_linea: number;
  name: string;
  color?: string;
  textColor?: string;
};

const SPELLED_TO_KEY: Record<string, string> = {
  uno: "1",
  una: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  "cuatro a": "4a",
  "cuatro-a": "4a",
  cuatroa: "4a",
  cinco: "5",
  seis: "6",
};

const COLOR_ALIASES: Record<string, string[]> = {
  "1": ["roja", "rojo"],
  "2": ["amarilla", "amarillo"],
  "3": ["cafe", "café", "marron", "marrón", "bronce"],
  "4": ["azul"],
  "4a": ["celeste", "azul claro", "cuatro a", "4 a"],
  "5": ["verde"],
  "6": ["morada", "morado", "purpura", "púrpura", "violeta"],
};

export const ID_TO_KEY: Record<number, string> = {
  1: "1",
  11: "2",
  3: "3",
  4: "4",
  5: "4a",
  6: "5",
  7: "6",
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!¡¿?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const expandNumbers = (text: string) => {
  let t = normalize(text);
  t = t.replace(/\bcuatro\s*a\b/g, "4a");
  t = t
    .split(" ")
    .map((w) => SPELLED_TO_KEY[w] ?? w)
    .join(" ");
  // Support "l2" and "linea2"
  t = t
    .replace(/\bl\s*(\d+a?)\b/g, "l $1")
    .replace(/\b(linea|línea)(\d)/g, "$1 $2");
  return t;
};

export function matchLineFromUtterance(
  utterance: string,
  linesData: MetroLine[]
): MetroLine | null {
  if (!utterance || !linesData?.length) return null;

  const expanded = expandNumbers(utterance);
  const hasLineaKeyword = /\b(linea|línea|l)\b/.test(expanded);

  let best: { line: MetroLine; score: number } | null = null;

  for (const line of linesData) {
    const nameNorm = normalize(line.name);
    const key = ID_TO_KEY[line.id_linea] || extractKeyFromLineName(line.name);
    const colors = (key && COLOR_ALIASES[key]) || [];

    let score = 0;

    if (expanded.includes(nameNorm)) score += 4; // full name

    if (key) {
      const reKey = new RegExp(`\\b${escapeRe(key)}\\b`);
      const reLKey = new RegExp(`\\bl\\s*${escapeRe(key)}\\b`);
      const reLineaKey = new RegExp(
        `\\b(?:linea|línea)\\s*${escapeRe(key)}\\b`
      );

      if (reKey.test(expanded)) score += hasLineaKeyword ? 4 : 3;
      if (reLKey.test(expanded)) score += 4;
      if (reLineaKey.test(expanded)) score += 5;
    }

    let colorHit = false;
    for (const c of colors) {
      const reC = new RegExp(`\\b${escapeRe(c)}\\b`);
      if (reC.test(expanded)) {
        colorHit = true;
        score += 2;
        break;
      }
    }
    if (colorHit && hasLineaKeyword) score += 2;

    if (!best || score > best.score) best = { line, score };
  }

  return best && best.score >= 3 ? best.line : null;
}

function digitsOnly(s: string) {
  let out = "";
  for (const ch of s) if (ch >= "0" && ch <= "9") out += ch;
  return out;
}

function extractKeyFromLineName(name: string) {
  const ln = normalize(name);
  if (/\b4a\b/.test(ln) || /\b4 a\b/.test(ln)) return "4a";
  const d = digitsOnly(ln);
  return d || "";
}
