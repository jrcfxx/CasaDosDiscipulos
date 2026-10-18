<div align="center">

<img src="./assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# WhatsApp local

Evolution API com Docker na sua máquina

<img src="./assets/header-line.svg" alt="" width="200" />

<br />

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`WhatsApp`](./WHATSAPP.md)

</div>

---

## Pré-requisitos

Docker Desktop · backend e frontend locais · WhatsApp no celular

A Evolution v2 exige Postgres e Redis — use o compose em `evolution-whatsapp/`.

---

## Passos

```bash
cd evolution-whatsapp
docker compose up -d
```

1. Criar instância: `POST /instance/create`  
2. Obter QR: `GET /instance/connect/casadosdiscipulos`  
3. Conectar no celular (Aparelhos conectados)  
4. Backend `.env`:

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
EVOLUTION_API_KEY=casadosdiscipulos-local
```

5. Cadastrar telefone no perfil e testar uma escala  

---

## Problemas

| Erro | Solução |
|------|---------|
| Database provider invalid | Use o docker-compose do projeto |
| Porta 8080 ocupada | Remapeie e ajuste o `.env` |
| Mensagem não chega | Instância online + telefone válido |

---

<div align="center">

[`Índice`](./README.md)

</div>
