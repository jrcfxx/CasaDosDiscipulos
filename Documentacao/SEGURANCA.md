# Segurança – Casa dos Discípulos

Este documento descreve as medidas de segurança implementadas na aplicação.

---

## Autenticação e Autorização

### Registro público
- **`/api/auth/register`** – Aceita apenas `tipo: "membro"`. Não é possível registrar-se como administrador ou líder.

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
| Upload de arquivos | - | Autenticado |

### Middlewares
- **verificarToken** – Valida JWT e inclui `req.usuario`
- **adminOnly** – Apenas `tipo === "administrador"`
- **adminAndLeader** – Administrador ou líder
- **authenticatedOnly** – Qualquer usuário autenticado

---

## Rate limiting

- **API geral:** 100 requisições / 15 min por IP
- **Login e registro:** 10 requisições / 15 min por IP (proteção contra brute-force)

---

## Headers de segurança (Helmet)

O Helmet adiciona headers HTTP de segurança como:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (em produção com HTTPS)

---

## CORS

Configure em produção no `.env`:

```
CORS_ORIGIN=https://seudominio.com,https://www.seudominio.com
```

Sem `CORS_ORIGIN`, qualquer origem é aceita (somente para desenvolvimento).

---

## JWT_SECRET

Use um valor aleatório forte em produção (mínimo 32 caracteres):

```
JWT_SECRET=gerar-com-openssl-rand-hex-32
```

Exemplo para gerar: `openssl rand -hex 32`

---

## Checklist de produção

- [ ] `JWT_SECRET` forte e único
- [ ] `CORS_ORIGIN` configurado com o domínio do frontend
- [ ] HTTPS ativado
- [ ] Banco de dados com usuário limitado (não root)
- [ ] Logs sem dados sensíveis (senha, token)
- [ ] Backups regulares do banco
