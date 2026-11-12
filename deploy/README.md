<div align="center">

<img src="../Documentacao/assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# Deploy

Docker · Nginx · MySQL · Evolution

<img src="../Documentacao/assets/header-line.svg" alt="" width="200" />

<br />

[`Hospedagem`](../Documentacao/HOSPEDAGEM.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Custos`](../Documentacao/RELATORIO_CUSTOS_E_DEPLOY.md)

</div>

---

## Uso

```bash
cp .env.example .env
chmod +x deploy.sh
./deploy.sh                # HTTPS automático se houver certificados em nginx/ssl/ + DOMAIN
./deploy.sh --enable-ssl   # igual, mas falha se não houver certificados
```

Smoke: `GET /api/health`

## Deploy automático

Todo push na `main` que altere `Codigo/backend`, `Codigo/frontend` ou `deploy/` roda o workflow
[`Build & Deploy`](../.github/workflows/docker-build.yml): compila as imagens e, se passar,
entra no servidor por SSH, faz `git pull` e roda `./deploy.sh`.
Também pode ser disparado manualmente na aba **Actions → Build & Deploy → Run workflow**.

Secrets do repositório: `SSH_HOST`, `SSH_USER`, `SSH_KEY`.
No servidor, `.env` e `nginx/ssl/*.pem` não são versionados e são preservados entre deploys.

---

## Serviços

| Container | Função |
|-----------|--------|
| web | Nginx + React |
| backend | API |
| mysql | Banco (rede interna) |
| evolution | WhatsApp (`127.0.0.1:8080`) |

---

<div align="center">

[`Documentação`](../Documentacao/README.md)

</div>
