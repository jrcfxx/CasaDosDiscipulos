<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="56" />

# Deploy

**Docker · Nginx · MySQL · Evolution**

[Hospedagem](../Documentacao/HOSPEDAGEM.md)
&nbsp;·&nbsp;
[Custos](../Documentacao/RELATORIO_CUSTOS_E_DEPLOY.md)
&nbsp;·&nbsp;
[Segurança](../Documentacao/SEGURANCA.md)

</div>

---

## Uso

```bash
cp .env.example .env
# DB_PASSWORD · JWT_SECRET (≥32) · EVOLUTION_API_KEY · DOMAIN · CORS_ORIGIN
chmod +x deploy.sh
./deploy.sh
```

HTTPS (após Certbot e arquivos em `nginx/ssl/`):

```bash
./deploy.sh --enable-ssl
```

Smoke: `GET /api/health`

---

## Serviços

| Container | Função |
|-----------|--------|
| `casadiscipulos_web` | Nginx + React (80/443) |
| `casadiscipulos_backend` | API Node |
| `casadiscipulos_mysql` | Banco (rede interna) |
| `casadiscipulos_evolution` | WhatsApp (`127.0.0.1:8080`) |

---

## Arquivos

| Path | Papel |
|------|-------|
| `docker-compose.yml` | Orquestração |
| `nginx/nginx.conf` | HTTP ativo |
| `nginx/nginx-ssl.conf` | Template HTTPS |
| `nginx/nginx-http.conf` | Backup HTTP |
| `.env.example` | Variáveis |

---

<div align="center">

[Documentação](../Documentacao/README.md)

<br />

<sub>Casa dos Discípulos · Deploy · 2026</sub>

</div>
