#!/usr/bin/env bash
# Deploy — Casa dos Discípulos
# Uso:
#   ./deploy.sh              # build + up + smoke
#   ./deploy.sh --enable-ssl # ativa nginx-ssl.conf (requer certificados em nginx/ssl/)
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
  else
    echo "Erro: Docker Compose não encontrado. Instale o plugin: apt install docker-compose-plugin"
    exit 1
  fi
fi

ENABLE_SSL=0
for arg in "$@"; do
  case "$arg" in
    --enable-ssl) ENABLE_SSL=1 ;;
    -h|--help)
      echo "Uso: $0 [--enable-ssl]"
      exit 0
      ;;
  esac
done

echo "=== Casa dos Discípulos — Deploy ==="

if [ ! -f .env ]; then
  echo "Erro: arquivo .env não encontrado."
  echo "  cp .env.example .env"
  echo "  # edite DB_PASSWORD, JWT_SECRET, EVOLUTION_API_KEY, CORS_ORIGIN"
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
. ./.env
set +a

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ] || [[ "$value" == ALTERE* ]] || [[ "$value" == sua-chave* ]]; then
    echo "Erro: defina $name com um valor seguro em .env (não use o placeholder)."
    exit 1
  fi
}

require_var DB_USER
require_var DB_PASSWORD
require_var DB_NAME
require_var JWT_SECRET
require_var EVOLUTION_API_KEY

if [ "${#JWT_SECRET}" -lt 32 ]; then
  echo "Erro: JWT_SECRET deve ter no mínimo 32 caracteres (gere com: openssl rand -hex 32)."
  exit 1
fi

if [ "$ENABLE_SSL" -eq 1 ]; then
  if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then
    echo "Erro: --enable-ssl requer nginx/ssl/fullchain.pem e nginx/ssl/privkey.pem"
    exit 1
  fi
  if [ -z "${DOMAIN:-}" ]; then
    echo "Erro: defina DOMAIN=app.seudominio.com no .env para ativar SSL."
    exit 1
  fi
  echo "Ativando Nginx HTTPS para ${DOMAIN}..."
  sed "s/SEU_DOMINIO/${DOMAIN}/g" nginx/nginx-ssl.conf > nginx/nginx.conf
fi

mkdir -p nginx/ssl

echo "Construindo imagens..."
$COMPOSE build

echo "Subindo containers..."
$COMPOSE up -d

echo "Aguardando health do backend..."
READY=0
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1/api/health" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 3
done

echo ""
$COMPOSE ps
echo ""

if [ "$READY" -eq 1 ]; then
  echo "Smoke OK: GET /api/health"
  curl -fsS "http://127.0.0.1/api/health" || true
  echo ""
  echo "=== Deploy concluído ==="
  echo "Site:  http://SEU_IP (ou https://${DOMAIN:-seu-dominio} após SSL)"
  echo "WhatsApp (no servidor): ssh -L 8080:127.0.0.1:8080 usuario@SEU_IP"
  echo "           depois abra http://localhost:8080"
  echo "Logs:  $COMPOSE logs -f"
else
  echo "Aviso: /api/health ainda não respondeu. Verifique:"
  echo "  $COMPOSE logs -f backend"
  exit 1
fi
