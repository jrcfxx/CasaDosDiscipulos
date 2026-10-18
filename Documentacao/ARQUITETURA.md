<div align="center">

<img src="./assets/wave-banner.svg" width="100%" alt="" />

<img src="./assets/logo-glow.svg" width="110" alt="Casa dos Discípulos" />

# Arquitetura

<img src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=600&size=22&duration=3000&pause=900&color=02869B&center=true&vCenter=true&width=580&height=40&lines=Do+navegador+ao+banco;React+%C2%B7+Express+%C2%B7+MySQL" alt="" />

<img src="./assets/divider-animated.svg" width="400" alt="" />

<img src="./assets/docs-hero-banner.jpg" width="85%" alt="Banner" />

<br />

[Índice](./README.md) ✦ [Começando](./COMEÇANDO.md) ✦ [Segurança](./SEGURANCA.md)

</div>

---

## Visão geral

```
Frontend (React · Montserrat · teal/dourado)
        │  REST + JWT
        ▼
Backend (Express · Controllers · Services · Models)
        │  Knex
        ▼
MySQL 8  ·  (+ Evolution WhatsApp opcional)
```

Em produção: **Nginx** serve o React e faz proxy de `/api` e `/uploads`.

<p align="center">
  <img src="./assets/docs-emblem.jpg" width="140" alt="Emblema" />
</p>

---

## Frontend

| Tech | Papel |
|------|-------|
| React 18 · TypeScript | UI tipada |
| HashRouter | Rotas |
| apiClient | JWT automático |
| tokens.css | Marca da Casa |

```
components/ · pages/ · services/ · contexts/ · style/
```

---

## Backend

| Tech | Papel |
|------|-------|
| Express 5 | HTTP |
| Knex · MySQL | Dados |
| JWT · bcrypt · Joi | Auth e validação |
| Helmet · rate-limit | Segurança |

```
Request → Route → Middleware → Controller → Service → Model → DB
```

---

## API (prefixos)

`/api/auth` · `/usuarios` · `/modulo` · `/quiz` · `/licao` · `/formulario` · `/celula` · `/evento` · `/escala` · `/fala-ai` · `/upload` · `/health`

---

<div align="center">

<img src="./assets/divider-animated.svg" width="360" alt="" />

[Índice](./README.md) · [Backend](../Codigo/backend/README.md)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,100:02869b&height=100&section=footer" width="100%" alt="" />

</div>
