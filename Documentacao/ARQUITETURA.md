<div align="center">

<img src="./assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# Arquitetura

Do navegador ao banco

<img src="./assets/header-line.svg" alt="" width="200" />

<br />

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Começando`](./COMEÇANDO.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Segurança`](./SEGURANCA.md)

</div>

---

## Visão geral

```
Frontend (React · TypeScript · Montserrat)
        │  REST + JWT
        ▼
Backend (Express · Controllers · Services · Models)
        │  Knex
        ▼
MySQL 8  (+ Evolution WhatsApp, opcional)
```

Em produção, o **Nginx** serve o React e faz proxy de `/api` e `/uploads`.

---

## Frontend

| Tecnologia | Papel |
|------------|-------|
| React 18 · TypeScript | UI |
| HashRouter | Rotas |
| apiClient | JWT automático |
| tokens.css | Marca (teal / dourado) |

```
components/ · pages/ · services/ · contexts/ · style/
```

---

## Backend

| Tecnologia | Papel |
|------------|-------|
| Express 5 | HTTP |
| Knex · MySQL | Dados |
| JWT · bcrypt · Joi | Auth e validação |
| Helmet · rate-limit | Segurança |

```
Request → Route → Middleware → Controller → Service → Model → DB
```

---

## API

| Prefixo | Domínio |
|---------|---------|
| `/api/auth` | Login e registro |
| `/api/usuarios` | Pessoas |
| `/api/modulo` · `/quiz` | Escola |
| `/api/licao` · `/formulario` | Secretaria |
| `/api/celula` · `/ministerios` | Células |
| `/api/evento` · `/escala` | Eventos e escala |
| `/api/fala-ai` · `/upload` | Devocional e arquivos |
| `/api/health` | Saúde |

---

<div align="center">

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Backend`](../Codigo/backend/README.md)

</div>
