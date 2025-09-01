from sqlalchemy import BigInteger, Column, String
from sqlalchemy.orm import relationship
from ..entities.association import estaciones_lineas
from ..database.core import Base

class Linea(Base):
    __tablename__ = "lineas"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False, unique=True)

    # Relación con estaciones
    estaciones = relationship(
        "Estacion", 
        secondary=estaciones_lineas, 
        back_populates="lineas"
    )

    # Relación con sentidos
    sentidos = relationship("Sentido", back_populates="linea", cascade="all, delete-orphan")

