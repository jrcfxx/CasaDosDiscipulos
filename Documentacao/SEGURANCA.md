<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Segurança

**Camadas de proteção da plataforma e checklist de produção**

[Índice](./README.md)
&nbsp;·&nbsp;
[Hospedagem](./HOSPEDAGEM.md)
&nbsp;·&nbsp;
[Arquitetura](./ARQUITETURA.md)

</div>

---

## Autenticação e papéis

| Recurso | Regra |
|---------|-------|
| Registro público | Apenas `tipo: "membro"` |
| JWT | Obrigatório nas rotas protegidas |
| Senhas | Hash com bcrypt |

| Middleware | Quem passa |
|------------|------------|
| `verificarToken` | Token válido + usuário ativo |
| `adminOnly` | Administrador |
| `adminAndLeader` | Admin ou líder |
| `adminAndLiderMinisterio` | Admin ou líder de ministério |
| `authenticatedOnly` | Qualquer autenticado |

### Matriz resumida

| Área | Leitura | Escrita |
|------|---------|---------|
| Eventos públicos | Aberto (`/ativos`) | Admin |
| Células públicas | Aberto (`/publicas`) | Admin |
| Usuários (lista) | Admin | Admin |
| Ministérios (lista) | Admin / líder | Admin |
| Escala (visão) | Autenticado | Admin / líder ministério |
| Lições / formulários | Autenticado | Admin (CRUD) · líder (respostas) |

---

## Rate limiting

| Escopo | Produção | Desenvolvimento |
|--------|----------|-----------------|
| API geral | 300 req / 15 min | 5000 (ajustável) |
| Login / registro | 30 req / 15 min | 500 (ajustável) |

Variáveis: `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`.

---

## Headers e CORS

- **Helmet** — `nosniff`, frame options, etc.
- **CORS** em produção:

```env
CORS_ORIGIN=https://app.casadosdiscipulos.org
```

Sem `CORS_ORIGIN`, qualquer origem é aceita (somente adequado em desenvolvimento).

---

## Segredos

```bash
openssl rand -hex 32   # JWT_SECRET (mín. 32 caracteres)
```

Nunca commitar `.env`. Em deploy, use `deploy/.env` a partir de `.env.example`.

---

## Validação e uploads

- **Joi** em rotas sensíveis  
- Uploads com tipo/tamanho validados e nomes gerados pelo servidor  
- Limites típicos: 5 MB imagens · 10 MB documentos  

---

## Checklist de produção

- [ ] `JWT_SECRET` forte e único  
- [ ] `CORS_ORIGIN` com o domínio HTTPS real  
- [ ] HTTPS (Let's Encrypt) ativo  
- [ ] MySQL sem usuário root na aplicação  
- [ ] Evolution apenas em `127.0.0.1:8080` (túnel SSH para QR)  
- [ ] Firewall: 22, 80, 443  
- [ ] Backups de banco e `/uploads`  
- [ ] `NODE_ENV=production`  
- [ ] Logs sem senha/token  

---

<div align="center">

[Índice](./README.md)
&nbsp;·&nbsp;
[Hospedagem](./HOSPEDAGEM.md)

<br />

<sub>Casa dos Discípulos · Segurança · 2026</sub>

</div>
