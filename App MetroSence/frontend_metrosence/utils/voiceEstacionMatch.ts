export type EstacionType = {
  id_estacion: number;
  name: string;
};

// ===== Helpers de voz: normalización, comando atrás y match de estación =====
const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!¡¿?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function isGoBack(text: string) {
  const t = normalize(text);
  if (!t) return false;
  if (/\b(atr|atra|atras|atrás)\b/.test(t)) return true; // "atrás"
  if (t.includes("volver atras") || t.includes("volver atrás")) return true;
  if (t.split(" ").includes("volver") || t.split(" ").includes("regresar"))
    return true;
  return false;
}

export function matchStationFromUtterance(
  utterance: string,
  data: EstacionType[]
): EstacionType | null {
  if (!utterance || !data?.length) return null;
  const u = normalize(utterance);

  // 1) Inclusión del nombre completo
  for (const st of data) {
    const name = normalize(st.name);
    if (name && u.includes(name)) return st;
  }

  // 2) "hacia <estación>" / última palabra distintiva
  for (const st of data) {
    const name = normalize(st.name);
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      if (last.length >= 4 && u.split(" ").includes(last)) return st;
    }
    if (u.includes("hacia " + name)) return st;
  }

  // 3) Overlap de tokens (>=2 palabras en común)
  const uTokens = new Set(u.split(" ").filter(Boolean));
  let best: { st: EstacionType; overlap: number } | null = null;
  for (const st of data) {
    const name = normalize(st.name);
    const tokens = new Set(name.split(" ").filter(Boolean));
    let ov = 0;
    tokens.forEach((tok) => {
      if (uTokens.has(tok)) ov += 1;
    });
    if (!best || ov > best.overlap) best = { st, overlap: ov };
  }
  if (best && best.overlap >= 2) return best.st;

  return null;
}
