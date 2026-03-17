# Stage 1: Build the Next.js frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build


# Stage 2: Python runtime
FROM python:3.12-slim AS runtime

WORKDIR /app/backend

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Resolve and install dependencies declared in pyproject.toml
COPY backend/pyproject.toml ./
RUN uv pip compile pyproject.toml -o /tmp/requirements.txt && \
    uv pip install --system -r /tmp/requirements.txt

COPY backend/app/ ./app/
COPY catalog.json ./catalog.json
COPY --from=frontend-builder /app/frontend/out ./static/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
