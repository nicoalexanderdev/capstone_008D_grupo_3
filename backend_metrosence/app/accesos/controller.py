from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import model, service
from app.database.core import get_db
from ..auth.service import get_current_admin

router = APIRouter(prefix="/accesos", tags=["accesos"])

@router.get("/", response_model=List[model.Acceso])
def read_accesos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    accesos = service.get_accesos(db, skip=skip, limit=limit)
    return accesos

@router.get("/con-estacion", response_model=List[model.AccesoWithEstacion])
def read_accesos_with_estacion(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    accesos = service.get_accesos_with_estacion(db, skip=skip, limit=limit)
    result = []
    for acceso in accesos:
        acceso_dict = {
            "id": acceso.id,
            "estacion_id": acceso.estacion_id,
            "letra": acceso.letra,
            "direccion": acceso.direccion,
            "estacion_nombre": acceso.estacion.name if acceso.estacion else None
        }
        result.append(acceso_dict)
    return result

@router.get("/{acceso_id}", response_model=model.Acceso)
def read_acceso(acceso_id: int, db: Session = Depends(get_db)):
    db_acceso = service.get_acceso(db, acceso_id=acceso_id)
    if db_acceso is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
    return db_acceso

@router.get("/{acceso_id}/con-estacion", response_model=model.AccesoWithEstacion)
def read_acceso_with_estacion(acceso_id: int, db: Session = Depends(get_db)):
    db_acceso = service.get_acceso_with_estacion(db, acceso_id=acceso_id)
    if db_acceso is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
    
    return {
        "id": db_acceso.id,
        "estacion_id": db_acceso.estacion_id,
        "letra": db_acceso.letra,
        "direccion": db_acceso.direccion,
        "estacion_nombre": db_acceso.estacion.name if db_acceso.estacion else None
    }

@router.get("/estacion/{estacion_id}", response_model=List[model.Acceso])
def read_accesos_por_estacion(estacion_id: int, db: Session = Depends(get_db)):
    accesos = service.get_accesos_por_estacion(db, estacion_id=estacion_id)
    return accesos

@router.post("/", response_model=model.Acceso, status_code=status.HTTP_201_CREATED)
def create_acceso(acceso: model.AccesoCreate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.create_acceso(db=db, acceso=acceso)

@router.put("/{acceso_id}", response_model=model.Acceso)
def update_acceso(acceso_id: int, acceso: model.AccesoUpdate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    db_acceso = service.update_acceso(db, acceso_id=acceso_id, acceso=acceso)
    if db_acceso is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
    return db_acceso

@router.delete("/{acceso_id}", response_model=model.Acceso)
def delete_acceso(acceso_id: int, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    db_acceso = service.delete_acceso(db, acceso_id=acceso_id)
    if db_acceso is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
    return db_acceso