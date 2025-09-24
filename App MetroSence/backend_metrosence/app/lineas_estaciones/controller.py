# controller.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..estaciones.model import EstacionSimpleResponse as Estacion
from ..lineas.model import LineaBase as Linea
from . import model, service
from app.database.core import get_db
from ..auth.service import get_current_admin

router = APIRouter(prefix="/lineas-estaciones", tags=["Líneas-Estaciones"])

# Agregar una estación a una línea
@router.post("/", response_model=model.EstacionLinea, status_code=status.HTTP_201_CREATED)
def agregar_estacion_a_linea(
    relacion: model.EstacionLineaCreate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):
    return service.agregar_estacion_a_linea(db=db, relacion=relacion)

# Eliminar una estación de una línea
@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_estacion_de_linea(
    relacion: model.EstacionLineaCreate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):
    service.eliminar_estacion_de_linea(db=db, relacion=relacion)
    return None

# Obtener todas las estaciones de una línea
@router.get("/linea/{linea_id}/estaciones", response_model=List[Estacion])
def obtener_estaciones_por_linea(
    linea_id: int,
    skip: int = 0, 
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return service.obtener_estaciones_por_linea(db=db, skip=skip, limit=limit, linea_id=linea_id)

# Obtener todas las líneas de una estación
@router.get("/estacion/{estacion_id}/lineas", response_model=List[Linea])
def obtener_lineas_por_estacion(
    estacion_id: int,
    db: Session = Depends(get_db)
):
    return service.obtener_lineas_por_estacion(db=db, estacion_id=estacion_id)