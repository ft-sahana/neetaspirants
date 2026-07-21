#!/usr/bin/env bash
# Local dev runner for this machine (no Docker available) — starts Qdrant as a
# standalone binary and exports MySQL app credentials for Spring Boot.
# Run mysql (brew services start mysql) yourself beforehand if it isn't already up.
set -euo pipefail
cd "$(dirname "$0")"

source ./.mysql_app_credentials.local
export DB_USER=neetaspirants_app
export DB_PASSWORD="$APP_DB_PASS"

QDRANT__STORAGE__STORAGE_PATH="$(pwd)/qdrant/storage" \
  ./qdrant/bin/qdrant > /tmp/qdrant.log 2>&1 &
echo "qdrant started (pid $!), logs at /tmp/qdrant.log"

sleep 2
echo "DB_USER/DB_PASSWORD exported. Now run in separate terminals:"
echo "  (cd ../apps/embeddings && source .venv/bin/activate && uvicorn main:app --port 8002)"
echo "  (cd ../apps/api && DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD ./mvnw spring-boot:run)"
echo "  (cd ../apps/web && npm run dev)"
