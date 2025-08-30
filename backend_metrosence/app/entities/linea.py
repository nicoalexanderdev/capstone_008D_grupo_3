from sqlalchemy import BigInteger, Column, String
from ..database.core import Base

class Linea(Base):
    __tablename__ = "lineas"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False, unique=True)

