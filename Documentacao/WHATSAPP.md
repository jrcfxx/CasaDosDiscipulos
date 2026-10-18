<div align="center">

<img src="./assets/wave-banner.svg" width="100%" alt="" />

<img src="./assets/logo-glow.svg" width="110" alt="Casa dos Discípulos" />

# WhatsApp

<img src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=600&size=22&duration=3000&pause=900&color=02869B&center=true&vCenter=true&width=560&height=40&lines=Notifica%C3%A7%C3%B5es+da+Casa;Evolution+API+%C2%B7+Baileys" alt="" />

<img src="./assets/divider-animated.svg" width="400" alt="" />

<img src="./assets/docs-emblem.jpg" width="110" alt="" />

<br />

[Índice](./README.md) ✦ [Setup local](./CONFIGURAR_WHATSAPP_LOCAL.md) ✦ [Hospedagem](./HOSPEDAGEM.md)

</div>

---

## O que é enviado

| Evento | Conteúdo |
|--------|----------|
| Escalação / atualização / remoção | Escala |
| Evento alterado ou cancelado | Todos os escalados |
| Módulos pendentes | Lembrete semanal (seg 9h) |

---

## Variáveis

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
EVOLUTION_API_KEY=sua-chave-segura
WHATSAPP_CRON_MODULOS=0 9 * * 1
```

Sem `EVOLUTION_API_URL`, só notificações in-app.

Produção: túnel SSH para `127.0.0.1:8080` — ver [Hospedagem](./HOSPEDAGEM.md).

---

<div align="center">

<img src="./assets/divider-animated.svg" width="360" alt="" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:025c6b,100:02869b&height=100&section=footer" width="100%" alt="" />

</div>
