from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import model, service
from app.database.core import get_db
from ..auth.service import get_current_admin

router = APIRouter(prefix="/recorridos", tags=["recorridos"])

@router.get("/", response_model=List[model.Recorrido])
def read_recorridos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recorridos = service.get_recorridos(db, skip=skip, limit=limit)
    return recorridos

@router.get("/con-relaciones", response_model=List[model.RecorridoConRelaciones])
def read_recorridos_con_relaciones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recorridos = service.get_recorridos_con_relaciones(db, skip=skip, limit=limit)
    result = []
    for recorrido in recorridos:
        result.append({
            "id": recorrido.id,
            "estacion_id": recorrido.estacion_id,
            "acceso_id": recorrido.acceso_id,
            "direccion_id": recorrido.direccion_id,
            "instrucciones": recorrido.instrucciones,
            "estacion_nombre": recorrido.estacion.name if recorrido.estacion else None,
            "acceso_letra": recorrido.acceso.letra if recorrido.acceso else None,
            "direccion_nombre": recorrido.direccion.nombre if recorrido.direccion else None
        })
    return result

@router.get("/{recorrido_id}", response_model=model.Recorrido)
def read_recorrido(recorrido_id: int, db: Session = Depends(get_db)):
    db_recorrido = service.get_recorrido(db, recorrido_id=recorrido_id)
    if db_recorrido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recorrido no encontrado")
    return db_recorrido

@router.post("/instrucciones", response_model=model.Recorrido)
def obtener_instrucciones_recorrido(
    solicitud: model.SolicitudInstrucciones, 
    db: Session = Depends(get_db)
):
    return service.obtener_instrucciones(db, solicitud=solicitud)

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