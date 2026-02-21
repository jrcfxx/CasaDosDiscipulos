# Começando — Casa dos Discípulos

Guia para rodar o projeto em ambiente de desenvolvimento.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| **Node.js** | 18+ |
| **npm** | 9+ |
| **MySQL** | 8+ |
| **Git** | 2.x |

---

## 1. Clonar o repositório

```bash
git clone https://github.com/SEU_ORG/CasaDosDiscipulos.git
cd CasaDosDiscipulos
```

---

## 2. Banco de dados MySQL

### Criar o banco

```sql
CREATE DATABASE CasaDosDiscipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Usuário dedicado (recomendado)

```sql
CREATE USER 'casadiscipulos'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON CasaDosDiscipulos.* TO 'casadiscipulos'@'localhost';
FLUSH PRIVILEGES;
```

---

## 3. Backend (API)

### 3.1 Instalar dependências

```bash
cd Codigo/backend
npm install
```

### 3.2 Configurar variáveis de ambiente

Copie o exemplo e ajuste os valores:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=casadiscipulos
DB_PASSWORD=sua_senha
DB_NAME=CasaDosDiscipulos
JWT_SECRET=gere-uma-chave-forte-com-openssl-rand-hex-32
NODE_ENV=development
```

**Gerar JWT_SECRET:**
```bash
openssl rand -hex 32
```

### 3.3 Executar migrations

```bash
npm run migrate
```

### 3.4 Popular com dados de teste

```bash
npm run seed
```

### 3.5 Iniciar o servidor

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3001`.

---

## 4. Frontend (React)

### 4.1 Instalar dependências

```bash
cd Codigo/frontend
npm install
```

### 4.2 Configurar API

Crie `.env` no diretório do frontend:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 4.3 Iniciar a aplicação

```bash
npm start
```

A aplicação abrirá em `http://localhost:3000` (ou outra porta se 3000 estiver em uso).

---

## 5. Usuários de teste (seeds)

| Email | Senha | Tipo |
|-------|-------|------|
| admin@test.com | 123456 | administrador |
| lider@test.com | 123456 | lider |
| membro@test.com | 123456 | membro |

---

## 6. Verificar instalação

1. **Backend:** `http://localhost:3001` deve retornar `{"message":"API Casa dos Discípulos - Online"}`
2. **Frontend:** Acesse `http://localhost:3000` e faça login com um dos usuários acima
3. **Login como admin:** Acesse o portal admin e gere o conteúdo desejado

---

## 7. Estrutura de diretórios

```
CasaDosDiscipulos/
├── Codigo/
│   ├── frontend/       # React (porta 3000)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   └── style/
│   │   └── public/
│   └── backend/        # Node.js (porta 3001)
│       ├── src/
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── services/
│       │   ├── routes/
│       │   ├── middlewares/
│       │   └── validations/
│       ├── migrations/
│       └── seeds/
├── Documentacao/
└── .env (em cada subprojeto)
```

---

## 8. Comandos úteis

### Backend

```bash
npm run dev          # Desenvolvimento com hot reload
npm run migrate      # Executar migrations
npm run migrate:rollback  # Reverter última migration
npm run seed         # Popular banco
npm start            # Produção
```

### Frontend

```bash
npm start            # Desenvolvimento
npm run build        # Build para produção
```

---

## 9. Problemas comuns

### Erro de conexão com MySQL

- Verifique se o MySQL está em execução
- Confirme `DB_HOST`, `DB_USER` e `DB_PASSWORD` no `.env`
- Teste: `mysql -u casadiscipulos -p -e "USE CasaDosDiscipulos;"`

### Porta em uso

- Altere `PORT` no `.env` do backend
- No frontend, crie `.env` com `PORT=3002` para usar outra porta

### CORS no desenvolvimento

- Em desenvolvimento, CORS aceita qualquer origem
- Se houver erro de CORS, verifique se o frontend está em `http://localhost:3000` e o backend em `http://localhost:3001`

### Migrations falham

```bash
npm run migrate:rollback
npm run migrate
```

---

*Próximo passo: [Arquitetura](./ARQUITETURA.md) | [Hospedagem](./HOSPEDAGEM.md)*
