# Configurar WhatsApp no ambiente local — Casa dos Discípulos

Guia passo a passo para conectar o sistema ao WhatsApp usando a Evolution API, com tudo rodando na sua máquina (backend, banco e Evolution).

---

## Pré-requisitos

- **Docker** instalado e em execução ([Baixar Docker](https://www.docker.com/products/docker-desktop/))
- **Backend** e **frontend** do Casa dos Discípulos rodando localmente
- **WhatsApp** instalado no celular (número que será usado para enviar notificações)

---

## Passo 1: Subir a Evolution API com Docker

A Evolution API **v2** precisa de **PostgreSQL** e **Redis**. O comando simples `docker run` não funciona mais — use o **docker-compose** incluído no projeto.

### Por quê?

A Evolution API v2 armazena instâncias e mensagens em um banco de dados e usa Redis para cache. Sem isso, ela exibe o erro: *"Database provider invalid"*.

### 1.1 Remover o container antigo (se existir)

Se você tentou antes com `docker run`, remova o container que pode ter falhado:

```powershell
docker rm -f evolution_api 2>$null; docker rm -f evolution_postgres 2>$null; docker rm -f evolution_redis 2>$null
```

### 1.2 Subir com docker-compose

No terminal, na pasta do projeto:

```powershell
cd C:\Users\Júlia\OneDrive\Documentos\Projects\CasaDosDiscipulos\evolution-whatsapp
docker compose up -d
```

Isso sobe 3 containers:
- **evolution_api** (porta 8080) — a API
- **evolution_postgres** — banco PostgreSQL
- **evolution_redis** — cache Redis

### 1.3 Verificar se subiu

```powershell
docker ps
```

Os 3 containers devem estar com status "Up". A Evolution API deve responder em `http://localhost:8080`.

---

## Passo 2: Criar a instância do WhatsApp

### Opção A: Via API (Postman, Insomnia ou curl)

**2.1 Criar instância**

Envie uma requisição **POST** para:

```
http://localhost:8080/instance/create
```

**Headers:**
- `Content-Type: application/json`
- `apikey: casadosdiscipulos-local` (mesma chave do passo 1)

**Body (JSON):**

```json
{
  "instanceName": "casadosdiscipulos",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true
}
```

**2.2 Obter o QR Code**

Envie uma requisição **GET** para:

```
http://localhost:8080/instance/connect/casadosdiscipulos
```

**Headers:**
- `apikey: casadosdiscipulos-local`

A resposta traz um `code` (QR code em base64) ou `pairingCode` (código numérico para parear).

- Se vier **base64 no `code`**: converta ou use ferramenta para exibir o QR.
- Se vier **`pairingCode`**: use no celular: WhatsApp → **Aparelhos conectados** → **Conectar com número de telefone** → informe o código.

### Opção B: Via interface web (se disponível)

Algumas versões da Evolution API oferecem interface em `http://localhost:8080`. Verifique se há opção de criar instância e ver o QR Code pela tela.

### Opção C: Via curl (PowerShell)

**Criar instância:**

```powershell
$headers = @{
  "Content-Type" = "application/json"
  "apikey" = "casadosdiscipulos-local"
}
$body = '{"instanceName":"casadosdiscipulos","integration":"WHATSAPP-BAILEYS","qrcode":true}'
Invoke-RestMethod -Uri "http://localhost:8080/instance/create" -Method Post -Headers $headers -Body $body
```

**Obter QR Code:**

```powershell
$headers = @{ "apikey" = "casadosdiscipulos-local" }
Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/casadosdiscipulos" -Method Get -Headers $headers
```

---

## Passo 3: Conectar o WhatsApp no celular

1. Abra o **WhatsApp** no celular
2. Vá em **Configurações** (ou **Mais opções** → **Aparelhos conectados**)
3. Toque em **Aparelhos conectados**
4. Toque em **Conectar aparelho**
5. **Escaneie o QR Code** que apareceu no passo 2 (ou use o código numérico, se disponível)
6. Aguarde a conexão. Quando conectar, a instância ficará "online"

---

## Passo 4: Configurar o backend (.env)

No arquivo `.env` do **backend** (`Codigo/backend/.env`), adicione ou ajuste:

```env
# WhatsApp (Evolution API)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
EVOLUTION_API_KEY=casadosdiscipulos-local
```

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `EVOLUTION_API_URL` | `http://localhost:8080` | URL da Evolution API local |
| `EVOLUTION_INSTANCE_NAME` | `casadosdiscipulos` | Nome da instância criada no passo 2 |
| `EVOLUTION_API_KEY` | `casadosdiscipulos-local` | Mesma chave usada no `AUTHENTICATION_API_KEY` do Docker |

**Reinicie o backend** para carregar as variáveis:

```bash
cd Codigo/backend
npm run dev
```

---

## Passo 5: Garantir telefone nos usuários

Para receber WhatsApp, o usuário precisa ter **telefone** cadastrado.

**Opção 1 — Perfil:** O usuário acessa seu perfil e preenche o campo telefone.

**Opção 2 — Admin:** O administrador edita o usuário em **Gerir Usuários** e define o telefone.

**Formato aceito:** `(11) 99999-9999` ou `11999999999` ou `+55 11 99999-9999`

---

## Passo 6: Testar as notificações

### 6.1 Teste de escalação

1. Faça login como **admin** (ex: admin@test.com / 123456)
2. Acesse a área de **Escala** e crie ou edite um evento
3. **Escale um usuário** que tenha telefone cadastrado
4. O usuário deve receber uma mensagem no WhatsApp com o título do evento, área e data

### 6.2 Teste de módulos pendentes

O lembrete semanal roda por **cron** (ex: segundas às 9h). Para testar sem esperar:

1. Crie um usuário com telefone e sem módulos concluídos
2. Ou ajuste temporariamente o cron no código para rodar em alguns minutos (apenas para teste)

---

## Comandos úteis Docker

| Comando | Descrição |
|---------|-----------|
| `docker ps` | Listar containers (ver se Evolution está rodando) |
| `docker logs evolution_api` | Ver logs da Evolution API |
| `docker stop evolution_api` | Parar a Evolution API |
| `docker start evolution_api` | Iniciar novamente |
| `docker rm -f evolution_api` | Remover o container (dados nos volumes podem ser mantidos) |

---

## Possíveis erros

### "Database provider invalid"

- A Evolution API v2 **exige** PostgreSQL e Redis; o `docker run` simples não é suficiente
- Use o **docker-compose** na pasta `evolution-whatsapp` (Passo 1.2)

### "Cannot connect to Docker daemon"

- Docker Desktop não está aberto ou não está rodando
- Inicie o Docker Desktop e espere carregar

### Porta 8080 em uso

- Altere a porta: `-p 8081:8080` e use `EVOLUTION_API_URL=http://localhost:8081` no `.env`

### QR Code expira muito rápido

- Gere um novo: `GET /instance/connect/casadosdiscipulos`
- Escaneie logo após aparecer

### "Instance not found" ou erro 404

- Confirme que a instância `casadosdiscipulos` foi criada (Passo 2)
- Verifique se `EVOLUTION_INSTANCE_NAME` no `.env` é exatamente o mesmo nome

### Mensagens não chegam

- Confirme que o WhatsApp está conectado (instância online)
- Verifique se o número do usuário está no formato correto
- Veja os logs do backend: `[WhatsApp] Erro ao notificar...`
- Veja os logs da Evolution: `docker logs evolution_api`

---

## Desativar WhatsApp

Para desativar sem remover o código:

1. Remova ou comente no `.env` do backend:
   ```env
   # EVOLUTION_API_URL=http://localhost:8080
   ```
2. Reinicie o backend

As notificações **in-app** continuam funcionando. Apenas o envio via WhatsApp será desativado.

---

[← Voltar ao índice](./README.md)
