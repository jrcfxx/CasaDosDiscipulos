<div align="center">

<img src="./assets/wave-banner.svg" width="100%" alt="" />

<img src="./assets/logo-glow.svg" width="110" alt="Casa dos Discípulos" />

# Relatório de custos e deploy

<img src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=600&size=22&duration=3000&pause=900&color=F4B002&center=true&vCenter=true&width=620&height=40&lines=O+que+gastar+%C2%B7+o+que+fazer+%C2%B7+por+qu%C3%AA;Para+a+lideran%C3%A7a+da+Casa" alt="" />

<img src="./assets/divider-animated.svg" width="400" alt="" />

<img src="./assets/docs-emblem.jpg" width="130" alt="" />

<br />

[Índice](./README.md) ✦ [Hospedagem](./HOSPEDAGEM.md)

</div>

---

<p align="center">
  <img src="./assets/docs-hero-banner.jpg" width="80%" alt="Banner" />
</p>

## Resumo

| Item | Aprox. | Obrigatório |
|------|--------|-------------|
| VPS 2 GB (DigitalOcean) | ~US$ 12/mês | Sim |
| Domínio | R$ 0 se já tiverem · ~R$ 40/ano se novo | Condicional |
| HTTPS (Let's Encrypt) | Grátis | Sim |
| WhatsApp (Evolution no VPS) | Sem custo extra | Se quiserem avisos |
| Código / deploy | Já no repositório | — |

**1º ano típico:** ~US$ 144 de servidor (domínio já da igreja).

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

**Fase A (igreja):** aprovar custo · confirmar domínio · criar Droplet · DNS `app` → IP · responsável pela fatura  

**Fase B (técnico):** Docker · `./deploy.sh` · seed · SSL · QR WhatsApp · testes  

**Fase C:** pagar VPS · backups · atualizações (`git pull` + `./deploy.sh`)

---

## Decisão pedida

1. Aprovar VPS mensal?  
2. Confirmar `casadosdiscipulos.org`?  
3. Nomear responsável cartão/DNS?  
4. Autorizar SSH após o Droplet?

Guia: [Hospedagem](./HOSPEDAGEM.md)

---

<div align="center">

<img src="./assets/divider-animated.svg" width="360" alt="" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:f4b002,100:02869b&height=110&section=footer" width="100%" alt="" />

</div>
