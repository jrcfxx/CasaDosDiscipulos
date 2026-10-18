<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Começando

**Ambiente de desenvolvimento em poucos passos**

[Índice](./README.md)
&nbsp;·&nbsp;
[Arquitetura](./ARQUITETURA.md)
&nbsp;·&nbsp;
[Hospedagem](./HOSPEDAGEM.md)

</div>

---

## Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8+ |
| Git | 2.x |

---

## 1. Clonar

```bash
git clone https://github.com/jrcfxx/CasaDosDiscipulos.git
cd CasaDosDiscipulos
```

---

## 2. Banco MySQL

```sql
CREATE DATABASE CasaDosDiscipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'casadiscipulos'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON CasaDosDiscipulos.* TO 'casadiscipulos'@'localhost';
FLUSH PRIVILEGES;
```

---

## 3. Backend

```bash
cd Codigo/backend
npm install
cp .env.example .env
```

Configure o `.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=casadiscipulos
DB_PASSWORD=sua_senha
DB_NAME=CasaDosDiscipulos
JWT_SECRET=gere-com-openssl-rand-hex-32
NODE_ENV=development
```

```bash
openssl rand -hex 32   # JWT_SECRET
npm run migrate
npm run seed
npm run dev
```

API em `http://localhost:3001` · health: `http://localhost:3001/api/health`

---

## 4. Frontend

```bash
cd Codigo/frontend
npm install
```

Crie `.env`:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

```bash
npm start
```

App em `http://localhost:3000`

---

## 5. Contas de teste (seed)

| Email | Senha | Perfil |
|-------|-------|--------|
| `admin@test.com` | `123456` | Administrador |
| `lider@test.com` | `123456` | Líder |
| `membro@test.com` | `123456` | Membro |

---

## 6. Conferir

1. Backend responde em `/` ou `/api/health`
2. Frontend abre a home com a marca da Casa
3. Login admin → portal administrativo

---

## Estrutura

```
CasaDosDiscipulos/
├── Codigo/
│   ├── frontend/          # React · porta 3000
│   └── backend/           # API · porta 3001
├── Documentacao/          # Este guia
├── deploy/                # Produção (Docker)
└── evolution-whatsapp/    # WhatsApp local (opcional)
```

---

## Comandos

<details>
<summary><strong>Backend</strong></summary>

| Comando | Uso |
|---------|-----|
| `npm run dev` | Hot reload |
| `npm run migrate` | Migrations |
| `npm run migrate:rollback` | Reverter |
| `npm run seed` | Dados iniciais |
| `npm start` | Produção local |

</details>

<details>
<summary><strong>Frontend</strong></summary>

| Comando | Uso |
|---------|-----|
| `npm start` | Desenvolvimento |
| `npm run build` | Build produção |
| `npm run test:e2e` | Crawl E2E (Playwright) |

</details>

---

## Problemas comuns

| Sintoma | Caminho |
|---------|---------|
| Erro MySQL | Serviço ativo + credenciais no `.env` |
| Porta ocupada | Altere `PORT` no backend ou frontend |
| CORS | Frontend `:3000` e API `:3001` |
| Migrate falha | `migrate:rollback` e `migrate` de novo |

---

<div align="center">

[Índice](./README.md)
&nbsp;·&nbsp;
[Arquitetura →](./ARQUITETURA.md)
&nbsp;·&nbsp;
[Hospedagem →](./HOSPEDAGEM.md)

<br />

<sub>Casa dos Discípulos · Teal `#02869b` · Dourado `#f4b002`</sub>

</div>
