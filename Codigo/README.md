# Casa dos Discípulos — Código

> Aplicação web para formação, células e eventos da comunidade cristã.

---

## Estrutura do projeto

```
Codigo/
├── frontend/          # Aplicação React (SPA)
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas/rotas
│   │   ├── services/      # Chamadas à API
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── contexts/      # Context API (Auth, etc.)
│   │   └── utils/         # Utilitários
│   └── public/
├── backend/           # API Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── validations/
│   │   └── migrations/
│   └── knexfile.cjs
└── README.md
```

---

## Começar rapidamente

### 1. Pré-requisitos

- **Node.js** 18+
- **MySQL** 8+
- **Git**

### 2. Banco de dados

```sql
CREATE DATABASE CasaDosDiscipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais
npm install
npm run migrate
npm run seed
npm run dev
```

API em: `http://localhost:3001`

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:3001 (ou /api em produção)
npm install
npm start
```

App em: `http://localhost:3000`

---

## Documentação completa

| Documento | Conteúdo |
|-----------|----------|
| **[Começando](../Documentacao/COMEÇANDO.md)** | Guia completo de instalação e configuração |
| **[Arquitetura](../Documentacao/ARQUITETURA.md)** | Stack, estrutura e fluxos |
| **[Backend](./backend/README.md)** | API, rotas, comandos |
| **[Frontend](./frontend/README.md)** | React, componentes, scripts |

---

## Marca e design

- **Fonte:** Montserrat (oficial da Casa dos Discípulos)
- **Cores:** Teal `#02869b`, Dourado `#f4b002`

---

*[Voltar à documentação principal](../Documentacao/README.md)*
