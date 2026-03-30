#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="$SCRIPT_DIR/.env.vercel"
ENVIRONMENT="${1:-production}"

vercel env pull "$OUTPUT_FILE" --environment="$ENVIRONMENT"

echo
echo "Pulled Vercel $ENVIRONMENT env into $OUTPUT_FILE"
echo "Docker Compose will use it automatically when the file is present."
