# metrosence_flow/core.py
from dataclasses import dataclass, asdict
from typing import Optional, Literal
from .providers import MetroDataProvider
from .schema import RouteStartRequest
import re

FlowState = Literal["CHOOSE_LINE","CHOOSE_DIRECTION","CHOOSE_STATION","REVIEW"]

@dataclass
class Flow:
    state: FlowState = "CHOOSE_LINE"
    line_id: Optional[str] = None
    direction: Optional[str] = None
    station_id: Optional[str] = None


def serialize(flow: Flow): return asdict(flow)


# API-driven actions
async def list_lines(flow: Flow, dp: MetroDataProvider):
    items = await dp.list_lines()
    return {
        "lines": [l.id_linea for l in items],        # para lógica (IDs que usará select_line)
        "names": [l.name for l in items],      # para TTS/UI
        "items": [{"id_linea": l.id_linea, "name": l.name} for l in items],  # por si quieres ambos en un solo array
        "state": flow.state,
    }


async def select_line(flow: Flow, dp: MetroDataProvider, line: str):
    all_lines = await dp.list_lines()
    by_id   = {l.id_linea: l for l in all_lines}
    by_name = {l.name.lower(): l for l in all_lines}

    raw = (line or "").strip()
    cand = by_id.get(raw) or by_name.get(raw.lower())

    if not cand:
        m = re.search(r"(\d+)", raw.lower())  # acepta "L1", "línea 1", "1"
        if m:
            num = m.group(1)
            cand = by_id.get(num) or next((l for l in all_lines if num in l.name), None)

    if not cand:
        raise ValueError(f"Línea inválida: {line}")

    flow.line_id, flow.direction, flow.station_id = cand.id_linea, None, None
    flow.state = "CHOOSE_DIRECTION"

    dirs = await dp.list_directions(flow.line_id)
    return {"selected": flow.line_id, "directions": [d.name for d in dirs], "next_state": flow.state}


async def list_directions(flow: Flow, dp: MetroDataProvider):
    if not flow.line_id: raise ValueError("Primero selecciona una línea.")
    dirs = await dp.list_directions(flow.line_id)
    return {"line": flow.line_id, "directions": [d.name for d in dirs], "state": flow.state}


async def select_direction(flow: Flow, dp: MetroDataProvider, direction: str):
    if not flow.line_id: raise ValueError("Primero selecciona una línea.")
    dirs = [d.name for d in await dp.list_directions(flow.line_id)]
    if direction not in dirs: raise ValueError("Sentido inválido.")
    flow.direction, flow.station_id, flow.state = direction, None, "CHOOSE_STATION"
    return {"selected": direction, "next_state": flow.state}


async def list_stations(flow: Flow, dp: MetroDataProvider):
    if not flow.line_id: raise ValueError("Primero selecciona una línea.")
    st = await dp.list_stations(flow.line_id)
    return {"line": flow.line_id, "stations": [s.name for s in st], "state": flow.state}


# metrosence_flow/core.py
async def select_station(flow: Flow, dp: MetroDataProvider, station_name: str):
    if not flow.line_id:
        raise ValueError("Primero selecciona una línea.")
    stations = await dp.list_stations(flow.line_id)
    by_name = {s.name.lower(): s for s in stations}

    name_norm = (station_name or "").strip().lower()
    chosen = by_name.get(name_norm)

    if not chosen:
        # match tolerante (prefijo/contiene)
        names = [s.name for s in stations]
        s_lower = name_norm
        exact = [n for n in names if n.lower() == s_lower]
        if exact:
            chosen = next(s for s in stations if s.name == exact[0])
        else:
            starts = [n for n in names if n.lower().startswith(s_lower)]
            if len(starts) == 1:
                chosen = next(s for s in stations if s.name == starts[0])
            else:
                contains = [n for n in names if s_lower in n.lower()]
                if len(contains) == 1:
                    chosen = next(s for s in stations if s.name == contains[0])

    if not chosen:
        raise ValueError("Estación inválida.")

    flow.station_id = chosen.id_estacion  
    flow.state = "REVIEW"
    return {"selected": chosen.name, "next_state": flow.state}



async def get_selection_summary(flow: Flow, dp: MetroDataProvider):
    if not (flow.line_id and flow.direction and flow.station_id):
        raise ValueError("Faltan datos.")
    # opcional: traducir station_id→name
    stations = await dp.list_stations(flow.line_id)
    name = next((s.name for s in stations if s.id_estacion == flow.station_id), flow.station_id)
    return {"line": flow.line_id, "direction": flow.direction, "station": name, "next_action": "confirm_start"}


# async def start_navigation(flow: Flow, dp: MetroDataProvider):
#     if not (flow.line_id and flow.direction and flow.station_id):
#         raise ValueError("Faltan datos.")
#     r = await dp.start_navigation(RouteStartRequest(
#         line_id=flow.line_id, direction=flow.direction, station_id=flow.station_id
#     ))
#     return r


def reset_flow(flow: Flow):
    flow.state, flow.line_id, flow.direction, flow.station_id = "CHOOSE_LINE", None, None, None
    return {"ok": True}
