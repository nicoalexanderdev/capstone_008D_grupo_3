# metrosence_flow/schema.py
from pydantic import BaseModel
from typing import List

class Line(BaseModel):
    id: str   # ej: "L1"
    name: str  # ej: "Línea 1"

class Direction(BaseModel):
    name: str  # ej: "San Pablo"

class Station(BaseModel):
    id: str
    name: str  # ej: "La Moneda"

class RouteStartRequest(BaseModel):
    line_id: str
    direction: str
    station_id: str
