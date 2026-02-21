# Arquitetura — Casa dos Discípulos

Visão técnica do sistema e organização do código.

---

## Visão geral

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                             │
│  React Router 6 · TypeScript · Hooks · Context API · Axios        │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/REST + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express 5)                  │
│  Rotas · Controllers · Services · Models · Middlewares          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Knex (Query Builder)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MySQL 8+                                  │
│  Usuários · Módulos · Quizzes · Lições · Formulários · Células   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend (React)

### Stack

| Tecnologia | Uso |
|------------|-----|
| **React 18** | Biblioteca UI |
| **TypeScript** | Tipagem estática |
| **React Router 6** | Roteamento (HashRouter) |
| **Axios** | Cliente HTTP com interceptors JWT |
| **CSS Modules / CSS** | Estilos (tokens em `tokens.css`) |

### Estrutura

```
frontend/src/
├── components/         # Componentes reutilizáveis
│   ├── accessibility/  # SkipLink, LiveAnnouncer, AccessibilityBar
│   ├── fields/         # Campos de formulário (TextField, TextareaField, etc.)
│   ├── layout/         # Header, Footer, Layout
│   └── ui/             # Toast, ConfirmModal, InputModal
├── config/             # api.ts, constantes
├── contexts/           # AuthContext, AccessibilityContext
├── hooks/              # useAuth, usePageTitle
├── pages/              # Telas da aplicação
├── services/           # API (authService, eventoService, etc.)
├── style/              # CSS global e por página
├── types/              # Interfaces TypeScript
└── utils/              # generateUid, errorUtils
```

### Padrões

- **Serviços:** Um por entidade (eventoService, licaoService, etc.)
- **Rotas protegidas:** `ProtectedRoute` com verificação de auth
- **Títulos dinâmicos:** `usePageTitle` para leitores de tela
- **Design:** Tokens CSS, Montserrat, teal (#02869b) e dourado (#f4b002)

---

## Backend (Node.js)

### Stack

| Tecnologia | Uso |
|------------|-----|
| **Express 5** | Framework web |
| **Knex.js** | Query builder para MySQL |
| **JWT** | Autenticação |
| **Bcrypt** | Hash de senhas |
| **Joi** | Validação de entrada |
| **Helmet** | Headers de segurança |
| **express-rate-limit** | Rate limiting |

### Arquitetura (MVC + Service Layer)

```
Request → Route → Middleware (auth, validate) → Controller → Service → Model → DB
                                                                          ↓
Response ←───────────────────────────────────────────────────────────────┘
```

### Estrutura

```
backend/src/
├── app.js             # Express, CORS, rate limit, rotas
├── controllers/      # Lógica HTTP (recebe req, chama service, retorna res)
├── models/            # Acesso ao banco (Knex)
├── services/          # Lógica de negócio
├── routes/            # Definição de rotas e middlewares
├── middlewares/       # verificarToken, checkRole, validate, errorHandler
├── validations/       # Schemas Joi
├── utils/             # AppError, constants
├── migrations/        # Migrations Knex
└── seeds/             # Dados iniciais
```

### Middlewares de segurança

| Middleware | Função |
|------------|--------|
| `verificarToken` | Valida JWT e popula `req.usuario` |
| `adminOnly` | Apenas `tipo === "administrador"` |
| `adminAndLeader` | Administrador ou líder |
| `authenticatedOnly` | Qualquer usuário autenticado |
| `validate(schema)` | Valida body com Joi |

---

## API REST

### Base URL

- Desenvolvimento: `http://localhost:3001/api`
- Produção: `https://seudominio.com/api` (via proxy Nginx)

### Autenticação

```
Authorization: Bearer <token_jwt>
```

### Principais grupos de rotas

| Prefixo | Descrição |
|---------|-----------|
| `/api/auth` | Login e registro |
| `/api/usuarios` | CRUD de usuários |
| `/api/modulo` | Módulos (Escola de Discípulos) |
| `/api/quiz` | Quizzes |
| `/api/licao` | Lições (Secretaria) |
| `/api/formulario` | Formulários |
| `/api/formulario-resposta` | Respostas de formulários |
| `/api/celula` | Células |
| `/api/evento` | Eventos (carrossel) |
| `/api/escala` | Escala de ministérios |
| `/api/fala-ai` | Fala Aí, Discípulo |
| `/api/upload` | Upload de arquivos |

Detalhes em [backend/README.md](../Codigo/backend/README.md).

---

## Banco de dados (MySQL)

### Principais tabelas

- `usuario` — Usuários e credenciais
- `modulo`, `quiz`, `quiz_questao`, `quiz_resposta` — Escola de Discípulos
- `licao`, `licao_campo` — Lições
- `formulario`, `formulario_campo`, `formulario_resposta` — Formulários
- `celula`, `usuario_celula` — Células e vínculos
- `evento` — Eventos do carrossel
- `escala_evento`, `escala_atribuicao` — Escalas
- `campo_personalizado` — Campos reutilizáveis (texto, textarea, número, data, etc.)

### Migrations

```bash
npm run migrate        # Aplicar
npm run migrate:rollback  # Reverter
```

---

## Fluxo de dados típico

1. **Login:** Frontend → POST `/api/auth/login` → Backend valida → JWT + usuário
2. **Request autenticada:** Frontend envia `Authorization: Bearer <token>` em cada request
3. **API Client:** Interceptor adiciona token automaticamente; em 401 faz logout
4. **Proteção de rotas:** `ProtectedRoute` verifica auth antes de renderizar página
5. **Roles:** Backend usa `checkRole` para restringir acesso por tipo de usuário

---

## Integrações externas

- **Evolution API** — Envio de notificações por WhatsApp (opcional)
- **Upload de arquivos** — Armazenamento em disco (`/uploads`)

---

[← Voltar ao índice](./README.md)
