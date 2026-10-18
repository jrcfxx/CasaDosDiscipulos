<div align="center">

<img src="./assets/wave-banner.svg" width="100%" alt="" />

<img src="./assets/logo-glow.svg" width="110" alt="Casa dos Discípulos" />

# WhatsApp local

<img src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=600&size=22&duration=3000&pause=900&color=F4B002&center=true&vCenter=true&width=560&height=40&lines=Evolution+%2B+Docker;Na+sua+m%C3%A1quina" alt="" />

<img src="./assets/divider-animated.svg" width="400" alt="" />

<img src="./assets/docs-emblem.jpg" width="100" alt="" />

<br />

[Índice](./README.md) ✦ [WhatsApp](./WHATSAPP.md)

</div>

---

## Pré-requisitos

Docker Desktop · backend/frontend locais · WhatsApp no celular  

> Evolution v2 precisa de Postgres + Redis → use `evolution-whatsapp/docker-compose.yml`.

---

## Passos

```bash
cd evolution-whatsapp && docker compose up -d
```

1. `POST /instance/create` (apikey do compose)  
2. `GET /instance/connect/casadosdiscipulos` → QR  
3. Celular: Aparelhos conectados  
4. Backend `.env`:

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
EVOLUTION_API_KEY=casadosdiscipulos-local
```

5. Telefone no perfil · testar escala  

---

## Problemas

| Erro | Solução |
|------|---------|
| Database provider invalid | Use o compose do projeto |
| Porta 8080 | Remapeie e ajuste `.env` |
| Sem mensagem | Instância online + telefone |

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:02869b,100:0a0a0a&height=100&section=footer" width="100%" alt="" />

</div>
