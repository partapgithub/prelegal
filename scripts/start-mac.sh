#!/bin/bash
set -e

docker build -t prelegal .
docker rm -f prelegal 2>/dev/null || true
docker run -d -p 8000:8000 --name prelegal prelegal

echo "Prelegal is running at http://localhost:8000"
