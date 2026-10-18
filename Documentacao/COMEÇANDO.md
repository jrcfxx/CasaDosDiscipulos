<div align="center">

<img src="./assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# Começando

Ambiente de desenvolvimento

<img src="./assets/header-line.svg" alt="" width="200" />

<br />

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Arquitetura`](./ARQUITETURA.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Hospedagem`](./HOSPEDAGEM.md)

</div>

---

## Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8+ |
| Git | 2.x |

---

## 1. Clonar

```bash
git clone https://github.com/jrcfxx/CasaDosDiscipulos.git
cd CasaDosDiscipulos
```

---

## 2. MySQL

```sql
CREATE DATABASE CasaDosDiscipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'casadiscipulos'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON CasaDosDiscipulos.* TO 'casadiscipulos'@'localhost';
FLUSH PRIVILEGES;
```

---

## 3. Backend

```bash
cd Codigo/backend
npm install
cp .env.example .env
openssl rand -hex 32   # JWT_SECRET
npm run migrate && npm run seed && npm run dev
```

API em `http://localhost:3001` · health em `/api/health`

---

## 4. Frontend

```bash
cd Codigo/frontend
npm install
# .env → REACT_APP_API_URL=http://localhost:3001/api
npm start
```

App em `http://localhost:3000`

---

## 5. Contas seed

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@test.com | 123456 | Administrador |
| lider@test.com | 123456 | Líder |
| membro@test.com | 123456 | Membro |

---

## Problemas comuns

| Sintoma | Caminho |
|---------|---------|
| Erro MySQL | Serviço ativo + credenciais no `.env` |
| Porta ocupada | Altere `PORT` |
| CORS | Frontend `:3000` e API `:3001` |

---

<div align="center">

[`Índice`](./README.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Arquitetura →`](./ARQUITETURA.md)

</div>
