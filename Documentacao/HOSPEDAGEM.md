# Guia de Hospedagem - Casa dos Discípulos

Este documento explica como hospedar a aplicação de forma profissional, com suporte a **até ~50 acessos simultâneos** e **notificações WhatsApp**.

---

## Visão geral da arquitetura

```
                    ┌─────────────────────────────────────┐
                    │           NGINX (porta 80)          │
                    │  - Serve frontend React             │
                    │  - Proxy /api e /uploads → backend │
                    └─────────────────┬─────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             │
┌─────────────────┐          ┌─────────────────┐                     │
│    Backend      │          │    MySQL         │                     │
│   (Node.js)     │◄────────►│   (dados)       │                     │
│   porta 3001    │          │   porta 3306     │                     │
└────────┬────────┘          └─────────────────┘                     │
         │                                                             │
         │ EVOLUTION_API_URL                                            │
         ▼                                                             │
┌─────────────────┐                                                    │
│  Evolution API  │  (WhatsApp - porta 8080)                          │
│  (Baileys)      │                                                    │
└─────────────────┘                                                    │
```

- **Web**: Nginx serve o React e faz proxy para o backend
- **Backend**: API Node.js + Express
- **MySQL**: Banco de dados
- **Evolution API**: Envio de mensagens WhatsApp

---

## Passo 1: Escolher o provedor (VPS)

Para ~50 usuários simultâneos, um **VPS modesto** é suficiente.

| Provedor      | Plano sugerido | RAM  | Custo aprox. |
|---------------|----------------|------|--------------|
| **DigitalOcean** | Basic Droplet  | 2GB  | ~US$ 12/mês  |
| **Hetzner**      | CX22           | 2GB  | ~€ 4/mês     |
| **Vultr**        | Cloud Compute  | 2GB  | ~US$ 12/mês  |
| **Contabo**      | VPS S          | 4GB  | ~€ 5/mês     |

**Sistema operacional:** Ubuntu 22.04 LTS

---

## Passo 2: Preparar o servidor

### 2.1 Conectar via SSH

```bash
ssh root@SEU_IP_DO_SERVIDOR
```

### 2.2 Instalar Docker e Docker Compose

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version
```

### 2.3 Opcional: criar usuário não-root

```bash
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy
su - deploy
```

---

## Passo 3: Enviar o projeto para o servidor

### Opção A: via Git (recomendado)

No servidor:

```bash
cd /opt
git clone https://github.com/SEU_USUARIO/CasaDosDiscipulos.git
cd CasaDosDiscipulos
```

### Opção B: via SCP/SFTP

No seu computador:

```bash
scp -r Caminho/Local/CasaDosDiscipulos deploy@SEU_IP:/opt/
```

### Opção C: via rsync

```bash
rsync -avz --exclude node_modules --exclude .git ./CasaDosDiscipulos deploy@SEU_IP:/opt/
```

---

## Passo 4: Configurar variáveis de ambiente

```bash
cd /opt/CasaDosDiscipulos/deploy

cp .env.example .env
nano .env
```

**Configure:**

```env
DB_USER=casadiscipulos
DB_PASSWORD=SENHA_MUITO_SEGURA_AQUI
DB_NAME=CasaDosDiscipulos

JWT_SECRET=MINIMO_32_CARACTERES_ALEATORIOS_SEGUROS

REACT_APP_API_URL=/api

EVOLUTION_API_KEY=chave-que-voce-escolher
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
```

- **JWT_SECRET**: gere com `openssl rand -base64 32`
- **EVOLUTION_API_KEY**: use a mesma chave que configurar na Evolution

---

## Passo 5: Fazer o deploy

```bash
cd /opt/CasaDosDiscipulos/deploy

# Build das imagens
docker compose build

# Subir os containers
docker compose up -d

