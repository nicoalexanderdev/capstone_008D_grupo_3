from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# comando para levantar app: uv run uvicorn app.main:app --reload --port 8000

app = FastAPI(title="Metrosence API", version="0.1.0")

# Ajusta orígenes permitidos (durante dev puedes dejar "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # en prod especifica dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "Metrosence API up & running 🚀"}

