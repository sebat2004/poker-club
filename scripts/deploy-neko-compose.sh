#!/usr/bin/env bash
set -euo pipefail

HOST="${NEKO_SSH_HOST:-ubuntu@$(cd infra && AWS_PROFILE=poker-terraform terraform output -raw neko_public_ip)}"
REMOTE_TMP="/tmp/docker-compose.yml"
REMOTE_DEST="/opt/neko-rooms/docker-compose.yml"

echo "Using host: $HOST"
echo "Uploading docker-compose.yml..."

scp neko-rooms-club/docker-compose.yml "$HOST:$REMOTE_TMP"

echo "Applying compose file on EC2..."

ssh "$HOST" "
  set -euo pipefail

  sudo mv $REMOTE_TMP $REMOTE_DEST

  cd /opt/neko-rooms

  sudo docker compose down --remove-orphans || true
  sudo docker rm -f neko-rooms-neko-rooms-1 2>/dev/null || true
  sudo docker pull m1k1o/neko-rooms:latest || true
  sudo docker pull ghcr.io/m1k1o/neko/firefox:latest || true
  sudo docker pull sebat2004/neko-firefox-xprintidle:latest || true
  sudo docker compose up -d --force-recreate

  sudo docker inspect neko-rooms-neko-rooms-1 \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | sort \
    | grep -E 'NEKO_ROOMS_INSTANCE_NETWORK|NEKO_ROOMS_NEKO_IMAGES|NEKO_ROOMS_INSTANCE_URL|NEKO_ROOMS_NAT1TO1' || true

  sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
"

echo "Done."