# Verificar se tudo está rodando
docker compose ps
```

Deve aparecer:
- `casadiscipulos_web` (porta 80)
- `casadiscipulos_backend` (interno)
- `casadiscipulos_mysql` (interno)
- `casadiscipulos_evolution` (porta 8080)

---

## Passo 6: Configurar o WhatsApp (Evolution API)

1. Acesse no navegador: `http://SEU_IP:8080`
2. Crie uma **instância** com o nome `casadosdiscipulos` (ou o que definiu em `EVOLUTION_INSTANCE_NAME`)
3. Aparecerá um **QR Code**
4. No celular: WhatsApp → **Configurações** → **Aparelhos conectados** → **Conectar aparelho**
5. Escaneie o QR Code

Depois disso, o número fica conectado e as notificações passam a funcionar.

---

## Passo 7: Domínio e SSL (HTTPS)

### 7.1 Apontar o domínio

No painel do seu provedor de domínio (Registro.br, GoDaddy, etc.):

- **A**: `app.seudominio.com.br` → IP do servidor

### 7.2 Instalar certificado SSL (Let's Encrypt)

```bash
apt install certbot -y

# Gerar certificado
certbot certonly --standalone -d app.seudominio.com.br
```

Os arquivos ficam em:
- `/etc/letsencrypt/live/app.seudominio.com.br/fullchain.pem`
- `/etc/letsencrypt/live/app.seudominio.com.br/privkey.pem`

### 7.3 Ativar HTTPS no Nginx

1. Copie os certificados para o projeto:

```bash
mkdir -p /opt/CasaDosDiscipulos/deploy/nginx/ssl
cp /etc/letsencrypt/live/app.seudominio.com.br/fullchain.pem /opt/CasaDosDiscipulos/deploy/nginx/ssl/
cp /etc/letsencrypt/live/app.seudominio.com.br/privkey.pem /opt/CasaDosDiscipulos/deploy/nginx/ssl/
```

2. Atualize o `deploy/nginx/nginx.conf` para incluir o bloco HTTPS (veja comentário no arquivo) e reinicie:

```bash
docker compose restart web
```

---

## Passo 8: Seed inicial (primeira vez)

Para popular o banco com dados de exemplo:

```bash
docker compose exec backend node ./src/seeds/runSeeds.js
```

---

## Comandos úteis

| Comando | Descrição |
|--------|-----------|
| `docker compose logs -f` | Ver logs em tempo real |
| `docker compose logs -f backend` | Logs só do backend |
| `docker compose restart backend` | Reiniciar o backend |
| `docker compose down` | Parar todos os containers |
| `docker compose up -d --build` | Reconstruir e subir |

---

## Atualizar a aplicação

Quando houver mudanças no código:

```bash
cd /opt/CasaDosDiscipulos
git pull   # se usar Git

cd deploy
docker compose build
docker compose up -d
```

---

## Backup

### Banco de dados

```bash
docker compose exec mysql mysqldump -u casadiscipulos -p CasaDosDiscipulos > backup_$(date +%Y%m%d).sql
```

### Uploads (fotos)

```bash
docker compose run --rm -v casadiscipulos_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .
```

---

## Segurança recomendada

1. **Firewall (UFW)**:
   ```bash
   ufw allow 22    # SSH
   ufw allow 80     # HTTP
   ufw allow 443    # HTTPS
   ufw enable
   ```

2. **Restringir Evolution**: Após conectar o WhatsApp, feche a porta 8080 no firewall se não precisar acessá-la:
   ```bash
   # Remova a exposição da porta 8080 no docker-compose se não for acessar pela internet
   ```

3. **Senhas fortes** para `DB_PASSWORD` e `JWT_SECRET`.

---

## Resolução de problemas

| Problema | Solução |
|----------|---------|
| Site não carrega | `docker compose ps` → conferir containers; `docker compose logs web` |
| Erro 502 | Backend pode não ter iniciado; `docker compose logs backend` |
| Migrations falham | MySQL pode ainda não estar pronto; aguardar e `docker compose restart backend` |
| WhatsApp não envia | Verificar Evolution em `http://IP:8080`; conferir `EVOLUTION_INSTANCE_NAME` e `EVOLUTION_API_KEY` no `.env` |
