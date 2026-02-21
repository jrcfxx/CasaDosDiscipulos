# Casa dos Discípulos — Documentação

> Plataforma digital para formação, gestão de células e divulgação de eventos da comunidade cristã.

---

## Bem-vindo

Esta documentação cobre o sistema **Casa dos Discípulos** em sua totalidade: desde a instalação local até a hospedagem em produção, passando por segurança, acessibilidade e integração com WhatsApp.

---

## Índice da documentação

### Começando

| Documento | Descrição |
|-----------|-----------|
| **[Começando](./COMEÇANDO.md)** | Instalação, configuração e execução em desenvolvimento |
| **[Arquitetura](./ARQUITETURA.md)** | Visão geral técnica, stack e estrutura do projeto |

### Operação e deploy

| Documento | Descrição |
|-----------|-----------|
| **[Hospedagem](./HOSPEDAGEM.md)** | Deploy em VPS com Docker, Nginx, MySQL e Evolution API |
| **[Segurança](./SEGURANCA.md)** | Medidas de segurança, autenticação, rate limiting e checklist de produção |

### Funcionalidades

| Documento | Descrição |
|-----------|-----------|
| **[Acessibilidade](./ACESSIBILIDADE.md)** | Recursos para cegos, surdos, baixa visão e mobilidade reduzida |
| **[WhatsApp](./WHATSAPP.md)** | Notificações por WhatsApp (Evolution API) |
| **[Especificação](./ESPECIFICACAO_E_PLANO_REFATORACAO.md)** | Visão geral dos módulos e plano de refatoração |

### Referência

| Documento | Descrição |
|-----------|-----------|
| **Backend** – [Codigo/backend/README.md](../Codigo/backend/README.md) | API Node.js, rotas, comandos e testes |
| **Frontend** – [Codigo/frontend/README.md](../Codigo/frontend/README.md) | Aplicação React e scripts |

---

## Módulos do sistema

| Módulo | Público | Descrição |
|--------|---------|-----------|
| **Escola de Discípulos** | Membros e líderes | Módulos educacionais com quiz e gamificação |
| **Secretaria das Células** | Líderes e admin | Lições, formulários e relatórios semanais |
| **Eventos** | Todos | Carrossel na home e divulgação de eventos |
| **Fala Aí, Discípulo** | Todos | Devocional e palavra do dia |
| **Escala** | Líderes e admin | Calendário e escalas de ministérios |
| **Gestão** | Admin | Usuários, células, níveis e ministérios |

---

## Stack tecnológica

- **Frontend:** React 18, TypeScript, React Router
- **Backend:** Node.js, Express 5, Knex.js (MySQL)
- **Autenticação:** JWT com bcrypt
- **Notificações:** Evolution API (WhatsApp)

---

## Marca e design

- **Fonte:** Montserrat (fonte oficial da Casa dos Discípulos)
- **Cores:** Teal `#02869b`, Dourado `#f4b002`, Preto `#0a0a0a`
- **Idioma:** Português (pt-BR)

---

## Suporte e contribuição

Para dúvidas sobre instalação, configuração ou uso, consulte os documentos acima ou entre em contato com a equipe técnica do projeto.

---

*Documentação Casa dos Discípulos — Atualizada em fevereiro de 2025*
