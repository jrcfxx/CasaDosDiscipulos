<div align="center">

<img src="./assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# Hospedagem

Do zero ao ar — VPS, domínio, Docker e HTTPS

<img src="./assets/header-line.svg" alt="" width="200" />

<br />

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Custos`](./RELATORIO_CUSTOS_E_DEPLOY.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Segurança`](./SEGURANCA.md)

</div>

---

## Arquitetura

```
Usuário → Nginx (80/443) → React + proxy /api · /uploads
                ↓
           Backend → MySQL
                ↓
           Evolution (WhatsApp · localhost:8080)
```

Código: [`deploy/`](../deploy/) · script [`deploy.sh`](../deploy/deploy.sh)

---

## Checklist

| Item | Onde |
|------|------|
| VPS 2 GB | DigitalOcean / Hetzner |
| Domínio | Painel de `casadosdiscipulos.org` ou Registro.br |
| SSH | Seu computador |
| WhatsApp | Celular da igreja |

Orçamento: [Relatório de custos](./RELATORIO_CUSTOS_E_DEPLOY.md)

---

## Cinco passos

**1 · Domínio** — Preferir subdomínio `app` no domínio que a igreja já usa.

**2 · VPS** — Ubuntu 22.04, 2 GB, Docker:

```bash
ssh root@SEU_IP
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin curl -y
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```

**3 · DNS** — Registro A `app` → IP do Droplet.

**4 · App**

```bash
cd /opt && git clone https://github.com/jrcfxx/CasaDosDiscipulos.git
cd CasaDosDiscipulos/deploy
cp .env.example .env && nano .env
chmod +x deploy.sh && ./deploy.sh
docker compose exec backend node ./src/seeds/runSeeds.js
```

**5 · HTTPS + WhatsApp** — Certbot → `nginx/ssl/` → `./deploy.sh --enable-ssl`  
WhatsApp: `ssh -L 8080:127.0.0.1:8080 root@SEU_IP` → `http://localhost:8080`

---

## Comandos

| Comando | Uso |
|---------|-----|
| `./deploy.sh` | Subir / atualizar |
| `docker compose logs -f backend` | Logs |
| `curl -s http://127.0.0.1/api/health` | Saúde |

---

<div align="center">

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Custos`](./RELATORIO_CUSTOS_E_DEPLOY.md)

</div>
