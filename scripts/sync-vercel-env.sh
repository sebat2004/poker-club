#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-production}"
ENV_FILE="${2:-website/.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

echo "Syncing Vercel env from $ENV_FILE to $ENVIRONMENT"

cd website

while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "${key:-}" ]] && continue
  [[ "$key" =~ ^# ]] && continue

  # Trim whitespace
  key="$(echo "$key" | xargs)"

  # Skip malformed lines
  [[ -z "$key" ]] && continue

  # Remove optional surrounding quotes
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  echo "Updating $key"

  npx vercel env rm "$key" "$ENVIRONMENT" -y >/dev/null 2>&1 || true
  printf "%s" "$value" | npx vercel env add "$key" "$ENVIRONMENT"
done < "../$ENV_FILE"

echo "Done. Redeploy with:"
echo "cd website && npx vercel --prod"
