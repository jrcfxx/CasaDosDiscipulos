<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# WhatsApp

**Notificações da Casa via Evolution API**

[Índice](./README.md)
&nbsp;·&nbsp;
[Setup local](./CONFIGURAR_WHATSAPP_LOCAL.md)
&nbsp;·&nbsp;
[Hospedagem](./HOSPEDAGEM.md)

</div>

---

O sistema envia avisos automáticos pelo WhatsApp usando a **Evolution API** (open source, Baileys). Sem `EVOLUTION_API_URL`, só as notificações **in-app** continuam ativas.

---

## O que é enviado

| Evento | Conteúdo |
|--------|----------|
| Escalação | Evento, área, data, horário, detalhes |
| Atribuição alterada | Instrumento, função, observações |
| Remoção da escala | Aviso de saída do evento |
| Evento atualizado | Data, título, áreas — todos os escalados |
| Evento cancelado | Exclusão — todos os escalados |
| Módulos pendentes | Lembrete semanal (padrão: segunda 9h) |

---

## Pré-requisitos

- Evolution API em execução (Docker)  
- Telefone no perfil do usuário  
- Formatos: `(11) 99999-9999` ou `11999999999`

---

## Variáveis (backend)

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
EVOLUTION_API_KEY=sua-chave-segura
WHATSAPP_CRON_MODULOS=0 9 * * 1
```

Timezone: `America/Sao_Paulo`.

| Cron | Significado |
|------|-------------|
| `0 9 * * 1` | Segunda 9h |
| `0 10 * * 0` | Domingo 10h |
| `0 20 * * 5` | Sexta 20h |

---

## Fluxo

1. Usuário cadastra telefone no **Perfil** (ou admin em Gerenciamento)  
2. Escala / jobs disparam mensagem se a Evolution estiver configurada  
3. Falha de envio não bloqueia a operação principal do sistema  

---

## Produção

No VPS, a Evolution escuta só em `127.0.0.1:8080`. Use túnel SSH para o QR:

```bash
ssh -L 8080:127.0.0.1:8080 usuario@SEU_IP
```

Detalhes: [Hospedagem](./HOSPEDAGEM.md).

---

## Local

Guia completo: [Configurar WhatsApp local](./CONFIGURAR_WHATSAPP_LOCAL.md).

---

## Referências

- [Evolution API](https://github.com/EvolutionAPI/evolution-api)  
- [Documentação Evolution](https://doc.evolution-api.com)

---

<div align="center">

[Índice](./README.md)
&nbsp;·&nbsp;
[Setup local](./CONFIGURAR_WHATSAPP_LOCAL.md)

<br />

<sub>Casa dos Discípulos · WhatsApp · 2026</sub>

</div>
