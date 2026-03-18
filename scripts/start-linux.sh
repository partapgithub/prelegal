#!/bin/bash
set -e

# Load OPENROUTER_API_KEY from .env
if [ -f .env ]; then
  OPENROUTER_API_KEY=$(grep -E '^OPENROUTER_API_KEY=' .env | cut -d '=' -f2-)
fi

docker build -t prelegal .
docker rm -f prelegal 2>/dev/null || true
docker run -d -p 8000:8000 --name prelegal \
  -e OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
  prelegal

echo "Prelegal is running at http://localhost:8000"
