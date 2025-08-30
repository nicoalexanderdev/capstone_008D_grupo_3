from sqlalchemy import BigInteger, Column, String
from ..database.core import Base

class Estacion(Base):
    __tablename__ = "estaciones"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)