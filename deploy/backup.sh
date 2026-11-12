#!/usr/bin/env bash
# Backup — Casa dos Discípulos
# Salva o banco (todas as bases: app + evolution) e os arquivos enviados (uploads).
#
# Uso manual:   ./backup.sh
# Agendamento:  ./backup.sh --instalar-cron   (todo dia às 03:00, horário do servidor)
# Restaurar:    ver deploy/README.md, seção "Backup e restauração"
#
# ATENÇÃO: os arquivos ficam no próprio servidor. Para proteger contra perda do servidor,
# ative também os Backups do droplet na DigitalOcean ou copie BACKUP_DIR para outro lugar.
set -euo pipefail

cd "$(dirname "$0")"
DEPLOY_DIR="$(pwd)"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/casadosdiscipulos}"
RETENCAO_DIAS="${RETENCAO_DIAS:-14}"

if [ "${1:-}" = "--instalar-cron" ]; then
  linha="0 3 * * * cd $DEPLOY_DIR && ./backup.sh >> /var/log/casadiscipulos-backup.log 2>&1"
  ( crontab -l 2>/dev/null | grep -v "casadiscipulos-backup" ; echo "$linha" ) | crontab -
  echo "Backup diário agendado (03:00). Log: /var/log/casadiscipulos-backup.log"
  exit 0
fi

set -a
# shellcheck source=/dev/null
. ./.env
set +a

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
DATA="$(date +%Y-%m-%d_%H%M)"

echo "[$(date '+%F %T')] Iniciando backup..."

# Banco: dump consistente sem travar as tabelas (InnoDB)
docker compose exec -T -e MYSQL_PWD="$DB_PASSWORD" mysql \
  mysqldump -uroot --single-transaction --routines --triggers --all-databases \
  | gzip > "$BACKUP_DIR/banco_$DATA.sql.gz.tmp"
mv "$BACKUP_DIR/banco_$DATA.sql.gz.tmp" "$BACKUP_DIR/banco_$DATA.sql.gz"

# Uploads (fotos de perfil, eventos, Fala Aí, campos)
docker compose exec -T backend tar -C /app -czf - uploads > "$BACKUP_DIR/uploads_$DATA.tar.gz.tmp"
mv "$BACKUP_DIR/uploads_$DATA.tar.gz.tmp" "$BACKUP_DIR/uploads_$DATA.tar.gz"

# Retenção
find "$BACKUP_DIR" -name "banco_*.sql.gz" -mtime +"$RETENCAO_DIAS" -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +"$RETENCAO_DIAS" -delete
find "$BACKUP_DIR" -name "*.tmp" -mtime +1 -delete

TAM_BANCO=$(du -h "$BACKUP_DIR/banco_$DATA.sql.gz" | cut -f1)
TAM_UPLOADS=$(du -h "$BACKUP_DIR/uploads_$DATA.tar.gz" | cut -f1)
echo "[$(date '+%F %T')] OK: banco $TAM_BANCO, uploads $TAM_UPLOADS em $BACKUP_DIR (mantém $RETENCAO_DIAS dias)"
