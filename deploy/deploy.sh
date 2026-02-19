#!/bin/bash
# Script de deploy - Casa dos Discípulos
set -e

cd "$(dirname "$0")"

echo "=== Casa dos Discípulos - Deploy ==="

# Verifica se .env existe
if [ ! -f .env ]; then
  echo "Erro: arquivo .env não encontrado."
  echo "Copie .env.example para .env e configure as variáveis:"
  echo "  cp .env.example .env"
  exit 1
fi

# Build e up
echo "Construindo imagens..."
docker-compose build

echo "Iniciando containers..."
docker-compose up -d

echo ""
echo "=== Deploy concluído! ==="
echo "Acesse: http://localhost (ou seu domínio)"
echo ""
echo "WhatsApp: Crie a instância em http://IP:8080 e escaneie o QR Code"
echo "(Se expôs a porta 8080; ou use o Evolution Manager)"
echo ""
echo "Logs: docker-compose logs -f"
