FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=2

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates git libstdc++6 ffmpeg libgl1 \
  && rm -rf /var/lib/apt/lists/*

# Instalar uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /app

# Copia de manifiestos (para caching). Si tu pyproject referencia README.md, cópialo también.
COPY pyproject.toml ./
COPY README.md ./

# 👉 Instalar deps al sistema usando uv pip (no uv sync)
RUN --mount=type=cache,target=/root/.cache \
    uv pip install --system .

# Copiar el resto del código (incluye main.py)
COPY . .

# Ejecutar tu script run-and-exit
CMD ["python", "main.py"]
