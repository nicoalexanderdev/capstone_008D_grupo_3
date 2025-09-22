function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!¡¿?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isGoBack(text: string) {
  const t = normalize(text);
  if (!t) return false;
  if (/\b(atr|atra|atras|atr\u00E1s|atrás)\b/.test(t)) return true;
  if (t.includes("volver atras") || t.includes("volver atrás")) return true;
  if (t.split(" ").includes("volver") || t.split(" ").includes("regresar"))
    return true;
  return false;
}

export function isStartAssistant(text: string) {
  const t = normalize(text);
  if (!t) return false;
  // acepta: iniciar, confirmar, continuar, siguiente, comenzar, asistente, aceptar, ok
  return (
    /\b(iniciar|confirmar|continuar|siguiente|comenzar|aceptar|ok)\b/.test(t) ||
    t.includes("asistente")
  );
}