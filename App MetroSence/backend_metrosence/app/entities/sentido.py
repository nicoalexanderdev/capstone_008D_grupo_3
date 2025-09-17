from ..database.core import Base
from sqlalchemy.orm import relationship
from sqlalchemy import BigInteger, Column, ForeignKey

class Sentido(Base):
    __tablename__ = "sentido"

    id_sentido = Column(BigInteger, primary_key=True, autoincrement=True)
    linea_id = Column(BigInteger, ForeignKey('linea.id_linea', ondelete='CASCADE'), nullable=False)
    estacion_id = Column(BigInteger, ForeignKey('estacion.id_estacion', ondelete='CASCADE'), nullable=False)

    # Relaciones
    linea = relationship("Linea", back_populates="sentidos")
    estacion = relationship("Estacion", back_populates="sentidos")

    # Relación con recorridos al andén
    recorridos = relationship("RecorridoAlAnden", back_populates="sentido", cascade="all, delete-orphan")