from sqlalchemy import BigInteger, Column, String, ForeignKey
from ..database.core import Base

class Acceso(Base):
    __tablename__ = "accesos"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    estacion_id = Column(BigInteger, ForeignKey('estaciones.id', ondelete="CASCADE"), nullable=False)
    letra = Column(String, nullable=False, unique=False)
    direccion = Column(String, nullable=False, unique=False)

