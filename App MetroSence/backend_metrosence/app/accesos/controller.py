from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import model, service
from app.database.core import get_db
from ..auth.service import get_current_admin

router = APIRouter(prefix="/accesos", tags=["Accesos"])

@router.get("/", response_model=List[model.Acceso])
def read_accesos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    accesos = service.get_accesos(db, skip=skip, limit=limit)
    return accesos


@router.get("/{acceso_id}", response_model=model.Acceso)
def read_acceso(acceso_id: int, db: Session = Depends(get_db)):
    db_acceso = service.get_acceso(db, acceso_id=acceso_id)
    if db_acceso is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
    return db_acceso

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