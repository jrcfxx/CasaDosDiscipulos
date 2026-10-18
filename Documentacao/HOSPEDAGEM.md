<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Hospedagem

**Do zero ao ar — VPS, domínio, Docker, HTTPS e WhatsApp**

[Índice](./README.md)
&nbsp;·&nbsp;
[Custos](./RELATORIO_CUSTOS_E_DEPLOY.md)
&nbsp;·&nbsp;
[Segurança](./SEGURANCA.md)

</div>

---

## Arquitetura em produção

```
        Usuário
           │
           ▼
   ┌───────────────┐
   │  Nginx 80/443 │  React + proxy /api · /uploads
   └───────┬───────┘
           │
     ┌─────┴─────┐
     ▼           ▼
  Backend      MySQL
     │
     ▼
 Evolution (WhatsApp · só localhost:8080)
```

Código: pasta [`deploy/`](../deploy/) · script [`deploy.sh`](../deploy/deploy.sh)

---

## Checklist antes de começar

| Item | Onde |
|------|------|
| Cartão / conta VPS | DigitalOcean ou Hetzner |
| Domínio | Painel de `casadosdiscipulos.org` ou Registro.br |
| Chave SSH | Seu computador |
| WhatsApp da igreja | Celular para o QR |

Orçamento e porquês: [Relatório de custos](./RELATORIO_CUSTOS_E_DEPLOY.md).

---

## Do zero em 5 passos

### 1 · Domínio

O **domínio** é o nome público (ex.: `app.casadosdiscipulos.org`).  
Você compra/renova num registrador; no **DNS** aponta para o IP do servidor.

| Onde | Quando |
|------|--------|
| Painel atual de `casadosdiscipulos.org` | Preferível — só criar subdomínio `app` |
| [Registro.br](https://registro.br) | Novo `.com.br` / `.org.br` |
| [Cloudflare](https://www.cloudflare.com) | DNS / CDN |

Confirme com a diretoria quem administra o domínio antes de comprar outro.

### 2 · VPS

**Padrão:** DigitalOcean Droplet · Ubuntu 22.04 · **2 GB RAM** · São Paulo se disponível.  
**Alternativa:** Hetzner CX22.

```bash
ssh root@SEU_IP
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin curl -y
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```

### 3 · DNS

| Tipo | Nome | Valor |
|------|------|--------|
| A | `app` | IP do Droplet |

### 4 · Aplicação

```bash
cd /opt
git clone https://github.com/jrcfxx/CasaDosDiscipulos.git
cd CasaDosDiscipulos/deploy
cp .env.example .env
nano .env   # DB_PASSWORD, JWT_SECRET, EVOLUTION_API_KEY, DOMAIN, CORS_ORIGIN
chmod +x deploy.sh
./deploy.sh
```

Primeira vez (dados iniciais):

```bash
docker compose exec backend node ./src/seeds/runSeeds.js
```

### 5 · HTTPS + WhatsApp

```bash
docker compose stop web
apt install certbot -y
certbot certonly --standalone -d app.seudominio.org
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/app.seudominio.org/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/app.seudominio.org/privkey.pem nginx/ssl/
# .env → CORS_ORIGIN=https://app.seudominio.org
./deploy.sh --enable-ssl
```

WhatsApp (porta só em localhost):

```bash
ssh -L 8080:127.0.0.1:8080 root@SEU_IP
# abra http://localhost:8080 · crie a instância · escaneie o QR
```

---

## Arquivos-chave

| Arquivo | Função |
|---------|--------|
| `deploy/docker-compose.yml` | web · backend · mysql · evolution |
| `deploy/.env.example` | Modelo de variáveis |
| `deploy/deploy.sh` | Build, up, smoke `/api/health` |
| `deploy/nginx/nginx.conf` | HTTP |
| `deploy/nginx/nginx-ssl.conf` | Template HTTPS |

---

## Dia a dia

| Comando | Uso |
|---------|-----|
| `./deploy.sh` | Atualizar / subir |
| `docker compose logs -f backend` | Logs da API |
| `docker compose ps` | Status |
| `curl -s http://127.0.0.1/api/health` | Saúde |

```bash
cd /opt/CasaDosDiscipulos && git pull && cd deploy && ./deploy.sh
```

---

## Backup

```bash
docker compose exec -T mysql mysqldump -u casadiscipulos -p CasaDosDiscipulos > backup.sql
```

Guarde também o volume de uploads (`backend_uploads`).

---

## Problemas

| Sintoma | Ação |
|---------|------|
| Site offline | `docker compose ps` · logs `web` |
| 502 | Logs `backend` · migrate / MySQL |
| Health falha | Aguarde start_period · confira MySQL healthy |
| SSL | Certs em `nginx/ssl/` + `DOMAIN` + `--enable-ssl` |

---

<div align="center">

[Índice](./README.md)
&nbsp;·&nbsp;
[Custos](./RELATORIO_CUSTOS_E_DEPLOY.md)
&nbsp;·&nbsp;
[Segurança](./SEGURANCA.md)

<br />

<sub>Casa dos Discípulos · Hospedagem · 2026</sub>

</div>
