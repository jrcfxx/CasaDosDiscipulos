<div align="center">

<img src="./assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# WhatsApp

Notificações via Evolution API

<img src="./assets/header-line.svg" alt="" width="200" />

<br />

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Setup local`](./CONFIGURAR_WHATSAPP_LOCAL.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Hospedagem`](./HOSPEDAGEM.md)

</div>

---

## O que é enviado

| Evento | Conteúdo |
|--------|----------|
| Escalação / alteração / remoção | Escala |
| Evento atualizado ou cancelado | Todos os escalados |
| Módulos pendentes | Lembrete semanal (segunda 9h) |

---

## Variáveis

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
EVOLUTION_API_KEY=sua-chave-segura
WHATSAPP_CRON_MODULOS=0 9 * * 1
```

Sem `EVOLUTION_API_URL`, apenas notificações in-app.

Em produção, Evolution escuta só em `127.0.0.1:8080` — ver [Hospedagem](./HOSPEDAGEM.md).

---

<div align="center">

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Setup local`](./CONFIGURAR_WHATSAPP_LOCAL.md)

</div>
