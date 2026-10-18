<div align="center">

<img src="Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="88" />

# Casa dos Discípulos

### Plataforma digital para formação, células e comunhão

[![React](https://img.shields.io/badge/React-18-02869b?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-0a0a0a?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479a1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Teal](https://img.shields.io/badge/Marca-%2302869b_teal-02869b?style=flat-square)](Documentacao/README.md)
[![Dourado](https://img.shields.io/badge/Marca-%23f4b002_dourado-f4b002?style=flat-square)](Documentacao/README.md)

Formação · Células · Escala · Eventos · WhatsApp · Acessibilidade

<br />

[Documentação](Documentacao/README.md)
&nbsp;·&nbsp;
[Começando](Documentacao/COMEÇANDO.md)
&nbsp;·&nbsp;
[Hospedagem](Documentacao/HOSPEDAGEM.md)
&nbsp;·&nbsp;
[Custos](Documentacao/RELATORIO_CUSTOS_E_DEPLOY.md)

</div>

---

## Sobre

A **Casa dos Discípulos** centraliza formação, gestão de células e engajamento da comunidade cristã — com a mesma identidade do portal: **Montserrat**, teal `#02869b` e dourado `#f4b002`.

| Diferencial | Descrição |
|-------------|-----------|
| Tudo em um lugar | Cursos, lições, formulários, eventos e escala |
| Formação gamificada | Módulos, quizzes e ranking |
| Secretaria digital | Formulários dinâmicos e relatórios por célula |
| WhatsApp | Avisos de escala e lembretes de módulos |
| Acessibilidade | WCAG 2.1 · teclado · leitores de tela |
| Segurança | JWT · bcrypt · Helmet · rate limit · Joi |

---

## Módulos

| Módulo | Público | Função |
|--------|---------|--------|
| Escola de Discípulos | Membros e líderes | Estudo, quiz, ranking |
| Secretaria das Células | Líderes e admin | Lições e formulários |
| Eventos | Todos | Carrossel e divulgação |
| Fala Aí, Discípulo | Autenticados | Devocional |
| Escala | Líderes e admin | Ministérios e calendário |
| Gestão | Admin | Usuários, células, níveis |

---

## Stack

| Frontend | Backend |
|----------|---------|
| React 18 · TypeScript | Node.js · Express 5 |
| React Router 6 · Axios | Knex · MySQL 8 |
| Tokens CSS · Montserrat | JWT · bcrypt · Joi · Helmet |

Produção: Docker · Nginx · Let's Encrypt · Evolution API.

---

## Instalação rápida

```bash
git clone https://github.com/jrcfxx/CasaDosDiscipulos.git
cd CasaDosDiscipulos
```

**MySQL**

```sql
CREATE DATABASE CasaDosDiscipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Backend**

```bash
cd Codigo/backend
npm install && cp .env.example .env
# edite DB_* e JWT_SECRET (openssl rand -hex 32)
npm run migrate && npm run seed && npm run dev
```

**Frontend**

```bash
cd Codigo/frontend
npm install
# .env → REACT_APP_API_URL=http://localhost:3001/api
npm start
```

| Conta seed | Senha | Papel |
|------------|-------|-------|
| admin@test.com | 123456 | administrador |
| lider@test.com | 123456 | lider |
| membro@test.com | 123456 | membro |

Guia completo: [Documentacao/COMEÇANDO.md](Documentacao/COMEÇANDO.md).

---

## Deploy

```bash
cd deploy
cp .env.example .env   # senhas e DOMAIN
./deploy.sh
```

Do zero (VPS + domínio + SSL): [Hospedagem](Documentacao/HOSPEDAGEM.md) · [Custos](Documentacao/RELATORIO_CUSTOS_E_DEPLOY.md).

---

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [Índice](Documentacao/README.md) | Portal da documentação |
| [Começando](Documentacao/COMEÇANDO.md) | Dev local |
| [Arquitetura](Documentacao/ARQUITETURA.md) | Desenho técnico |
| [Hospedagem](Documentacao/HOSPEDAGEM.md) | Produção |
| [Custos](Documentacao/RELATORIO_CUSTOS_E_DEPLOY.md) | Orçamento para liderança |
| [Segurança](Documentacao/SEGURANCA.md) | Checklist |
| [Acessibilidade](Documentacao/ACESSIBILIDADE.md) | Inclusão |
| [WhatsApp](Documentacao/WHATSAPP.md) | Notificações |

---

## Contato

**Júlia Rocha Fiorini**

| | |
|--|--|
| E-mail | [juliarochafiorini@gmail.com](mailto:juliarochafiorini@gmail.com) |
| GitHub | [@jrcfxx](https://github.com/jrcfxx) |
| LinkedIn | [julia-rocha-fiorini](https://www.linkedin.com/in/julia-rocha-fiorini/) |

---

<div align="center">

<sub>PUC Minas · ICEI · Engenharia de Software</sub>

<br />

**Casa dos Discípulos** · Teal `#02869b` · Dourado `#f4b002` · Montserrat

</div>
