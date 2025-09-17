# metrosence_flow/providers.py
import os, time
import httpx
from typing import List, Protocol, Optional
from cachetools import TTLCache
from .schema import Line, Direction, Station, RouteStartRequest

class MetroDataProvider(Protocol):
    async def list_lines(self) -> List[Line]: ...
    async def list_directions(self, line_id: str) -> List[Direction]: ...
    async def list_stations(self, line_id: str) -> List[Station]: ...
    # async def start_navigation(self, req: RouteStartRequest) -> dict: ...

class HttpMetroProvider:
    """Habla con tu FastAPI. Usa TTL cache para evitar golpear siempre."""
    def __init__(self, base_url: str, api_key: Optional[str] = None, timeout=8.0):
        self.base = base_url.rstrip("/")
        self.api_key = api_key
        self.client = httpx.AsyncClient(base_url=self.base, timeout=timeout, http2=True)
        # caches
        self.c_lines = TTLCache(maxsize=1, ttl=300)         # 5 min
        self.c_dirs  = TTLCache(maxsize=64, ttl=300)        # por línea
        self.c_stz   = TTLCache(maxsize=64, ttl=300)        # por línea


    async def list_lines(self) -> List[Line]:
        # cache de 5 min
        if "lines" in self.c_lines:
            return self.c_lines["lines"]

        r = await self.client.get("/api/v1/lineas/")
        r.raise_for_status()
        data = r.json()

        lines: List[Line] = []

        if isinstance(data, list):
            for item in data:
                _id_linea = str(item.get("id_linea"))
                _name = str(item.get("name") or _id_linea)
                lines.append(Line(id_linea=_id_linea, name=_name))
        else:
            raise RuntimeError(f"Formato inesperado en /api/v1/lineas/: {type(data)}")

        self.c_lines["lines"] = lines
        return lines


    async def list_directions(self, line_id: str) -> List[Direction]:
        key = f"dir:{line_id}"
        if key in self.c_dirs:
            return self.c_dirs[key]
        r = await self.client.get(f"api/v1/sentidos/linea/{line_id}")
        r.raise_for_status()
        data = r.json()

        names: List[str] = []
        if isinstance(data, list):
            for item in data:
                if not isinstance(item, dict):
                    continue
                est = item.get("estacion") or {}
                name = est.get("name") or item.get("name")
                if isinstance(name, str):
                    if name not in names:
                        names.append(name)
        else:
            raise RuntimeError(f"Formato inesperado en /api/v1/sentidos/linea/{line_id}: {type(data)}")

        # Mapeamos a nuestro modelo
        return [Direction(name=n) for n in names]


    async def list_stations(self, line_id: str) -> List[Station]:
        r = await self.client.get(f'api/v1/lineas-estaciones/linea/{line_id}/estaciones')
        r.raise_for_status()
        data = r.json()

        stations: List[Station] = []

        if isinstance(data, list):
            # Tu API devuelve: [{ "name": "San Pablo", "id": 1 }, ...]
            for item in data:
                if not isinstance(item, dict):
                    s = str(item)
                    stations.append(Station(id_estacion=s, name=s))
                    continue
                sid = str(item.get("id_estacion"))
                name = str(item.get("name") or item.get("nombre") or sid)
                stations.append(Station(id_estacion=sid, name=name))

        else:
            raise RuntimeError(f"Formato inesperado en: {type(data)}")

        # Opcional: deduplicar preservando orden
        seen = set()
        unique: List[Station] = []
        for s in stations:
            if s.id_estacion not in seen:
                seen.add(s.id_estacion)
                unique.append(s)
        return unique

    # async def start_navigation(self, req: RouteStartRequest) -> dict:
    #     r = await self.client.post("/routes/start", headers=self._headers(), json=req.model_dump())
    #     r.raise_for_status()
    #     return r.json()

class InMemoryProvider:
    """Para tests/demo sin API."""
    def __init__(self):
        from collections import defaultdict
        self._lines = [Line(id="L1", name="Línea 1"), Line(id="L2", name="Línea 2")]
        self._dirs  = {"L1":[Direction(name="San Pablo"), Direction(name="Los Dominicos")]}
        self._stz   = {"L1":[Station(id="L1-UM", name="La Moneda"), Station(id="L1-LH", name="Los Héroes")]}

    async def list_lines(self) -> List[Line]: return self._lines
    async def list_directions(self, line_id: str) -> List[Direction]: return self._dirs[line_id]
    async def list_stations(self, line_id: str) -> List[Station]: return self._stz[line_id]
    async def start_navigation(self, req: RouteStartRequest) -> dict:
        return {"ok": True, "message": f"Iniciando navegación: {req.line_id} → {req.direction}, desde {req.station_id}."}

def provider_from_env() -> MetroDataProvider:
    base = os.getenv("METROSENCE_API_BASE", "http://localhost:8000")
    key  = os.getenv("METROSENCE_API_KEY")
    return HttpMetroProvider(base_url=base, api_key=key)
