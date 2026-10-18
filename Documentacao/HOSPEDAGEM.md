<div align="center">

<img src="./assets/wave-banner.svg" width="100%" alt="" />

<img src="./assets/logo-glow.svg" width="110" alt="Casa dos Discípulos" />

# Hospedagem

<img src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=600&size=22&duration=3000&pause=900&color=F4B002&center=true&vCenter=true&width=600&height=40&lines=Do+zero+ao+ar;VPS+%C2%B7+Dom%C3%ADnio+%C2%B7+Docker+%C2%B7+HTTPS" alt="" />

<img src="./assets/divider-animated.svg" width="400" alt="" />

<img src="./assets/docs-hero-banner.jpg" width="88%" alt="Banner" />

<br />

[Índice](./README.md) ✦ [Custos](./RELATORIO_CUSTOS_E_DEPLOY.md) ✦ [Segurança](./SEGURANCA.md)

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

Código: [`deploy/`](../deploy/) · [`deploy.sh`](../deploy/deploy.sh)

<p align="center">
  <img src="./assets/docs-emblem.jpg" width="120" alt="" />
</p>

---

## Checklist

| Item | Onde |
|------|------|
| VPS 2 GB | DigitalOcean / Hetzner |
| Domínio | `casadosdiscipulos.org` ou Registro.br |
| SSH | Seu PC |
| WhatsApp | Celular da igreja |

Orçamento: [Relatório de custos](./RELATORIO_CUSTOS_E_DEPLOY.md).

---

## Do zero em 5 passos

### 1 · Domínio

Preferir subdomínio `app` no domínio que a igreja já usa. Alternativa: [Registro.br](https://registro.br).

### 2 · VPS

Ubuntu 22.04 · 2 GB · Docker:

```bash
ssh root@SEU_IP
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin curl -y
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```

### 3 · DNS

Registro **A** `app` → IP do Droplet.

### 4 · App

```bash
cd /opt && git clone https://github.com/jrcfxx/CasaDosDiscipulos.git
cd CasaDosDiscipulos/deploy
cp .env.example .env && nano .env
chmod +x deploy.sh && ./deploy.sh
docker compose exec backend node ./src/seeds/runSeeds.js
```

### 5 · HTTPS + WhatsApp

Certbot → copiar certs para `nginx/ssl/` → `./deploy.sh --enable-ssl`  
WhatsApp: `ssh -L 8080:127.0.0.1:8080 root@SEU_IP` → `http://localhost:8080`

---

## Dia a dia

| Comando | Uso |
|---------|-----|
| `./deploy.sh` | Subir / atualizar |
| `docker compose logs -f backend` | Logs |
| `curl -s http://127.0.0.1/api/health` | Saúde |

---

<div align="center">

<img src="./assets/divider-animated.svg" width="360" alt="" />

[Índice](./README.md) · [Custos](./RELATORIO_CUSTOS_E_DEPLOY.md)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:02869b,100:f4b002&height=110&section=footer" width="100%" alt="" />

</div>
