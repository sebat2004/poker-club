#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-production}"

echo "Reading Terraform outputs..."

NEKO_URL="$(cd infra && AWS_PROFILE=poker-terraform terraform output -raw neko_rooms_public_url)"
INSTANCE_ID="$(cd infra && AWS_PROFILE=poker-terraform terraform output -raw neko_instance_id)"

echo "Terraform Neko URL: $NEKO_URL"
echo "Terraform instance ID: $INSTANCE_ID"
echo "Updating Vercel environment: $ENVIRONMENT"

set +e
npm --prefix website exec vercel -- env rm NEKO_ROOMS_PUBLIC_URL "$ENVIRONMENT" -y
npm --prefix website exec vercel -- env rm NEKO_INSTANCE_ID "$ENVIRONMENT" -y
set -e

printf "%s" "$NEKO_URL" | npm --prefix website exec vercel -- env add NEKO_ROOMS_PUBLIC_URL "$ENVIRONMENT"
printf "%s" "$INSTANCE_ID" | npm --prefix website exec vercel -- env add NEKO_INSTANCE_ID "$ENVIRONMENT"

echo "Done. Redeploy Vercel to apply the new env vars:"
echo "cd website && npx vercel --prod"