#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Starting frontend apps..."
(cd "$REPO_ROOT" && npm run dev) &

echo "Starting app-registry..."
(cd "$REPO_ROOT/services/app-registry" && mvn spring-boot:run) &

wait
