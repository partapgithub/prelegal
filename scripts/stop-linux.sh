#!/bin/bash
set -e

docker stop prelegal 2>/dev/null || true
docker rm prelegal 2>/dev/null || true
echo "Prelegal stopped."
