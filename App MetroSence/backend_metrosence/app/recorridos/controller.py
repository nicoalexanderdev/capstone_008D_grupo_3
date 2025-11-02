from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import model, service
from app.database.core import get_db
from ..auth.service import get_current_admin

router = APIRouter(prefix="/recorridos", tags=["Recorridos"])

@router.get("/", response_model=List[model.Recorrido])
def read_recorridos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recorridos = service.get_recorridos(db, skip=skip, limit=limit)
    return recorridos

@router.get("/{recorrido_id}", response_model=model.Recorrido)
def read_recorrido(recorrido_id: int, db: Session = Depends(get_db)):
    db_recorrido = service.get_recorrido(db, recorrido_id=recorrido_id)
    if db_recorrido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recorrido no encontrado")
    return db_recorrido

@router.get("/accesos/{acceso_id}/sentidos/{sentido_id}", response_model=model.Recorrido)
def read_recorrido_por_acceso(acceso_id: int, sentido_id: int,  db: Session = Depends(get_db)):
    db_recorrido = service.get_recorrido_por_acceso(db, acceso_id=acceso_id, sentido_id=sentido_id)
    if db_recorrido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recorrido no encontrado")
    return db_recorrido

@router.post("/", response_model=model.Recorrido, status_code=status.HTTP_201_CREATED)
def create_recorrido(
    recorrido: model.RecorridoCreate, 
    db: Session = Depends(get_db), 
    current_admin: str = Depends(get_current_admin)
):
    return service.create_recorrido(db=db, recorrido=recorrido)

@router.put("/{recorrido_id}", response_model=model.Recorrido)
def update_recorrido(
    recorrido_id: int, 
    recorrido: model.RecorridoUpdate, 
    db: Session = Depends(get_db), 
    current_admin: str = Depends(get_current_admin)
):
    db_recorrido = service.update_recorrido(db, recorrido_id=recorrido_id, recorrido=recorrido)
    if db_recorrido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recorrido no encontrado")
    return db_recorrido

@router.delete("/{recorrido_id}", response_model=model.Recorrido)
def delete_recorrido(
    recorrido_id: int, 
    db: Session = Depends(get_db), 
    current_admin: str = Depends(get_current_admin)
):
    db_recorrido = service.delete_recorrido(db, recorrido_id=recorrido_id)
    if db_recorrido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recorrido no encontrado")
    return db_recorrido