from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import model, service
from app.database.core import get_db
from ..auth.service import get_current_admin

router = APIRouter(prefix="/sentidos", tags=["sentidos"])

@router.get("/", response_model=List[model.Sentido])
def read_sentidos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sentidos = service.get_sentidos(db, skip=skip, limit=limit)
    return sentidos

@router.get("/{sentido_id}", response_model=model.SentidoWithRelations)
def read_sentido(sentido_id: int, db: Session = Depends(get_db)):
    db_sentido = service.get_sentido(db, sentido_id=sentido_id)
    if db_sentido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sentido no encontrado")
    return db_sentido

@router.get("/linea/{linea_id}", response_model=List[model.SentidoPorLinea])
def read_sentidos_por_linea(linea_id: int, db: Session = Depends(get_db)):
    sentidos = service.get_sentidos_por_linea(db, linea_id=linea_id)
    return sentidos

@router.post("/", response_model=model.Sentido, status_code=status.HTTP_201_CREATED)
def create_sentido(sentido: model.SentidoCreate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.create_sentido(db=db, sentido=sentido)

@router.put("/{sentido_id}", response_model=model.Sentido)
def update_sentido(sentido_id: int, sentido: model.SentidoUpdate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    db_sentido = service.update_sentido(db, sentido_id=sentido_id, sentido=sentido)
    if db_sentido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sentido no encontrado")
    return db_sentido

@router.delete("/{sentido_id}", response_model=model.Sentido)
def delete_sentido(sentido_id: int, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    db_sentido = service.delete_sentido(db, sentido_id=sentido_id)
    if db_sentido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sentido no encontrado")
    return db_sentido