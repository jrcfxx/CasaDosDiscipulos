<div align="center">

<img src="./assets/wave-banner.svg" width="100%" alt="" />

<img src="./assets/logo-glow.svg" width="110" alt="Casa dos Discípulos" />

# Segurança

<img src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=600&size=22&duration=3000&pause=900&color=02869B&center=true&vCenter=true&width=560&height=40&lines=Camadas+de+prote%C3%A7%C3%A3o;JWT+%C2%B7+Helmet+%C2%B7+Rate+limit" alt="" />

<img src="./assets/divider-animated.svg" width="400" alt="" />

<img src="./assets/docs-emblem.jpg" width="110" alt="" />

<br />

[Índice](./README.md) ✦ [Hospedagem](./HOSPEDAGEM.md)

</div>

---

## Auth e papéis

| Middleware | Quem passa |
|------------|------------|
| `verificarToken` | Token válido + ativo |
| `adminOnly` | Administrador |
| `adminAndLeader` | Admin ou líder |
| `adminAndLiderMinisterio` | Admin / líder de ministério |
| `authenticatedOnly` | Qualquer autenticado |

Registro público: apenas `membro`.

---

## Rate limit (produção)

| Escopo | Limite |
|--------|--------|
| API | 300 / 15 min |
| Login · registro | 30 / 15 min |

---

## Produção

```env
CORS_ORIGIN=https://app.casadosdiscipulos.org
JWT_SECRET=...   # openssl rand -hex 32
```

- HTTPS obrigatório  
- Evolution só em `127.0.0.1:8080`  
- Firewall: 22 · 80 · 443  
- Backups de MySQL e uploads  

---

## Checklist

- [ ] `JWT_SECRET` forte  
- [ ] `CORS_ORIGIN` HTTPS  
- [ ] Let's Encrypt  
- [ ] MySQL sem root na app  
- [ ] `NODE_ENV=production`  

---

<div align="center">

<img src="./assets/divider-animated.svg" width="360" alt="" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,100:02869b&height=100&section=footer" width="100%" alt="" />

</div>
