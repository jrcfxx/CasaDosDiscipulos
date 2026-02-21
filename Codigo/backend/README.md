# Casa dos Discípulos — Backend API

API REST em Node.js para o sistema de gestão da Casa dos Discípulos.

---

## Módulos principais

- **Escola de Discípulos** — Módulos educacionais com quizzes gamificados
- **Secretaria das Células** — Lições e formulários para líderes de células
- **Eventos** — CRUD e divulgação de eventos
- **Escala** — Calendário e escalas de ministérios
- **Usuários** — Autenticação JWT, RBAC (admin, líder, membro)

---

## Quick Start

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar `.env`

```bash
cp .env.example .env
```

Edite `.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=CasaDosDiscipulos
JWT_SECRET=minimo_32_caracteres_aleatorios_seguros
NODE_ENV=development
```

> **Produção:** Use `CORS_ORIGIN` e `JWT_SECRET` forte. Ver [SEGURANCA.md](../../Documentacao/SEGURANCA.md).

### 3. Criar banco no MySQL

```sql
CREATE DATABASE CasaDosDiscipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Migrations e seed

```bash
npm run migrate
npm run seed
```

### 5. Rodar o servidor

```bash
npm run dev
```

API em: `http://localhost:3001`

---

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento com hot reload |
| `npm run migrate` | Executa migrations |
| `npm run migrate:rollback` | Desfaz última migration |
| `npm run seed` | Popula dados de teste |
| `npm start` | Produção |

---

## Usuários padrão (seeds)

| Email | Senha | Tipo |
|-------|-------|------|
| admin@test.com | 123456 | administrador |
| lider@test.com | 123456 | lider |
| membro@test.com | 123456 | membro |

---

## Rotas principais

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastrar membro (apenas `tipo: membro`) |
| POST | `/api/auth/login` | Login |

### Escola de Discípulos

| Método | Rota | Acesso |
|--------|------|--------|
| GET | `/api/modulo` | Público |
| GET | `/api/quiz/:id` | Público |
| POST | `/api/quiz/:id/responder` | Autenticado |
| POST | `/api/modulo` | Admin |

### Secretaria das Células

| Método | Rota | Acesso |
|--------|------|--------|
| GET | `/api/licao` | Autenticado |
| GET | `/api/formulario` | Autenticado |
| POST | `/api/formulario-resposta` | Autenticado |
| POST | `/api/licao` | Admin |

### Eventos

| Método | Rota | Acesso |
|--------|------|--------|
| GET | `/api/evento/ativos` | Público |
| GET | `/api/evento` | Admin |
| POST | `/api/evento` | Admin |
| PUT | `/api/evento/:id` | Admin |
| DELETE | `/api/evento/:id` | Admin |
| POST | `/api/evento/:id/upload` | Admin |

### Upload

| Método | Rota | Acesso |
|--------|------|--------|
| POST | `/api/upload/campo` | Autenticado |

---

## Estrutura do projeto

```
backend/
├── src/
│   ├── app.js              # Express, Helmet, CORS, rate limit
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/        # verificarToken, adminOnly, adminAndLeader
│   ├── validations/        # Joi (authValidation, etc.)
│   ├── migrations/
│   └── seeds/
├── knexfile.cjs
└── .env
```

---

## Segurança

- **JWT** — Autenticação em rotas protegidas
- **Helmet** — Headers de segurança
- **Rate limiting** — 100 req/15min (API geral); 10 req/15min (login/registro)
- **CORS** — Configure `CORS_ORIGIN` em produção
- **Validação** — Joi em rotas sensíveis

Ver [SEGURANCA.md](../../Documentacao/SEGURANCA.md) para checklist completo.

---

## Tecnologias

- Node.js 18+
- Express 5
- MySQL 8
- Knex.js (query builder)
- JWT, bcrypt, Joi, dotenv

---

## Postman

Importe `Casa_dos_Discipulos_API.postman_collection.json` para testar as rotas.

---

*[Voltar ao índice da documentação](../../Documentacao/README.md)*
