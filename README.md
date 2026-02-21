<div align="center">

<img src="Codigo/frontend/src/assets/icone-igreja.png" alt="Casa dos Discípulos" width="140" />

# Casa dos Discípulos

### Plataforma digital para formação, gestão de células e divulgação de eventos da comunidade cristã

[![React](https://img.shields.io/badge/React-18+-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-4479a1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

*Formação · Células · Eventos · Escala · WhatsApp · Acessibilidade*

</div>

---

## 📋 Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Módulos do sistema](#-módulos-do-sistema)
- [Stack tecnológica](#-stack-tecnológica)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Comandos úteis](#-comandos-úteis)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Deploy](#-deploy)
- [Documentação](#-documentação)
- [Contato](#-contato)

---

## 🎯 Sobre o projeto

**Casa dos Discípulos** é uma plataforma web moderna desenvolvida para centralizar a gestão, formação e engajamento de comunidades cristãs. O sistema resolve o desafio da dispersão de materiais, controles manuais e processos informais, oferecendo uma experiência estruturada e acessível tanto para administradores quanto para discípulos.

### O que este projeto oferece

| Diferencial | Descrição |
|-------------|-----------|
| **Tudo em um lugar** | Cursos, lições, formulários, eventos e escala integrados em uma única plataforma |
| **Formação gamificada** | Escola de Discípulos com módulos progressivos, quizzes e ranking de pontuação |
| **Secretaria digital** | Formulários dinâmicos criados pelo admin, relatórios semanais por célula |
| **Engajamento via WhatsApp** | Notificações automáticas de escalação, lembretes de módulos pendentes |
| **Acessibilidade WCAG 2.1** | Skip Link, alto contraste, ajuste de tamanho de texto, navegação por teclado |
| **Segurança** | JWT, bcrypt, Helmet, rate limiting, validação com Joi |

---

## ✨ Funcionalidades

<div align="center">

| Autenticação | Escola de Discípulos | Secretaria | Eventos | Escala | Extras |
|:------------:|:--------------------:|:----------:|:-------:|:------:|:------:|
| Login/Registro | Módulos + Quizzes | Lições + Formulários | Carrossel home | Calendário .ics | WhatsApp |
| JWT + bcrypt | Gamificação | Campos dinâmicos | CRUD | Notificações | Upload |
| Roles (admin/líder/membro) | Ranking | Relatórios por célula | Divulgação | Ministérios | A11y |

</div>

### Detalhamento

- **Autenticação segura** — JWT com refresh, bcrypt para senhas, registro público apenas para membros
- **Escola de Discípulos** — Módulos educacionais com ordem definida, quizzes opcionais, pontuação e ranking
- **Secretaria das Células** — Lições com textos, vídeos e PDFs; formulários com campos configuráveis (texto, textarea, número, data, link, upload)
- **Eventos** — Carrossel na home com próximos eventos e informações importantes
- **Fala Aí, Discípulo** — Devocional e palavra do dia
- **Escala** — Calendário de ministérios, escalação por área, exportação .ics, notificações WhatsApp
- **Gestão completa** — Usuários, células, níveis, ministérios; painel admin com visão de dashboards
- **Acessibilidade** — Skip Link, barra de ajustes (tamanho de texto, alto contraste), suporte a leitores de tela

---

## 🧩 Módulos do sistema

| Módulo | Público | O que faz |
|--------|---------|-----------|
| **Escola de Discípulos** | Membros e líderes | Estudo de módulos, quizzes gamificados, ranking |
| **Secretaria das Células** | Líderes e admin | Lições para download, formulários e relatórios semanais |
| **Eventos** | Todos | Carrossel com próximos eventos e divulgação |
| **Fala Aí, Discípulo** | Todos | Devocional e palavra do dia |
| **Escala** | Líderes e admin | Calendário, escalas de ministérios, notificações |
| **Gestão** | Admin | CRUD de usuários, células, níveis, ministérios |

---

## 🚀 Stack tecnológica

<table>
<tr>
<td width="50%">

**Frontend**

- React 18
- TypeScript
- React Router 6
- Axios (interceptors JWT)
- CSS Modules + tokens (Montserrat, teal #02869b, dourado #f4b002)
- @axe-core/react (acessibilidade em dev)

</td>
<td width="50%">

**Backend**

- Node.js 18+
- Express 5
- Knex.js (MySQL 8)
- JWT + bcrypt
- Joi (validação)
- Helmet, CORS, express-rate-limit

</td>
</tr>
</table>

---

## 📦 Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8+ |
| Git | 2.x |

---

## 🛠️ Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU_ORG/CasaDosDiscipulos.git
cd CasaDosDiscipulos
```

### 2. Banco de dados

```sql
CREATE DATABASE CasaDosDiscipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend

```bash
cd Codigo/backend
npm install
cp .env.example .env
# Edite o .env (veja seção Configuração)
npm run migrate
npm run seed
npm run dev
```

API em: `http://localhost:3001`

### 4. Frontend

```bash
cd Codigo/frontend
npm install
# Crie o .env com REACT_APP_API_URL (veja seção Configuração)
npm start
```

Aplicação em: `http://localhost:3000`

### 5. Usuários de teste

| Email | Senha | Tipo |
|-------|-------|------|
| admin@test.com | 123456 | administrador |
| lider@test.com | 123456 | lider |
| membro@test.com | 123456 | membro |

---

## ⚙️ Configuração

### Backend (`Codigo/backend/.env`)

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=casadiscipulos
DB_PASSWORD=sua_senha_segura
DB_NAME=CasaDosDiscipulos
JWT_SECRET=minimo_32_caracteres_aleatorios_seguros
NODE_ENV=development

# Opcional: WhatsApp (Evolution API)
# EVOLUTION_API_URL=http://localhost:8080
# EVOLUTION_INSTANCE_NAME=casadosdiscipulos
# EVOLUTION_API_KEY=sua-chave

# Opcional: Rate limit (padrão 300 req/15min)
# RATE_LIMIT_MAX=300
```

**Gerar JWT_SECRET:**
```bash
openssl rand -hex 32
```

### Frontend (`Codigo/frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:3001/api
```

---

## 📌 Comandos úteis

| Contexto | Comando | Descrição |
|----------|---------|-----------|
| Backend | `npm run dev` | Desenvolvimento com hot reload |
| Backend | `npm run migrate` | Executar migrations |
| Backend | `npm run migrate:rollback` | Reverter última migration |
| Backend | `npm run seed` | Popular banco com dados de teste |
| Frontend | `npm start` | Desenvolvimento |
| Frontend | `npm run build` | Build para produção |

---

## 🏗️ Estrutura do projeto

```
CasaDosDiscipulos/
├── Codigo/
│   ├── backend/                 # API Node.js
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   ├── middlewares/
│   │   │   ├── validations/
│   │   │   └── migrations/
│   │   └── seeds/
│   └── frontend/                # React SPA
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── hooks/
│       │   ├── contexts/
│       │   └── style/
│       └── public/
├── Documentacao/               # Documentação completa
├── Artefatos/                  # Wireframes, diagramas
├── evolution-whatsapp/         # Docker Evolution API (opcional)
└── deploy/                     # Docker para produção
```

---

## 🚢 Deploy

A aplicação pode ser hospedada em VPS com Docker. Requisitos:

- Docker e Docker Compose
- Nginx (proxy reverso)
- MySQL 8
- HTTPS (Let's Encrypt recomendado)

**Guia completo:** [Documentacao/HOSPEDAGEM.md](Documentacao/HOSPEDAGEM.md)

---

## 📚 Documentação

| Documento | Conteúdo |
|-----------|----------|
| [**Começando**](Documentacao/COMEÇANDO.md) | Instalação passo a passo, troubleshooting |
| [**Arquitetura**](Documentacao/ARQUITETURA.md) | Stack, estrutura, fluxos de dados |
| [**Hospedagem**](Documentacao/HOSPEDAGEM.md) | Deploy em VPS com Docker |
| [**Segurança**](Documentacao/SEGURANCA.md) | JWT, CORS, rate limit, checklist |
| [**Acessibilidade**](Documentacao/ACESSIBILIDADE.md) | WCAG 2.1, recursos inclusivos |
| [**WhatsApp**](Documentacao/WHATSAPP.md) | Evolution API, notificações |
| [**Índice completo**](Documentacao/README.md) | Todos os documentos |

---

## 🏛️ Contexto

O projeto nasceu da necessidade da **Casa dos Discípulos** de centralizar materiais de formação (cursos, módulos, lições, quizzes) e acompanhamento de células que estavam dispersos entre arquivos, mensagens e controles manuais. A plataforma oferece organização, autonomia e uma experiência estruturada para toda a comunidade.

---

## 👤 Contato

**Júlia Rocha Fiorini**

| | |
|---|---|
| 📧 | [juliarochafiorini@gmail.com](mailto:juliarochafiorini@gmail.com) |
| 💻 | [GitHub @jrcfxx](https://github.com/jrcfxx) |
| 🔗 | [LinkedIn](https://www.linkedin.com/in/julia-rocha-fiorini/) |

---

<div align="center">

**PUC Minas · ICEI · Engenharia de Software · 2025**

*Casa dos Discípulos — Plataforma de gestão e formação para igrejas*

</div>
