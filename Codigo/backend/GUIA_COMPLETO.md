# 📚 Guia Completo - Backend Casa dos Discípulos

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Como Rodar o Backend](#como-rodar-o-backend)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Rotas da API](#rotas-da-api)
6. [Testes no Postman](#testes-no-postman)
7. [Fluxos Completos](#fluxos-completos)

---

## 🔧 Pré-requisitos

### Software Necessário:

- **Node.js**: versão 16+ ([Download](https://nodejs.org/))
- **MySQL**: versão 8+ ([Download](https://dev.mysql.com/downloads/))
- **Postman**: ([Download](https://www.postman.com/downloads/))
- **Git**: ([Download](https://git-scm.com/downloads))

### Verificar Instalação:

```bash
node --version    # Deve mostrar v16.x ou superior
npm --version     # Deve mostrar 8.x ou superior
mysql --version   # Deve mostrar MySQL 8.x
```

---

## ⚙️ Configuração Inicial

### 1. Clone o Repositório

```bash
git clone https://github.com/ICEI-PUC-Minas-PMGES-TI/pmg-es-2025-2-ti3-9577100-casadosdiscipulos.git
cd pmg-es-2025-2-ti3-9577100-casadosdiscipulos/Codigo/backend
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Banco de Dados MySQL

#### 3.1. Inicie o MySQL

```bash
# Windows (se instalado como serviço)
net start MySQL80

# Ou acesse pelo MySQL Workbench
```

#### 3.2. Crie o Banco de Dados

```sql
CREATE DATABASE casa_dos_discipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Opcional: Criar usuário específico
CREATE USER 'casa_user'@'localhost' IDENTIFIED BY 'senha123';
GRANT ALL PRIVILEGES ON casa_dos_discipulos.* TO 'casa_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Arquivo: backend/.env

# Porta do servidor
PORT=3001

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=casa_dos_discipulos

# JWT Secret (use uma string aleatória forte)
JWT_SECRET=seu_secret_jwt_super_seguro_aqui_123456

# Ambiente
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Substitua `sua_senha_aqui` pela senha do seu MySQL!

### 5. Execute as Migrations

As migrations criam todas as tabelas no banco de dados:

```bash
npm run migrate
```

Você deve ver algo como:

```
Batch 1 run: 15 migrations
✓ 20250916002535_create_usuario_table.cjs
✓ 20250916002536_create_campo_personalizado_table.cjs
✓ 20250916002537_create_quiz_table.cjs
...
```

### 6. Popule o Banco com Dados de Teste (Seeds)

```bash
npm run seed
```

Você verá:

```
🌱 Iniciando seeders...

✓ Usuarios seed inseridos!
✓ Campos personalizados inseridos com sucesso!
✓ Células inseridas com sucesso!
...

✅ Todos os seeders executados com sucesso!
```

---

## 🚀 Como Rodar o Backend

### Modo Desenvolvimento (com hot reload)

```bash
npm run dev
```

Você verá:

```
🚀 Servidor rodando na porta 3001
```

### Modo Produção

```bash
npm start
```

### Testar se está funcionando

Acesse no navegador ou Postman:

```
GET http://localhost:3001/
```

Resposta esperada:

```json
{
  "message": "API Casa dos Discípulos - Online ✓"
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### **1. usuario**

Armazena todos os usuários do sistema.

```sql
- id_usuario (PK)
- nome
- email (único)
- senha (hash bcrypt)
- tipo (administrador | lider | membro)
- pontuacao (gamificação)
- ativo (boolean)
```

#### **2. celula**

Células da igreja lideradas por líderes.

```sql
- id_celula (PK)
- nome
- endereco
- dia_reuniao
- horario_reuniao
- id_lider (FK → usuario)
- ativa (boolean)
```

#### **3. campo_personalizado**

Tipos de campos reutilizáveis (texto, número, data, link, upload, múltipla escolha, etc).

```sql
- id_campo (PK)
- tipo_campo (texto | numero | data | link | upload | multipla_escolha | verdadeiro_falso | discursiva)
```

### Módulo Escola de Discípulos

#### **4. modulo**

Módulos de ensino para membros.

```sql
- id_modulo (PK)
- titulo
- descricao
- ordem
- ativo
```

#### **5. modulo_campo**

Conteúdo dos módulos (textos, vídeos, links).

```sql
- id (PK)
- id_modulo (FK)
- id_campo (FK)
- label
- conteudo
- ordem
```

#### **6. quiz**

Avaliações dos módulos.

```sql
- id_quiz (PK)
- id_modulo (FK)
- titulo
- descricao
- ativo
```

#### **7. quiz_questao**

Questões dos quizzes.

```sql
- id_questao (PK)
- id_quiz (FK)
- tipo_questao (multipla_escolha | verdadeiro_falso | discursiva)
- enunciado
- pontos
- ordem
- opcoes (JSON)
- resposta_correta
```

#### **8. quiz_resposta**

Respostas dos usuários aos quizzes.

```sql
- id_resposta (PK)
- id_questao (FK)
- id_usuario (FK)
- resposta
- correta (boolean)
- pontos_obtidos
- respondido_em
```

#### **9. usuario_modulo**

Progresso dos usuários nos módulos.

```sql
- id_usuario_modulo (PK)
- id_usuario (FK)
- id_modulo (FK)
- status (nao_iniciado | em_andamento | concluido)
- nota_quiz
- data_inicio
- data_conclusao
```

### Módulo Secretaria das Células

#### **10. licao**

Lições para líderes de células.

```sql
- id_licao (PK)
- titulo
- descricao
- ordem
- ativa
```

#### **11. licao_campo**

Conteúdo das lições.

```sql
- id (PK)
- id_licao (FK)
- id_campo (FK)
- label
- conteudo
- ordem
```

#### **12. formulario**

Formulários para líderes preencherem.

```sql
- id_formulario (PK)
- titulo
- descricao
- ativo
```

#### **13. formulario_campo**

Campos dos formulários.

```sql
- id (PK)
- id_formulario (FK)
- id_campo (FK)
- label
- conteudo
- ordem
- obrigatorio
```

#### **14. formulario_resposta**

Respostas dos líderes aos formulários.

```sql
- id_resposta (PK)
- id_formulario (FK)
- id_celula (FK)
- data_resposta
```

#### **15. formulario_resposta_campo**

Valores preenchidos em cada campo.

```sql
- id_resposta_campo (PK)
- id_resposta (FK)
- id_formulario_campo (FK)
- valor
```

---

## 🛣️ Rotas da API

Base URL: `http://localhost:3001/api`

### 🔐 Autenticação

#### **POST /api/auth/register**

Cadastrar novo usuário

**Body:**

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "senha123",
  "tipo": "membro"
}
```

**Response 201:**

```json
{
  "message": "Usuário criado com sucesso",
  "usuario": {
    "id_usuario": 4,
    "nome": "João Silva",
    "email": "joao@email.com",
    "tipo": "membro"
  }
}
```

#### **POST /api/auth/login**

Fazer login

**Body:**

```json
{
  "email": "admin@test.com",
  "senha": "123456"
}
```

**Response 200:**

```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id_usuario": 1,
    "nome": "Admin Teste",
    "email": "admin@test.com",
    "tipo": "administrador"
  }
}
```

**⚠️ IMPORTANTE:** Copie o `token` retornado! Você precisará dele nas próximas requisições.

---

### 👥 Usuários

**🔒 Todas as rotas de usuários requerem autenticação**

Para adicionar autenticação no Postman:

1. Vá em **Headers**
2. Adicione: `Authorization: Bearer SEU_TOKEN_AQUI`

#### **GET /api/usuarios**

Lista todos os usuários (apenas admin)

**Headers:**

```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response 200:**

```json
[
  {
    "id_usuario": 1,
    "nome": "Admin Teste",
    "email": "admin@test.com",
    "tipo": "administrador",
    "pontuacao": 0,
    "ativo": true
  },
  ...
]
```

#### **GET /api/usuarios/:id**

Busca usuário por ID

**Exemplo:** `GET /api/usuarios/1`

#### **PUT /api/usuarios/:id**

Atualiza usuário

**Body:**

```json
{
  "nome": "João Silva Atualizado",
  "pontuacao": 150
}
```

#### **DELETE /api/usuarios/:id**

Remove usuário (apenas admin)

#### **PATCH /api/usuarios/:id/toggle**

Ativa/desativa usuário

---

### 📚 Módulos (Escola de Discípulos)

#### **GET /api/modulo**

Lista todos os módulos

**Response 200:**

```json
[
  {
    "id_modulo": 1,
    "titulo": "Fundamentos da Fé",
    "descricao": "Aprenda os conceitos básicos",
    "ordem": 1,
    "ativo": true
  }
]
```

#### **GET /api/modulo/:id**

Busca módulo por ID (com conteúdo)

**Exemplo:** `GET /api/modulo/1`

**Response 200:**

```json
{
  "id_modulo": 1,
  "titulo": "Fundamentos da Fé",
  "descricao": "...",
  "ordem": 1,
  "ativo": true,
  "campos": [
    {
      "label": "Introdução",
      "conteudo": "Bem-vindo ao primeiro módulo!",
      "tipo_campo": "texto"
    }
  ]
}
```

#### **POST /api/modulo** 🔒 (Admin)

Cria novo módulo

**Headers:**

```
Authorization: Bearer SEU_TOKEN_ADMIN
```

**Body:**

```json
{
  "titulo": "Novo Módulo",
  "descricao": "Descrição do módulo",
  "ordem": 3,
  "ativo": true
}
```

#### **PUT /api/modulo/:id** 🔒 (Admin)

Atualiza módulo

#### **DELETE /api/modulo/:id** 🔒 (Admin)

Remove módulo

---

### ❓ Quizzes

#### **GET /api/quiz**

Lista todos os quizzes

**Response 200:**

```json
[
  {
    "id_quiz": 1,
    "id_modulo": 1,
    "titulo": "Quiz de Fundamentos da Fé",
    "descricao": "Teste seus conhecimentos",
    "ativo": true,
    "questoes": [
      {
        "id_questao": 1,
        "tipo_questao": "multipla_escolha",
        "enunciado": "Qual é a primeira virtude teologal?",
        "pontos": 10,
        "ordem": 1,
        "opcoes": [
          { "id": "a", "texto": "Fé" },
          { "id": "b", "texto": "Esperança" },
          { "id": "c", "texto": "Caridade" }
        ],
        "resposta_correta": "a"
      }
    ]
  }
]
```

#### **GET /api/quiz/:id**

Busca quiz específico com questões

#### **POST /api/quiz** 🔒 (Admin)

Cria novo quiz

**Body:**

```json
{
  "id_modulo": 1,
  "titulo": "Novo Quiz",
  "descricao": "Teste de conhecimento",
  "ativo": true
}
```

#### **PUT /api/quiz/:id** 🔒 (Admin)

Atualiza quiz

#### **DELETE /api/quiz/:id** 🔒 (Admin)

Remove quiz

---

### ✅ Respostas de Quiz

#### **POST /api/quiz/:id/responder** 🔒

Submete respostas de um quiz completo

**Exemplo:** `POST /api/quiz/1/responder`

**Headers:**

```
Authorization: Bearer SEU_TOKEN
```

**Body:**

```json
{
  "id_usuario": 3,
  "respostas": [
    {
      "id_questao": 1,
      "resposta": "a"
    },
    {
      "id_questao": 2,
      "resposta": "v"
    },
    {
      "id_questao": 3,
      "resposta": "A fé é fundamental porque..."
    }
  ]
}
```

**Response 201:**

```json
{
  "message": "Respostas submetidas com sucesso",
  "total_questoes": 3,
  "pontos_obtidos": 25
}
```

**O que acontece automaticamente:**

- ✅ Respostas são corrigidas (exceto discursivas)
- ✅ Pontuação do usuário é atualizada
- ✅ Progresso do módulo é marcado como "concluido"
- ✅ Nota do quiz é registrada

#### **GET /api/quiz/:id/respostas** 🔒

Lista todas as respostas de um quiz

#### **GET /api/quiz/:id/respostas/usuario?usuarioId=X** 🔒

Lista respostas de um usuário específico

**Exemplo:** `GET /api/quiz/1/respostas/usuario?usuarioId=3`

**Response 200:**

```json
{
  "respostas": [
    {
      "id_resposta": 1,
      "enunciado": "Qual é a primeira virtude teologal?",
      "resposta": "a",
      "correta": true,
      "pontos_obtidos": 10
    }
  ],
  "pontuacao": {
    "pontos": 25,
    "questoes_respondidas": 3
  }
}
```

---

### 📖 Lições (Secretaria das Células)

#### **GET /api/licao**

Lista todas as lições

#### **GET /api/licao/:id**

Busca lição com conteúdo

**Response 200:**

```json
{
  "id_licao": 1,
  "titulo": "Como Liderar uma Célula",
  "descricao": "Princípios de liderança",
  "ordem": 1,
  "ativa": true,
  "campos": [
    {
      "label": "Introdução",
      "conteudo": "A liderança começa com...",
      "tipo_campo": "texto",
      "ordem": 1
    }
  ]
}
```

#### **POST /api/licao** 🔒 (Admin/Líder)

Cria nova lição

**Body:**

```json
{
  "titulo": "Nova Lição",
  "descricao": "Descrição",
  "ordem": 5,
  "ativa": true
}
```

---

### 📝 Formulários

#### **GET /api/formulario**

Lista todos os formulários

#### **GET /api/formulario/:id**

Busca formulário com campos

**Response 200:**

```json
{
  "id_formulario": 1,
  "titulo": "Relatório de Célula",
  "descricao": "Preencha após cada reunião",
  "ativo": true,
  "campos": [
    {
      "id": 1,
      "label": "Data da reunião",
      "tipo_campo": "data",
      "ordem": 1,
      "obrigatorio": true
    },
    {
      "id": 2,
      "label": "Número de presentes",
      "tipo_campo": "numero",
      "ordem": 2,
      "obrigatorio": true
    }
  ]
}
```

#### **POST /api/formulario** 🔒 (Admin)

Cria novo formulário

---

### �️ Células

#### **GET /api/celula**

Lista todas as células

**Response 200:**

```json
[
  {
    "id_celula": 1,
    "nome": "Célula Central",
    "descricao": "Célula do centro da cidade",
    "id_lider": 2,
    "dia_reuniao": "quarta",
    "horario_reuniao": "19:30",
    "local_reuniao": "Rua Central, 123",
    "ativa": 1,
    "nome_lider": "Líder Teste"
  }
]
```

#### **GET /api/celula/ativas**

Lista apenas células ativas

#### **GET /api/celula/:id**

Busca célula específica

#### **GET /api/celula/lider/:idLider**

Lista células de um líder específico

#### **POST /api/celula** 🔒 (Admin)

Cria nova célula

**Body:**

```json
{
  "nome": "Célula Norte",
  "descricao": "Célula da região norte",
  "id_lider": 2,
  "dia_reuniao": "quinta",
  "horario_reuniao": "20:00",
  "local_reuniao": "Av. Norte, 456",
  "ativa": true
}
```

#### **PUT /api/celula/:id** 🔒 (Admin/Líder)

Atualiza célula existente

#### **DELETE /api/celula/:id** 🔒 (Admin)

Remove célula

---

### 📝 Respostas de Formulários

#### **GET /api/formulario-resposta**

Lista todas as respostas de formulários

#### **GET /api/formulario-resposta/:id**

Busca resposta específica com campos preenchidos

**Response 200:**

```json
{
  "id_resposta": 1,
  "id_formulario": 1,
  "id_celula": 1,
  "data_resposta": "2025-11-18T12:00:00.000Z",
  "titulo_formulario": "Relatório Semanal",
  "nome_celula": "Célula Central",
  "nome_lider": "Líder Teste",
  "campos": [
    {
      "id_resposta_campo": 1,
      "id_formulario_campo": 1,
      "resposta": "15 pessoas presentes",
      "label": "Número de participantes"
    }
  ]
}
```

#### **GET /api/formulario-resposta/formulario/:idFormulario**

Lista todas as respostas de um formulário específico

#### **GET /api/formulario-resposta/celula/:idCelula**

Lista todas as respostas de uma célula específica

#### **POST /api/formulario-resposta** 🔒 (Líder)

Submete resposta de formulário

**Body:**

```json
{
  "id_formulario": 1,
  "id_celula": 1,
  "campos": [
    {
      "id_formulario_campo": 1,
      "resposta": "20 pessoas presentes"
    },
    {
      "id_formulario_campo": 2,
      "resposta": "Culto de ação de graças"
    }
  ]
}
```

**Response 201:**

```json
{
  "id_resposta": 5,
  "id_formulario": 1,
  "id_celula": 1,
  "data_resposta": "2025-11-18T14:30:00.000Z",
  "campos": [...]
}
```

#### **PUT /api/formulario-resposta/:id** 🔒 (Admin/Líder)

Atualiza data da resposta

#### **DELETE /api/formulario-resposta/:id** 🔒 (Admin)

Remove resposta

---

### �🏷️ Campos Personalizados

#### **GET /api/campo**

Lista todos os tipos de campos

**Response 200:**

```json
[
  {
    "id_campo": 1,
    "tipo_campo": "texto"
  },
  {
    "id_campo": 2,
    "tipo_campo": "numero"
  },
  {
    "id_campo": 6,
    "tipo_campo": "multipla_escolha"
  }
]
```

---

## 🧪 Testes no Postman

### Configuração do Postman

#### 1. Crie uma Collection

1. Abra o Postman
2. Clique em **"New Collection"**
3. Nomeie: `Casa dos Discípulos API`

#### 2. Configure Variáveis da Collection

1. Clique na collection
2. Vá em **Variables**
3. Adicione:

| Variable | Initial Value             | Current Value                |
| -------- | ------------------------- | ---------------------------- |
| baseUrl  | http://localhost:3001/api | http://localhost:3001/api    |
| token    |                           | (será preenchido após login) |

#### 3. Configure Autorização Automática

1. Na collection, vá em **Authorization**
2. Type: **Bearer Token**
3. Token: `{{token}}`

Agora todas as requisições da collection usarão o token automaticamente!

---

### 📋 Fluxo de Teste Completo

#### **Teste 1: Autenticação**

**1.1. Registrar novo usuário**

```
POST {{baseUrl}}/auth/register
```

Body:

```json
{
  "nome": "Teste Postman",
  "email": "teste@postman.com",
  "senha": "senha123",
  "tipo": "membro"
}
```

**1.2. Fazer login como admin**

```
POST {{baseUrl}}/auth/login
```

Body:

```json
{
  "email": "admin@test.com",
  "senha": "123456"
}
```

**⚠️ COPIE O TOKEN DA RESPOSTA!**

1. Na resposta, copie o valor de `token`
2. Vá em **Collection Variables**
3. Cole no campo `Current Value` da variável `token`
4. Salve (Ctrl+S)

---

#### **Teste 2: Listar Dados**

**2.1. Listar usuários**

```
GET {{baseUrl}}/usuarios
```

(Usa token automaticamente)

**2.2. Listar módulos**

```
GET {{baseUrl}}/modulo
```

**2.3. Listar quizzes**

```
GET {{baseUrl}}/quiz
```

**2.4. Ver quiz específico com questões**

```
GET {{baseUrl}}/quiz/1
```

---

#### **Teste 3: Responder Quiz**

**3.1. Login como membro**

```
POST {{baseUrl}}/auth/login
```

Body:

```json
{
  "email": "membro@test.com",
  "senha": "123456"
}
```

(Atualize o token)

**3.2. Submeter respostas**

```
POST {{baseUrl}}/quiz/1/responder
```

Body:

```json
{
  "id_usuario": 3,
  "respostas": [
    {
      "id_questao": 1,
      "resposta": "a"
    },
    {
      "id_questao": 2,
      "resposta": "v"
    },
    {
      "id_questao": 3,
      "resposta": "Minha resposta discursiva completa aqui..."
    }
  ]
}
```

**3.3. Ver resultado**

```
GET {{baseUrl}}/quiz/1/respostas/usuario?usuarioId=3
```

**3.4. Verificar pontuação atualizada**

```
GET {{baseUrl}}/usuarios/3
```

(Deve mostrar `pontuacao` atualizada)

---

#### **Teste 4: CRUD de Módulo (Admin)**

**4.1. Login como admin** (se necessário)

**4.2. Criar módulo**

```
POST {{baseUrl}}/modulo
```

Body:

```json
{
  "titulo": "Módulo Teste Postman",
  "descricao": "Criado via Postman",
  "ordem": 10,
  "ativo": true
}
```

**4.3. Atualizar módulo**

```
PUT {{baseUrl}}/modulo/ID_RETORNADO
```

Body:

```json
{
  "titulo": "Módulo Atualizado",
  "ativo": false
}
```

**4.4. Deletar módulo**

```
DELETE {{baseUrl}}/modulo/ID_RETORNADO
```

---

## 🔄 Fluxos Completos

### Fluxo 1: Novo Membro Completa Módulo

1. **Registro:**

   - `POST /api/auth/register`
   - Recebe credenciais

2. **Login:**

   - `POST /api/auth/login`
   - Recebe token

3. **Visualiza módulos disponíveis:**

   - `GET /api/modulo`

4. **Acessa módulo específico:**

   - `GET /api/modulo/1`
   - Vê todo o conteúdo

5. **Faz o quiz do módulo:**

   - `GET /api/quiz/1` (vê questões)
   - `POST /api/quiz/1/responder` (submete respostas)

6. **Verifica resultado:**

   - `GET /api/quiz/1/respostas/usuario?usuarioId=X`
   - Vê pontuação obtida

7. **Progresso automaticamente atualizado:**
   - Tabela `usuario_modulo` marcada como "concluido"
   - Pontuação do usuário incrementada

---

### Fluxo 2: Admin Cria Novo Módulo com Quiz

1. **Login como admin:**

   - `POST /api/auth/login`

2. **Cria módulo:**

   - `POST /api/modulo`

3. **Cria quiz vinculado:**

   - `POST /api/quiz`
   - Body inclui `id_modulo` do módulo criado

4. **(Futuro) Adiciona questões:**
   - Atualmente via seeder
   - Futuramente: `POST /api/quiz-questao`

---

### Fluxo 3: Líder Preenche Relatório de Célula

1. **Login como líder:**

   - `POST /api/auth/login`

2. **Visualiza formulários:**

   - `GET /api/formulario`

3. **Vê campos do formulário:**

   - `GET /api/formulario/1`

4. **(Futuro) Submete resposta:**
   - `POST /api/formulario/1/responder`
   - Atualmente modelo existe, falta service/controller

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**

1. Verifique se o MySQL está rodando
2. Confira credenciais no `.env`
3. Teste conexão: `mysql -u root -p`

### Erro: "Table doesn't exist"

**Solução:**

```bash
npm run migrate:rollback  # Desfaz migrations
npm run migrate           # Recria tabelas
npm run seed              # Popula dados
```

### Erro: "JWT must be provided"

**Solução:**

- Certifique-se de incluir header `Authorization: Bearer TOKEN`
- Verifique se o token não expirou (faça login novamente)

### Erro: "Port 3001 already in use"

**Solução:**

1. Mude a porta no `.env`: `PORT=3002`
2. Ou mate o processo:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Seed falha: "Foreign key constraint"

**Solução:**

- Execute seeds na ordem correta (runSeeds.js faz isso)
- Ou limpe o banco:

```bash
npm run migrate:rollback
npm run migrate
npm run seed
```

---

## 📊 Comandos Úteis

### NPM Scripts Disponíveis:

```bash
# Desenvolvimento
npm run dev              # Roda com nodemon (hot reload)
npm start               # Roda em produção

# Database
npm run migrate         # Executa todas as migrations
npm run migrate:rollback # Desfaz última migration
npm run migrate:latest  # Executa migrations pendentes
npm run seed            # Popula banco com dados de teste

# Testes (se implementados)
npm test
```

### Verificar Logs do Banco:

```sql
-- Ver usuários cadastrados
SELECT * FROM usuario;

-- Ver progresso dos usuários
SELECT
  u.nome,
  m.titulo as modulo,
  um.status,
  um.nota_quiz,
  um.data_conclusao
FROM usuario_modulo um
JOIN usuario u ON um.id_usuario = u.id_usuario
JOIN modulo m ON um.id_modulo = m.id_modulo;

-- Ver respostas de quiz
SELECT
  u.nome,
  qq.enunciado,
  qr.resposta,
  qr.correta,
  qr.pontos_obtidos
FROM quiz_resposta qr
JOIN usuario u ON qr.id_usuario = u.id_usuario
JOIN quiz_questao qq ON qr.id_questao = qq.id_questao;
```

---

## 🎯 Próximos Passos

### Features a Implementar:

1. **CRUD de Questões de Quiz** (via API)
2. **CRUD de Células** (Service/Controller/Rotas)
3. **Submissão de Formulários** (Service/Controller)
4. **Dashboard de Estatísticas**
5. **Upload de Arquivos** (para campos tipo "upload")
6. **Validações Joi** faltantes
7. **Testes Automatizados**
8. **Documentação Swagger**

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a seção [Troubleshooting](#-troubleshooting)
2. Consulte `ANALISE_BACKEND.md` para detalhes técnicos
3. Revise os logs do servidor

---

**Desenvolvido por:** Equipe Casa dos Discípulos  
**Última atualização:** 18/11/2025
