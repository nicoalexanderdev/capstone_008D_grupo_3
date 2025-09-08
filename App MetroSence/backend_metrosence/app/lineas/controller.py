from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.core import get_db
from . import service
from . import model
from ..auth.service import get_current_admin

router = APIRouter(prefix="/lines", tags=["lines"])

@router.get("/", response_model=List[model.Linea])
def read_lines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    lines = service.get_lines(db, skip=skip, limit=limit)
    return lines

@router.get("/{linea_id}", response_model=model.Linea)
def read_line(linea_id: int, db: Session = Depends(get_db)):
    db_linea = service.get_line_by_id(db, linea_id=linea_id)
    if db_linea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    return db_linea

@router.post("/", response_model=model.Linea, status_code=status.HTTP_201_CREATED)
def create_line(linea: model.LineaCreate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.create_line(db=db, linea=linea)

@router.put("/{linea_id}", response_model=model.Linea)
def update_line(linea_id: int, linea: model.LineaUpdate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.update_line(db=db, linea_id=linea_id, linea=linea)

@router.delete("/{linea_id}")
def delete_line(linea_id: int, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.delete_line(db=db, linea_id=linea_id)