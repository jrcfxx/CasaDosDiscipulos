<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="72" />

# Casa dos Discípulos

### Documentação

Plataforma digital para formação, células, escala e comunhão da comunidade cristã.

[![Teal](https://img.shields.io/badge/Teal-%2302869b?style=flat-square)](#marca)
[![Dourado](https://img.shields.io/badge/Dourado-%23f4b002?style=flat-square)](#marca)
[![Montserrat](https://img.shields.io/badge/Fonte-Montserrat-0a0a0a?style=flat-square)](#marca)
[![pt-BR](https://img.shields.io/badge/Idioma-pt--BR-02869b?style=flat-square)](#marca)

<br />

[Começando](./COMEÇANDO.md)
&nbsp;·&nbsp;
[Arquitetura](./ARQUITETURA.md)
&nbsp;·&nbsp;
[Hospedagem](./HOSPEDAGEM.md)
&nbsp;·&nbsp;
[Custos](./RELATORIO_CUSTOS_E_DEPLOY.md)
&nbsp;·&nbsp;
[Segurança](./SEGURANCA.md)

</div>

---

## Bem-vindo

Esta documentação cobre o sistema **Casa dos Discípulos** de ponta a ponta: desenvolvimento local, arquitetura, produção, segurança, acessibilidade e WhatsApp — no mesmo tom visual do portal (teal, dourado e Montserrat).

---

## Navegação

### Começar

| Documento | Descrição |
|-----------|-----------|
| [Começando](./COMEÇANDO.md) | Instalar, configurar e rodar em desenvolvimento |
| [Arquitetura](./ARQUITETURA.md) | Stack, pastas e fluxo de dados |

### Operação

| Documento | Descrição |
|-----------|-----------|
| [Hospedagem](./HOSPEDAGEM.md) | Deploy do zero: VPS, domínio, Docker, HTTPS |
| [Relatório de custos](./RELATORIO_CUSTOS_E_DEPLOY.md) | Gastos, tarefas e porquês (para liderança) |
| [Segurança](./SEGURANCA.md) | Auth, rate limit e checklist de produção |

### Produto

| Documento | Descrição |
|-----------|-----------|
| [Acessibilidade](./ACESSIBILIDADE.md) | WCAG 2.1 e recursos inclusivos |
| [WhatsApp](./WHATSAPP.md) | Notificações via Evolution API |
| [WhatsApp local](./CONFIGURAR_WHATSAPP_LOCAL.md) | Conectar Evolution na máquina de desenvolvimento |
| [Especificação](./ESPECIFICACAO_E_PLANO_REFATORACAO.md) | Módulos e histórico de evolução do sistema |

### Código

| Documento | Descrição |
|-----------|-----------|
| [Backend](../Codigo/backend/README.md) | API Node.js, rotas e seeds |
| [Frontend](../Codigo/frontend/README.md) | React, scripts e tokens de marca |

---

## Módulos

| Módulo | Quem usa | Propósito |
|--------|----------|-----------|
| **Escola de Discípulos** | Membros e líderes | Módulos, quizzes e ranking |
| **Secretaria das Células** | Líderes e admin | Lições, formulários e relatórios |
| **Eventos** | Todos | Carrossel e divulgação |
| **Fala Aí, Discípulo** | Todos | Devocional e palavra do dia |
| **Escala** | Líderes e admin | Ministérios, calendário e avisos |
| **Gestão** | Admin | Usuários, células, níveis e ministérios |

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 18 · TypeScript · React Router 6 |
| Backend | Node.js · Express 5 · Knex · MySQL 8 |
| Auth | JWT · bcrypt · Helmet · rate limit |
| Notificações | Evolution API (WhatsApp) |
| Produção | Docker · Nginx · Let's Encrypt |

---

## Marca

Identidade alinhada ao portal e à comunicação da Casa.

| Token | Valor | Uso |
|-------|-------|-----|
| Teal | `#02869b` | Primária, links, CTAs |
| Dourado | `#f4b002` | Destaque e acentos |
| Preto | `#0a0a0a` | Texto e fundos fortes |
| Claro | `#ebebeb` | Superfícies claras |
| Fonte | **Montserrat** | Interface e títulos |
| Idioma | Português (pt-BR) | Toda a experiência |

---

## Caminhos rápidos

| Objetivo | Comece em |
|----------|-----------|
| Rodar na minha máquina | [Começando](./COMEÇANDO.md) |
| Entender o sistema | [Arquitetura](./ARQUITETURA.md) |
| Colocar no ar | [Hospedagem](./HOSPEDAGEM.md) |
| Aprovar orçamento | [Relatório de custos](./RELATORIO_CUSTOS_E_DEPLOY.md) |

---

<div align="center">

<sub>Casa dos Discípulos · Documentação · Outubro 2026</sub>

</div>
