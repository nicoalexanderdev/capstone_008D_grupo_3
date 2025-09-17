// app/hooks/useVoiceAgent.ts
import { useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import Voice from "@react-native-voice/voice";

type State = "CHOOSE_LINE"|"CHOOSE_DIRECTION"|"CHOOSE_STATION"|"REVIEW";
const BASE = process.env.EXPO_PUBLIC_AGENT_BASE ?? "http://127.0.0.1:8787"; // <-- pon tu IP
const SESSION = "mobile-demo";

async function getJSON(path: string, opts?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, { headers: { "Content-Type":"application/json" }, ...opts });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function useVoiceAgent() {
  const [state, setState] = useState<State>("CHOOSE_LINE");
  const [lines, setLines] = useState<string[]>([]);
  const [directions, setDirections] = useState<string[]>([]);
  const [stations, setStations] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const listeningRef = useRef(false);

  const speak = (t: string) => Speech.speak(t, { language: "es-CL", rate: 1.0 });

  const startListening = async (onText: (t: string)=>void) => {
    if (listeningRef.current) return;
    listeningRef.current = true;
    Voice.onSpeechResults = (e: any) => {
      const best = e.value?.[0];
      if (best) onText(best);
    };
    Voice.onSpeechEnd = () => { listeningRef.current = false; };
    await Voice.start("es-CL");
  };

  const stopListening = async () => {
    if (!listeningRef.current) return;
    listeningRef.current = false;
    try { await Voice.stop(); } catch {}
  };

  // Paso 1: líneas
  const askLines = async () => {
    const res = await getJSON(`/mcp/${SESSION}/lines`);
    const names: string[] = res.names ?? [];
    setLines(res.lines ?? []);
    setState("CHOOSE_LINE");
    speak(`Hola, ¿dónde vamos hoy? Líneas disponibles: ${names.join(", ")}.`);
  };

  const pickLine = async (utter: string) => {
    await getJSON(`/mcp/${SESSION}/line`, {
      method: "POST",
      body: JSON.stringify({ line: utter }),
    });
    const dirs = await getJSON(`/mcp/${SESSION}/directions`);
    setDirections(dirs.directions ?? []);
    setState("CHOOSE_DIRECTION");
    speak(`Para la línea seleccionada, sentidos: ${dirs.directions.join(" o ")}. ¿Cuál eliges?`);
  };

  const pickDirection = async (utter: string) => {
    await getJSON(`/mcp/${SESSION}/direction`, {
      method: "POST",
      body: JSON.stringify({ direction: utter }),
    });
    const st = await getJSON(`/mcp/${SESSION}/stations`);
    setStations(st.stations ?? []);
    setState("CHOOSE_STATION");
    speak(`Te diré estaciones en bloques. Por favor di el nombre cuando la escuches. Primeras: ${stations.slice(0,10).join(", ")}.`);
  };

  const pickStation = async (utter: string) => {
    await getJSON(`/mcp/${SESSION}/station`, {
      method: "POST",
      body: JSON.stringify({ station: utter }),
    });
    const s = await getJSON(`/mcp/${SESSION}/summary`);
    setSummary(s);
    setState("REVIEW");
    speak(`Vas por línea ${s.line}, sentido ${s.direction}, desde ${s.station}. ¿Confirmas? Di sí o no.`);
  };

  const confirm = async (utter: string) => {
    const yes = /\b(s[ií]|sí|si|ok|dale|correcto)\b/i.test(utter);
    if (yes) {
      const r = await getJSON(`/mcp/${SESSION}/start`, { method: "POST" });
      speak(r.message ?? "Selección confirmada.");
    } else {
      await getJSON(`/mcp/${SESSION}/reset`, { method: "POST" });
      speak("Flujo reiniciado.");
      await askLines();
    }
  };

  // API pública del hook
  return {
    state, lines, directions, stations, summary,
    speak, startListening, stopListening,
    askLines, pickLine, pickDirection, pickStation, confirm,
  };
}
