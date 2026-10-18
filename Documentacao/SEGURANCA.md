<div align="center">

<img src="./assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# Segurança

Camadas de proteção e checklist de produção

<img src="./assets/header-line.svg" alt="" width="200" />

<br />

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Hospedagem`](./HOSPEDAGEM.md)

</div>

---

## Auth e papéis

| Middleware | Quem passa |
|------------|------------|
| `verificarToken` | Token válido + usuário ativo |
| `adminOnly` | Administrador |
| `adminAndLeader` | Admin ou líder |
| `adminAndLiderMinisterio` | Admin / líder de ministério |
| `authenticatedOnly` | Qualquer autenticado |

Registro público: apenas `tipo: "membro"`.

---

## Rate limit (produção)

| Escopo | Limite |
|--------|--------|
| API geral | 300 req / 15 min |
| Login e registro | 30 req / 15 min |

---

## Produção

```env
CORS_ORIGIN=https://app.casadosdiscipulos.org
JWT_SECRET=...   # openssl rand -hex 32
```

- HTTPS obrigatório  
- Evolution apenas em `127.0.0.1:8080`  
- Firewall: 22 · 80 · 443  
- Backups de MySQL e uploads  

---

## Checklist

- [ ] `JWT_SECRET` forte  
- [ ] `CORS_ORIGIN` com domínio HTTPS  
- [ ] Let's Encrypt ativo  
- [ ] MySQL sem root na aplicação  
- [ ] `NODE_ENV=production`  

---

<div align="center">

[`Índice`](./README.md)

</div>
