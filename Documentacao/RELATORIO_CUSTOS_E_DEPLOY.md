<div align="center">

<img src="./assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# Relatório de custos e deploy

O que gastar, o que fazer e por quê

<img src="./assets/header-line.svg" alt="" width="200" />

<br />

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Hospedagem`](./HOSPEDAGEM.md)

</div>

---

## Resumo

| Item | Aprox. | Obrigatório |
|------|--------|-------------|
| VPS 2 GB (DigitalOcean) | ~US$ 12/mês | Sim |
| Domínio | R$ 0 se já tiverem · ~R$ 40/ano se novo | Condicional |
| HTTPS (Let's Encrypt) | Grátis | Sim |
| WhatsApp (Evolution no VPS) | Sem custo extra | Se quiserem avisos |
| Código / deploy | Já no repositório | — |

**1º ano típico (domínio já da igreja):** ~US$ 144 de servidor.

---

## Por quê

| Gasto | Motivo |
|-------|--------|
| VPS 2 GB | Site + API + MySQL + WhatsApp 24h |
| Domínio | URL profissional + HTTPS |
| HTTPS | Login e dados seguros |
| Evolution | Notificações já previstas no produto |

---

## Tarefas

**Fase A — Igreja:** aprovar custo · confirmar domínio · criar Droplet · DNS `app` → IP · responsável pela fatura

**Fase B — Técnico:** Docker · `./deploy.sh` · seed · SSL · QR WhatsApp · testes

**Fase C — Contínuo:** pagar VPS · backups · `git pull` + `./deploy.sh`

---

## Decisão pedida

1. Aprovar o VPS mensal?  
2. Confirmar administração de `casadosdiscipulos.org`?  
3. Nomear responsável por cartão e DNS?  
4. Autorizar SSH após o Droplet?

Guia operacional: [Hospedagem](./HOSPEDAGEM.md)

---

<div align="center">

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Hospedagem`](./HOSPEDAGEM.md)

</div>
