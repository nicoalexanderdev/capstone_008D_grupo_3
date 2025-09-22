export type SentidoType = {
  id_sentido: number;
  linea_id: number | string;
  estacion: { name: string };
};

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
  // acepta: "atras", "atrás", "volver atras", "volver atrás", "volver", "regresar"
  if (/\b(atr|atrás|atras)\b/.test(t)) return true;
  if (t.includes("volver atras") || t.includes("volver atras.")) return true;
  if (t.split(" ").includes("volver") || t.split(" ").includes("regresar"))
    return true;
  return false;
}

export function matchSentidoFromUtterance(
  utterance: string,
  data: SentidoType[]
): SentidoType | null {
  if (!utterance || !data?.length) return null;
  const u = normalize(utterance);

  // Strategy 1: full name inclusion
  for (const s of data) {
    const station = normalize(s?.estacion?.name || "");
    if (!station) continue;
    if (u.includes(station)) return s;
  }

  // Strategy 2: "hacia <estacion>" (redundant if we already check inclusion, but kept for clarity)
  for (const s of data) {
    const station = normalize(s?.estacion?.name || "");
    if (!station) continue;
    if (u.includes("hacia " + station)) return s;
  }

  // Strategy 3: last token of the terminal station (when distinctive)
  for (const s of data) {
    const station = normalize(s?.estacion?.name || "");
    const parts = station.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      if (last.length >= 4 && u.split(" ").includes(last)) return s;
    }
  }

  // Strategy 4: token overlap (>=2 tokens in common)
  const uTokens = new Set(u.split(" ").filter(Boolean));
  let best: { s: SentidoType; overlap: number } | null = null;
  for (const s of data) {
    const station = normalize(s?.estacion?.name || "");
    if (!station) continue;
    const tokens = new Set(station.split(" ").filter(Boolean));
    let ov = 0;
    tokens.forEach((tok) => {
      if (uTokens.has(tok)) ov += 1;
    });
    if (!best || ov > best.overlap) best = { s, overlap: ov };
  }
  if (best && best.overlap >= 2) return best.s;
  return null;
}
