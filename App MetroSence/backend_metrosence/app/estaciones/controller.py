from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.core import get_db
from ..auth.service import get_current_admin
from . import service
from . import model

router = APIRouter(prefix="/estaciones", tags=["Estaciones"])

@router.get("/", response_model=List[model.Estacion])
def read_estations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    estations = service.get_estations(db, skip=skip, limit=limit)
    return estations

@router.get("/{estacion_id}", response_model=model.Estacion)
def read_estation(estacion_id: int, db: Session = Depends(get_db)):
    db_estacion = service.get_estation_by_id(db, estacion_id=estacion_id)
    if db_estacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    return db_estacion

@router.post("/", response_model=model.Estacion, status_code=status.HTTP_201_CREATED)
def create_estation(estacion: model.EstacionCreate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.create_estation(db=db, estacion=estacion)

@router.put("/{estacion_id}", response_model=model.Estacion)
def update_estation(estacion_id: int, estacion: model.EstacionUpdate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.update_estation(db=db, estacion_id=estacion_id, estacion=estacion)

@router.delete("/{estacion_id}")
def delete_estation(estacion_id: int, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.delete_estation(db=db, estacion_id=estacion_id)

@router.get("/{estacion_id}/detalles", response_model=model.EstacionCompleto)
def read_estacion_con_accesos(estacion_id: int, db: Session = Depends(get_db)):
    db_estacion = service.get_estacion_with_accesos(db, estacion_id=estacion_id)
    if db_estacion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    return db_estacion

