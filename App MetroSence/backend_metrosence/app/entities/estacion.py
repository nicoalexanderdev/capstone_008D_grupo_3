from sqlalchemy import BigInteger, Column, String, ForeignKey, Integer
from sqlalchemy.orm import relationship
from ..entities.association import estaciones_lineas
from ..database.core import Base

class Estacion(Base):
    __tablename__ = "estacion"

    id_estacion = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    horario_id = Column(Integer, ForeignKey('horario.id_horario', ondelete='CASCADE'), nullable=False)

    # Relación con líneas
    lineas = relationship(
        "Linea", 
        secondary=estaciones_lineas, 
        back_populates="estaciones"
    )

    # Relación con sentidos
    sentidos = relationship("Sentido", back_populates="estacion")

    # Relación con accesos
    accesos = relationship("Acceso", back_populates="estacion", cascade="all, delete-orphan")

    horario = relationship("Horario", back_populates="estaciones")

    # Relación con recorridos al andén
    recorridos = relationship("RecorridoAlAnden", back_populates="estacion", cascade="all, delete-orphan")