<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# WhatsApp no ambiente local

**Evolution API + Docker na sua máquina**

[Índice](./README.md)
&nbsp;·&nbsp;
[WhatsApp](./WHATSAPP.md)
&nbsp;·&nbsp;
[Começando](./COMEÇANDO.md)

</div>

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) em execução  
- Backend e frontend da Casa rodando ([Começando](./COMEÇANDO.md))  
- WhatsApp no celular (número que enviará as mensagens)

> A Evolution **v2** exige PostgreSQL e Redis. Use o `docker compose` da pasta `evolution-whatsapp` — o `docker run` simples falha com *Database provider invalid*.

---

## 1 · Subir a Evolution

```bash
# Na raiz do repositório
cd evolution-whatsapp
docker compose up -d
docker ps
```

Containers esperados: `evolution_api` (8080), Postgres e Redis.

Se houver restos antigos:

```bash
docker rm -f evolution_api evolution_postgres evolution_redis 2>/dev/null
```

---

## 2 · Criar instância e QR

**POST** `http://localhost:8080/instance/create`

Headers: `Content-Type: application/json` · `apikey: casadosdiscipulos-local`  
(use a mesma chave definida no compose local)

```json
{
  "instanceName": "casadosdiscipulos",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true
}
```

**GET** `http://localhost:8080/instance/connect/casadosdiscipulos`  
Header: `apikey: casadosdiscipulos-local`

No PowerShell:

```powershell
$h = @{ "Content-Type"="application/json"; "apikey"="casadosdiscipulos-local" }
Invoke-RestMethod -Uri "http://localhost:8080/instance/create" -Method Post -Headers $h `
  -Body '{"instanceName":"casadosdiscipulos","integration":"WHATSAPP-BAILEYS","qrcode":true}'

Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/casadosdiscipulos" -Method Get `
  -Headers @{ apikey = "casadosdiscipulos-local" }
```

---

## 3 · Conectar o celular

WhatsApp → **Aparelhos conectados** → **Conectar aparelho** → escanear o QR (ou pairing code).

---

## 4 · Backend `.env`

Em `Codigo/backend/.env`:

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
EVOLUTION_API_KEY=casadosdiscipulos-local
```

Reinicie: `npm run dev`.

---

## 5 · Telefone nos usuários

Perfil do membro ou **Gerenciamento** (admin). Formatos: `(11) 99999-9999` · `11999999999`.

---

## 6 · Testar

1. Login admin → **Escala** → escalar alguém com telefone  
2. Confirmar mensagem no WhatsApp  
3. Lembrete de módulos: cron semanal (ver [WhatsApp](./WHATSAPP.md))

---

## Docker útil

| Comando | Uso |
|---------|-----|
| `docker ps` | Status |
| `docker logs evolution_api` | Logs |
| `docker compose -f evolution-whatsapp/docker-compose.yml down` | Parar stack |

---

## Problemas

| Erro | Solução |
|------|---------|
| Database provider invalid | Use o compose de `evolution-whatsapp` |
| Docker daemon | Abra o Docker Desktop |
| Porta 8080 ocupada | Mapeie outra porta e ajuste `EVOLUTION_API_URL` |
| QR expira | Gere de novo o `/instance/connect/...` |
| Sem mensagem | Instância online · telefone válido · logs backend/Evolution |

Para desligar: comente `EVOLUTION_API_URL` no `.env` e reinicie o backend.

---

<div align="center">

[Índice](./README.md)
&nbsp;·&nbsp;
[WhatsApp](./WHATSAPP.md)

<br />

<sub>Casa dos Discípulos · WhatsApp local · 2026</sub>

</div>
