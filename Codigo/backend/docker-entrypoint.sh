#!/bin/sh
set -e

echo "[backend] Aguardando MySQL e aplicando migrations..."

MAX_ATTEMPTS=30
ATTEMPT=1
until npx knex migrate:latest --knexfile knexfile.cjs; do
  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo "[backend] ERRO: migrations falharam após ${MAX_ATTEMPTS} tentativas."
    exit 1
  fi
  echo "[backend] Migration ainda não disponível (tentativa ${ATTEMPT}/${MAX_ATTEMPTS}). Nova tentativa em 3s..."
  ATTEMPT=$((ATTEMPT + 1))
  sleep 3
done

echo "[backend] Migrations OK. Iniciando API..."
exec node src/app.js
