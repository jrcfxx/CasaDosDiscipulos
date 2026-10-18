<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Arquitetura

**Como o sistema se organiza — do navegador ao banco**

[Índice](./README.md)
&nbsp;·&nbsp;
[Começando](./COMEÇANDO.md)
&nbsp;·&nbsp;
[Segurança](./SEGURANCA.md)

</div>

---

## Visão geral

```
┌──────────────────────────────────────────────────────────┐
│  Frontend · React 18 · TypeScript · HashRouter · Axios   │
│  Marca: Montserrat · teal #02869b · dourado #f4b002      │
└────────────────────────────┬─────────────────────────────┘
                             │  HTTPS / REST + JWT
                             ▼
┌──────────────────────────────────────────────────────────┐
│  Backend · Express 5 · Controllers · Services · Models   │
└────────────────────────────┬─────────────────────────────┘
                             │  Knex
                             ▼
┌──────────────────────────────────────────────────────────┐
│  MySQL 8 · usuários · módulos · células · escala · …     │
└──────────────────────────────────────────────────────────┘
```

Em produção, o **Nginx** serve o build React e faz proxy de `/api` e `/uploads` para o Node. Opcionalmente, a **Evolution API** envia WhatsApp.

---

## Frontend

| Tecnologia | Papel |
|------------|-------|
| React 18 | UI |
| TypeScript | Tipagem |
| React Router 6 | Rotas (`HashRouter`) |
| Axios (`apiClient`) | HTTP + JWT automático |
| CSS + tokens | Design system da Casa |

```
frontend/src/
├── components/     # layout, ui, fields, accessibility
├── contexts/       # Auth, Accessibility
├── hooks/          # useAuth, usePageTitle
├── pages/          # Telas públicas, admin e usuário
├── services/       # Chamadas à API
├── style/          # tokens.css e estilos por página
└── utils/
```

**Padrões:** `ProtectedRoute` por papel · títulos dinâmicos · modais com FocusTrap · serviços por domínio.

---

## Backend

| Tecnologia | Papel |
|------------|-------|
| Express 5 | HTTP |
| Knex.js | MySQL |
| JWT + bcrypt | Auth |
| Joi | Validação |
| Helmet + rate-limit | Segurança |

```
Request → Route → Middleware → Controller → Service → Model → DB
                                                              ↓
Response ←────────────────────────────────────────────────────┘
```

```
backend/src/
├── app.js
├── controllers/ · services/ · models/ · routes/
├── middlewares/   # auth, roles, validate, errors
├── validations/   # Joi
├── jobs/          # WhatsApp módulos
└── seeds/
```

---

## API

| Ambiente | Base |
|----------|------|
| Dev | `http://localhost:3001/api` |
| Prod | `https://seu-dominio/api` |

```
Authorization: Bearer <token>
```

| Prefixo | Domínio |
|---------|---------|
| `/api/auth` | Login e registro |
| `/api/usuarios` | Pessoas e perfil |
| `/api/modulo` · `/api/quiz` | Escola de Discípulos |
| `/api/licao` · `/api/formulario` | Secretaria |
| `/api/celula` · `/api/ministerios` | Células e ministérios |
| `/api/evento` · `/api/escala` | Eventos e escala |
| `/api/fala-ai` | Devocional |
| `/api/upload` | Arquivos |
| `/api/health` | Saúde da API |

---

## Dados

Principais entidades: `usuario`, `modulo`, `quiz`, `licao`, `formulario`, `celula`, `evento`, `escala_*`, `campo_personalizado`, `notificacao`.

```bash
cd Codigo/backend
npm run migrate
npm run migrate:rollback
```

---

## Fluxo típico

1. Login → JWT + dados do usuário  
2. `apiClient` anexa o token em cada request  
3. `401` → logout e redirecionamento ao login  
4. Frontend protege rotas; backend reforça com `checkRole`

---

## Integrações

| Serviço | Uso |
|---------|-----|
| Evolution API | WhatsApp (escala, módulos) |
| Disco `/uploads` | Fotos, campos e mídia |

---

<div align="center">

[Índice](./README.md)
&nbsp;·&nbsp;
[Começando](./COMEÇANDO.md)
&nbsp;·&nbsp;
[Backend](../Codigo/backend/README.md)

<br />

<sub>Casa dos Discípulos · Arquitetura · 2026</sub>

</div>
