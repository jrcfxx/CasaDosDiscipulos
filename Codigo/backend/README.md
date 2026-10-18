<div align="center">

<img src="../frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Backend API

**Node.js · Express 5 · MySQL · JWT**

[Documentação](../../Documentacao/README.md)
&nbsp;·&nbsp;
[Segurança](../../Documentacao/SEGURANCA.md)
&nbsp;·&nbsp;
[Começando](../../Documentacao/COMEÇANDO.md)

</div>

---

## Módulos

Escola de Discípulos · Secretaria das Células · Eventos · Escala · Fala Aí · Usuários e células · Ministérios · Notificações

---

## Quick start

```bash
npm install
cp .env.example .env
# edite DB_* e JWT_SECRET
npm run migrate
npm run seed
npm run dev
```

API: `http://localhost:3001` · health: `/api/health`

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=CasaDosDiscipulos
JWT_SECRET=minimo_32_caracteres_aleatorios_seguros
NODE_ENV=development
CORS_ORIGIN=
```

---

## Comandos

| Comando | Uso |
|---------|-----|
| `npm run dev` | Hot reload |
| `npm run migrate` | Migrations |
| `npm run migrate:rollback` | Rollback |
| `npm run seed` | Seeds |
| `npm start` | Produção |
| `node scripts/e2eRoutesTest.mjs` | Suite E2E da API |

---

## Seeds de teste

| Email | Senha | Tipo |
|-------|-------|------|
| admin@test.com | 123456 | administrador |
| lider@test.com | 123456 | lider |
| membro@test.com | 123456 | membro |

---

## Rotas (amostra)

| Grupo | Exemplos |
|-------|----------|
| Auth | `POST /api/auth/login` · `POST /api/auth/register` |
| Escola | `GET /api/modulo` · `POST /api/quiz/:id/responder` |
| Secretaria | `GET /api/licao` · `POST /api/formulario-resposta` |
| Eventos | `GET /api/evento/ativos` · CRUD admin |
| Escala | `/api/escala/*` |
| Saúde | `GET /api/health` |

Coleção Postman: `Casa_dos_Discipulos_API.postman_collection.json` (se presente no repo).

---

## Segurança

- JWT · bcrypt · Helmet · Joi  
- Rate limit: 300/15min (prod API) · 30/15min (login)  
- `CORS_ORIGIN` obrigatório em produção  

Detalhes: [SEGURANCA.md](../../Documentacao/SEGURANCA.md).

---

## Estrutura

```
backend/
├── src/app.js · controllers · services · models · routes · middlewares
├── docker-entrypoint.sh   # migrate + start (imagem Docker)
├── knexfile.cjs
└── scripts/               # e2e e utilitários
```

---

<div align="center">

[Documentação](../../Documentacao/README.md)

<br />

<sub>Casa dos Discípulos · Backend · 2026</sub>

</div>
