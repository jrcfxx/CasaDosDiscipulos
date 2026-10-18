<div align="center">

<img src="./assets/wave-banner.svg" width="100%" alt="" />

<img src="./assets/logo-glow.svg" width="110" alt="Casa dos Discípulos" />

# Começando

<img src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=600&size=22&duration=3000&pause=900&color=F4B002&center=true&vCenter=true&width=560&height=40&lines=Ambiente+de+desenvolvimento;Node+%C2%B7+MySQL+%C2%B7+React+%C2%B7+API" alt="" />

<img src="./assets/divider-animated.svg" width="400" alt="" />

<img src="./assets/docs-emblem.jpg" width="100" alt="" />

<br />

[Índice](./README.md) ✦ [Arquitetura](./ARQUITETURA.md) ✦ [Hospedagem](./HOSPEDAGEM.md)

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

## 1 · Clonar

```bash
git clone https://github.com/jrcfxx/CasaDosDiscipulos.git
cd CasaDosDiscipulos
```

---

## 2 · MySQL

```sql
CREATE DATABASE CasaDosDiscipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'casadiscipulos'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON CasaDosDiscipulos.* TO 'casadiscipulos'@'localhost';
FLUSH PRIVILEGES;
```

---

## 3 · Backend

```bash
cd Codigo/backend
npm install
cp .env.example .env
openssl rand -hex 32   # JWT_SECRET
npm run migrate && npm run seed && npm run dev
```

API: `http://localhost:3001` · health: `/api/health`

---

## 4 · Frontend

```bash
cd Codigo/frontend
npm install
# .env → REACT_APP_API_URL=http://localhost:3001/api
npm start
```

App: `http://localhost:3000`

---

## 5 · Contas seed

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@test.com | 123456 | Administrador |
| lider@test.com | 123456 | Líder |
| membro@test.com | 123456 | Membro |

---

## Estrutura

```
CasaDosDiscipulos/
├── Codigo/frontend · Codigo/backend
├── Documentacao/ · assets artísticos
├── deploy/ · evolution-whatsapp/
```

---

## Problemas comuns

| Sintoma | Caminho |
|---------|---------|
| Erro MySQL | Serviço + `.env` |
| Porta ocupada | Troque `PORT` |
| CORS | `:3000` ↔ `:3001` |

---

<div align="center">

<img src="./assets/divider-animated.svg" width="360" alt="" />

[Índice](./README.md) · [Arquitetura →](./ARQUITETURA.md)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:02869b,100:f4b002&height=100&section=footer" width="100%" alt="" />

</div>
