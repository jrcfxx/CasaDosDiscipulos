<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Relatório de custos e deploy

**O que gastar, o que fazer e por quê — para a liderança**

[Índice](./README.md)
&nbsp;·&nbsp;
[Hospedagem](./HOSPEDAGEM.md)

</div>

---

## Resumo

| Item | Aprox. | Obrigatório |
|------|--------|-------------|
| VPS 2 GB (DigitalOcean) | ~US$ 12/mês | Sim |
| Domínio | R$ 0 se já tiverem `casadosdiscipulos.org` · ~R$ 40/ano se novo | Condicional |
| HTTPS (Let's Encrypt) | Grátis | Sim |
| WhatsApp (Evolution no VPS) | Sem custo extra | Se quiserem avisos |
| Código / pipeline de deploy | Já no repositório | — |

**1º ano típico (domínio já da igreja):** ~US$ 144 de servidor.

---

## Por quê cada gasto

### Servidor (VPS)

Máquina 24h para site + API + MySQL + WhatsApp.  
**2 GB** evita lentidão com Evolution + banco juntos.  
Não substituir por “PC da igreja ligado” nem só Vercel (não cobre MySQL + uploads + WhatsApp neste desenho).

### Domínio

URL memorável e HTTPS profissional. Preferir subdomínio `app` no domínio que a igreja **já usa** nos e-mails `@casadosdiscipulos.org`.

### HTTPS

Login e dados de membros exigem conexão cifrada. Let's Encrypt é gratuito.

### WhatsApp

Integração já existe no código; Evolution roda no mesmo VPS. Precisa de número e um QR Code inicial.

---

## Tarefas

### Fase A — Só a igreja

1. Aprovar ~US$ 12/mês  
2. Confirmar quem administra o domínio  
3. Criar conta + Droplet (Ubuntu 22.04, 2 GB)  
4. DNS **A** `app` → IP  
5. Indicar responsável pela fatura  

### Fase B — Técnico (com SSH)

1. Docker + clone + `.env`  
2. `./deploy.sh` + seed  
3. Certbot + SSL  
4. QR WhatsApp via túnel SSH  
5. Teste de login e fluxos  

### Fase C — Contínuo

Pagar VPS · renovar domínio · backups · `git pull` + `./deploy.sh` nas atualizações.

---

## O que a equipe técnica pode / não pode

| Pode | Não pode |
|------|----------|
| Preparar deploy e guias | Criar conta com cartão da igreja |
| Subir stack com IP + SSH | Comprar domínio sem login DNS |
| Diagnosticar logs | Ser titular do servidor |

---

## Decisão pedida

1. Aprovar o VPS mensal?  
2. Confirmar domínio `casadosdiscipulos.org`?  
3. Nomear responsável por cartão e DNS?  
4. Após o Droplet, autorizar acesso SSH para concluir o deploy?

Guia operacional: [Hospedagem](./HOSPEDAGEM.md).

---

<div align="center">

[Índice](./README.md)
&nbsp;·&nbsp;
[Hospedagem](./HOSPEDAGEM.md)

<br />

<sub>Casa dos Discípulos · Relatório · Outubro 2026</sub>

</div>
