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

---

## Como fazer deploy (dia a dia)

O deploy é automático: **o que entra na `main` vai para produção** (https://casadosdiscipulos.com.br).

1. **Desenvolva numa branch** e teste localmente:
   ```bash
   git checkout -b minha-feature
   # ... alterações ...
   git add -A && git commit -m "feat: descrição"
   git push -u origin minha-feature
   ```
2. **Abra um Pull Request para `main`** no GitHub. O CI só compila as imagens (sem deploy) e mostra ✅ ou ❌.
3. **Faça o merge do PR** (ou `git push` direto na `main` para mudanças pequenas).
4. **Acompanhe** em **Actions → Build & Deploy**:
   - `build` compila backend e frontend;
   - `deploy` entra no servidor, faz `git pull`, roda `./deploy.sh` (build, `up -d`, migrations e smoke `GET /api/health`).
5. **Confira o site** em https://casadosdiscipulos.com.br e o health em `/api/health`.

O deploy só dispara quando o push altera `Codigo/backend/`, `Codigo/frontend/`, `deploy/` ou o workflow.
Mudanças só de documentação não fazem deploy.

### Deploy manual (sem commit novo)

**Actions → Build & Deploy → Run workflow → main**. Útil para refazer um deploy que falhou por algo no servidor.

### Desfazer um deploy (rollback)

Reverta o commit problemático e envie; o workflow faz o deploy da versão anterior:
```bash
git revert <sha-do-commit>
git push origin main
```

### Se o deploy falhar

| Onde falhou | O que fazer |
|-------------|-------------|
| job `build` | Erro de compilação: veja o log, corrija e faça novo push. Nada mudou no servidor. |
| job `deploy`, no `git pull` | Alguém alterou arquivos direto no servidor. No servidor: `cd /opt/CasaDosDiscipulos && git status`, depois `git stash` e rode o workflow de novo. |
| job `deploy`, "health ainda não respondeu" | No servidor: `cd /opt/CasaDosDiscipulos/deploy && docker compose logs --tail=100 backend`. |

> Migrations do banco rodam sozinhas ao subir o backend. **Nunca edite arquivos versionados direto no servidor** — altere no repositório e faça push.

---

## Configuração inicial (uma vez só)

Já feita em produção; só repita se trocar de servidor.

1. **Servidor**: Docker + Docker Compose, repositório clonado em `/opt/CasaDosDiscipulos`,
   `deploy/.env` criado a partir de `.env.example` e primeiro `./deploy.sh` executado.
2. **HTTPS**: com o DNS apontando para o servidor, gere o certificado (porta 80 livre):
   ```bash
   cd /opt/CasaDosDiscipulos/deploy
   docker compose stop web
   certbot certonly --standalone -d SEU_DOMINIO -d www.SEU_DOMINIO
   cp /etc/letsencrypt/live/SEU_DOMINIO/{fullchain,privkey}.pem nginx/ssl/
   ```
   Defina `DOMAIN` e `CORS_ORIGIN` no `.env` e rode `./deploy.sh`. A renovação automática usa os hooks
   `/etc/letsencrypt/renewal-hooks/pre/stop-web.sh` (para o `web`) e `post/start-web.sh`
   (copia os `.pem` para `nginx/ssl/` e religa o `web`); teste com `certbot renew --dry-run`.
3. **Chave SSH do GitHub Actions** (no servidor):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" -C github-actions
   cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
   cat ~/.ssh/github_deploy   # copie direto para o secret SSH_KEY — não cole em chats
   ```
4. **Secrets do GitHub** (*Settings → Secrets and variables → Actions*):

   | Secret | Valor |
   |--------|-------|
   | `SSH_HOST` | IP do servidor |
   | `SSH_USER` | usuário SSH (ex.: `root`) |
   | `SSH_KEY` | chave privada `~/.ssh/github_deploy` |

No servidor, `.env`, `nginx/ssl/*.pem` e `nginx/active.conf` não são versionados e são preservados entre deploys.

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
