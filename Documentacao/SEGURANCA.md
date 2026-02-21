# Segurança — Casa dos Discípulos

Medidas de segurança implementadas na aplicação e checklist para produção.

---

## Autenticação e autorização

### Registro público

- **`/api/auth/register`** — Aceita apenas `tipo: "membro"`.
- Não é possível registrar-se como administrador ou líder por meio do registro público.

### Rotas protegidas

| Recurso | Leitura | Escrita |
|---------|---------|---------|
| Eventos | `/ativos` público | Admin |
| Módulos | Público (index, active, ranking) | Admin |
| Quiz | Público (listar) | Admin |
| Lições | Autenticado | Admin |
| Formulários | Autenticado | Admin |
| Campos personalizados | Admin | Admin |
| Quiz respostas | Admin | Admin |
| Formulário respostas | Admin/Líder | Admin/Líder ou usuário (store) |
| Upload de arquivos | — | Autenticado |

### Middlewares

| Middleware | Função |
|------------|--------|
| `verificarToken` | Valida JWT e inclui `req.usuario` |
| `adminOnly` | Apenas `tipo === "administrador"` |
| `adminAndLeader` | Administrador ou líder |
| `authenticatedOnly` | Qualquer usuário autenticado |

---

## Rate limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| API geral | 100 requisições | 15 min por IP |
| Login e registro | 10 requisições | 15 min por IP |

Objetivo: reduzir risco de brute-force e abuso da API.

---

## Headers de segurança (Helmet)

O Helmet adiciona headers HTTP como:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (em produção com HTTPS)

---

## CORS

Configure em produção no `.env` do backend:

```env
CORS_ORIGIN=https://seudominio.com,https://www.seudominio.com
```

- Sem `CORS_ORIGIN`, qualquer origem é aceita (apenas para desenvolvimento).
- Em produção, use exatamente o(s) domínio(s) do frontend.

---

## JWT_SECRET

Use um valor aleatório forte em produção (mínimo 32 caracteres):

```bash
openssl rand -hex 32
```

Depois defina no `.env`:

```env
JWT_SECRET=valor_gerado_acima
```

---

## Validação de entrada

- **Joi** — Validação de body e parâmetros em todas as rotas sensíveis.
- **Sanitização** — Evita injeção e dados malformados.

---

## Upload de arquivos

- Validação de tipo (MIME e extensão)
- Limite de tamanho (5MB imagens; 10MB documentos)
- Nomes de arquivo gerados pelo servidor (evita path traversal)

---

## Checklist de produção

- [ ] `JWT_SECRET` forte e único (gerado com `openssl rand -hex 32`)
- [ ] `CORS_ORIGIN` configurado com o domínio do frontend
- [ ] HTTPS ativado no servidor
- [ ] Banco de dados com usuário limitado (não root)
- [ ] Logs sem dados sensíveis (senha, token)
- [ ] Backups regulares do banco
- [ ] Firewall configurado (portas 80, 443, 22)
- [ ] `NODE_ENV=production`

---

*[Voltar ao índice](./README.md)*
