from sqlalchemy import BigInteger, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database.core import Base

class Acceso(Base):
    __tablename__ = "acceso"

    id_acceso = Column(BigInteger, primary_key=True, autoincrement=True)
    estacion_id = Column(BigInteger, ForeignKey('estacion.id_estacion', ondelete="CASCADE"), nullable=False)
    letra = Column(String, nullable=False, unique=False)
    direccion = Column(String, nullable=False, unique=False)

    # Relación con estación
    estacion = relationship("Estacion", back_populates="accesos")

    # Relación con recorridos al andén
    recorridos = relationship("RecorridoAlAnden", back_populates="acceso", cascade="all, delete-orphan")

