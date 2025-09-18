from fastapi import FastAPI
from .api import register_routes
from .logging import configure_logging, LogLevels
from fastapi.middleware.cors import CORSMiddleware
from .database.core import engine, Base
from .entities.admin import Admin

# comando para levantar app: uv run -m uvicorn app.main:app --reload

configure_logging(LogLevels.info)

app = FastAPI(
    title="Metrosence API", 
    version="0.1.0", 
    description="API para el sistema de información de Metrosence",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc"
)

app.router.redirect_slashes = False

origins = [
    "http://localhost:8081",  # Para desarrollo 
    "http://127.0.0.1:8081"
]

# Ajusta orígenes permitidos (durante dev puedes dejar "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # en prod especifica dominios
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

""" Only uncomment below to create new tables, 
otherwise the tests will fail if not connected
"""
Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "Metrosence API up & running 🚀"}

register_routes(app, prefix="/api/v1")

