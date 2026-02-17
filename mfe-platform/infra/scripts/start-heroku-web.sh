#!/bin/sh
set -eu

PORT_VALUE="${PORT:-8080}"
TARGET_DIR="./services/app-registry/target"

JAR_PATH="$(ls "$TARGET_DIR"/app-registry-*.jar 2>/dev/null | grep -v '\.original$' | head -n 1 || true)"

if [ -z "$JAR_PATH" ]; then
  echo "[start-heroku-web] No Spring Boot jar found in $TARGET_DIR"
  echo "[start-heroku-web] Contents of target directory:"
  ls -la "$TARGET_DIR" || true
  exit 1
fi

echo "[start-heroku-web] Starting $JAR_PATH on port $PORT_VALUE"
exec java -Dserver.port="$PORT_VALUE" -jar "$JAR_PATH"
