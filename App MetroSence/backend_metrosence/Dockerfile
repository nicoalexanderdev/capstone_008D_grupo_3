# Usar una imagen base de Python
FROM python:3.12-slim

# Establecer variables de entorno
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Instalar uv directamente (más eficiente que pip)
RUN pip install --no-cache-dir uv

# Definir directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar solo archivos de dependencias primero (aprovecha caching de Docker)
COPY pyproject.toml .

# Instalar dependencias con uv (sin necesidad de venv en contenedores)
RUN uv pip install --system -e .

# Copiar el código de la app
COPY . .

# Exponer el puerto
EXPOSE 8000

# Comando para ejecutar la aplicación
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]