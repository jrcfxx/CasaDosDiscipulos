# 📞 Exemplos de Chamadas da API - Casa dos Discípulos

**Base URL:** `http://localhost:3001/api`

---

## 🔐 AUTENTICAÇÃO

### 1. Registrar Novo Usuário

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "nome": "Teste Postman",
  "email": "teste@postman.com",
  "senha": "senha123",
  "tipo": "membro"
}
```

### 2. Login - Admin

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "senha": "123456"
}
```

**Response:**

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

### 3. Login - Líder

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "lider@test.com",
  "senha": "123456"
}
```

### 4. Login - Membro

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "membro@test.com",
  "senha": "123456"
}
```

---

## 👥 USUÁRIOS

**⚠️ Todas as rotas requerem token JWT**

### 5. Listar Todos os Usuários

```http
GET http://localhost:3001/api/usuarios
Authorization: Bearer SEU_TOKEN_AQUI
```

### 6. Buscar Usuário por ID

```http
GET http://localhost:3001/api/usuarios/1
Authorization: Bearer SEU_TOKEN_AQUI
```

### 7. Atualizar Usuário

```http
PUT http://localhost:3001/api/usuarios/3
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "nome": "Nome Atualizado",
  "pontuacao": 150
}
```

### 8. Ativar/Desativar Usuário

```http
PATCH http://localhost:3001/api/usuarios/3/toggle
Authorization: Bearer SEU_TOKEN_AQUI
```

### 9. Deletar Usuário (Admin)

```http
DELETE http://localhost:3001/api/usuarios/4
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 📚 MÓDULOS

### 10. Listar Todos os Módulos

```http
GET http://localhost:3001/api/modulo
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response:**

```json
[
  {
    "id_modulo": 1,
    "titulo": "Fundamentos da Fé",
    "descricao": "Aprenda os conceitos básicos da fé cristã",
    "ordem": 1,
    "ativo": true
  }
]
```

### 11. Buscar Módulo por ID (com conteúdo)

```http
GET http://localhost:3001/api/modulo/1
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response:**

```json
{
  "id_modulo": 1,
  "titulo": "Fundamentos da Fé",
  "descricao": "Aprenda os conceitos básicos da fé cristã",
  "ordem": 1,
  "ativo": true,
  "campos": [
    {
      "label": "Introdução",
      "conteudo": "Bem-vindo ao primeiro módulo!",
      "tipo_campo": "texto",
      "ordem": 1
    }
  ]
}
```

### 12. Criar Módulo (Admin)

```http
POST http://localhost:3001/api/modulo
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "titulo": "Módulo Teste Postman",
  "descricao": "Criado via API para testes",
  "ordem": 10,
  "ativo": true
}
```

### 13. Atualizar Módulo (Admin)

```http
PUT http://localhost:3001/api/modulo/1
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "titulo": "Módulo Atualizado",
  "descricao": "Descrição atualizada",
  "ativo": false
}
```

### 14. Deletar Módulo (Admin)

```http
DELETE http://localhost:3001/api/modulo/5
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## ❓ QUIZZES

### 15. Listar Todos os Quizzes

```http
GET http://localhost:3001/api/quiz
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response:**

```json
[
  {
    "id_quiz": 1,
    "id_modulo": 1,
    "titulo": "Quiz de Fundamentos da Fé",
    "descricao": "Teste seus conhecimentos",
    "ativo": true,
    "questoes": []
  }
]
```

### 16. Buscar Quiz por ID (com questões)

```http
GET http://localhost:3001/api/quiz/1
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response:**

```json
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
      "enunciado": "Questão de múltipla escolha sobre Fundamentos da Fé",
      "pontos": 10,
      "ordem": 1,
      "obrigatoria": true,
      "opcoes": [
        { "id": "a", "texto": "Opção A" },
        { "id": "b", "texto": "Opção B" },
        { "id": "c", "texto": "Opção C" },
        { "id": "d", "texto": "Opção D" }
      ],
      "resposta_correta": "a"
    },
    {
      "id_questao": 2,
      "tipo_questao": "verdadeiro_falso",
      "enunciado": "Afirmação verdadeira ou falsa sobre Fundamentos da Fé",
      "pontos": 5,
      "ordem": 2,
      "opcoes": [
        { "id": "v", "texto": "Verdadeiro" },
        { "id": "f", "texto": "Falso" }
      ],
      "resposta_correta": "v"
    },
    {
      "id_questao": 3,
      "tipo_questao": "discursiva",
      "enunciado": "Explique com suas palavras o conceito principal de Fundamentos da Fé",
      "pontos": 15,
      "ordem": 3,
      "opcoes": null,
      "resposta_correta": null
    }
  ]
}
```

### 17. Criar Quiz (Admin)

```http
POST http://localhost:3001/api/quiz
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "id_modulo": 1,
  "titulo": "Novo Quiz Teste",
  "descricao": "Quiz criado via Postman",
  "ativo": true
}
```

### 18. Atualizar Quiz (Admin)

```http
PUT http://localhost:3001/api/quiz/1
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "titulo": "Quiz Atualizado",
  "descricao": "Nova descrição",
  "ativo": false
}
```

### 19. Deletar Quiz (Admin)

```http
DELETE http://localhost:3001/api/quiz/2
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## ✅ RESPOSTAS DE QUIZ

### 20. Submeter Respostas de Quiz Completo

```http
POST http://localhost:3001/api/quiz/1/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

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
      "resposta": "Minha resposta discursiva completa sobre o tema abordado na questão. A fé é fundamental porque..."
    }
  ]
}
```

**Response:**

```json
{
  "message": "Respostas submetidas com sucesso",
  "total_questoes": 3,
  "pontos_obtidos": 25
}
```

**O que acontece automaticamente:**

- ✅ Respostas de múltipla escolha e V/F são corrigidas
- ✅ Pontuação do usuário é atualizada (`usuario.pontuacao += 25`)
- ✅ Progresso do módulo é marcado como "concluido"
- ✅ Nota do quiz é registrada

### 21. Listar Todas as Respostas de um Quiz

```http
GET http://localhost:3001/api/quiz/1/respostas
Authorization: Bearer SEU_TOKEN_AQUI
```

### 22. Ver Respostas de Usuário Específico

```http
GET http://localhost:3001/api/quiz/1/respostas/usuario?usuarioId=3
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response:**

```json
{
  "respostas": [
    {
      "id_resposta": 1,
      "id_questao": 1,
      "enunciado": "Questão de múltipla escolha sobre Fundamentos da Fé",
      "resposta": "a",
      "correta": true,
      "pontos_obtidos": 10,
      "tipo_questao": "multipla_escolha",
      "ordem": 1
    },
    {
      "id_resposta": 2,
      "id_questao": 2,
      "enunciado": "Afirmação verdadeira ou falsa sobre Fundamentos da Fé",
      "resposta": "v",
      "correta": true,
      "pontos_obtidos": 5,
      "tipo_questao": "verdadeiro_falso",
      "ordem": 2
    },
    {
      "id_resposta": 3,
      "id_questao": 3,
      "enunciado": "Explique com suas palavras...",
      "resposta": "Minha resposta discursiva...",
      "correta": null,
      "pontos_obtidos": 0,
      "tipo_questao": "discursiva",
      "ordem": 3
    }
  ],
  "pontuacao": {
    "pontos": 15,
    "questoes_respondidas": 3
  }
}
```

---

## 📖 LIÇÕES

### 23. Listar Todas as Lições

```http
GET http://localhost:3001/api/licao
Authorization: Bearer SEU_TOKEN_AQUI
```

### 24. Buscar Lição por ID (com conteúdo)

```http
GET http://localhost:3001/api/licao/1
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response:**

```json
{
  "id_licao": 1,
  "titulo": "Fundamentos da Caminhada Cristã",
  "descricao": "Primeira lição sobre fundamentos",
  "ordem": 1,
  "ativa": true,
  "campos": [
    {
      "label": "Introdução",
      "conteudo": "Nesta lição, vamos aprender os fundamentos...",
      "tipo_campo": "texto",
      "ordem": 1
    },
    {
      "label": "Vídeo introdutório",
      "conteudo": "https://youtube.com/fundamentos-da-fe",
      "tipo_campo": "link",
      "ordem": 2
    }
  ]
}
```

### 25. Criar Lição (Admin/Líder)

```http
POST http://localhost:3001/api/licao
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "titulo": "Nova Lição",
  "descricao": "Descrição da lição",
  "ordem": 5,
  "ativa": true
}
```

### 26. Atualizar Lição (Admin/Líder)

```http
PUT http://localhost:3001/api/licao/1
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "titulo": "Lição Atualizada",
  "ativa": false
}
```

---

## 📝 FORMULÁRIOS

### 27. Listar Todos os Formulários

```http
GET http://localhost:3001/api/formulario
Authorization: Bearer SEU_TOKEN_AQUI
```

### 28. Buscar Formulário por ID (com campos)

```http
GET http://localhost:3001/api/formulario/1
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response:**

```json
{
  "id_formulario": 1,
  "titulo": "Relatório de Célula",
  "descricao": "Preencha após cada reunião da célula",
  "ativo": true,
  "campos": [
    {
      "id": 1,
      "label": "Data da reunião",
      "conteudo": "Informe a data em que a célula se reuniu",
      "tipo_campo": "data",
      "ordem": 1,
      "obrigatorio": true
    },
    {
      "id": 2,
      "label": "Número de presentes",
      "conteudo": "Quantas pessoas participaram da reunião?",
      "tipo_campo": "numero",
      "ordem": 2,
      "obrigatorio": true
    },
    {
      "id": 3,
      "label": "Resumo da reunião",
      "conteudo": "Descreva brevemente como foi a reunião",
      "tipo_campo": "texto",
      "ordem": 3,
      "obrigatorio": true
    }
  ]
}
```

### 29. Criar Formulário (Admin)

```http
POST http://localhost:3001/api/formulario
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "titulo": "Novo Formulário",
  "descricao": "Descrição do formulário",
  "ativo": true
}
```

### 30. Atualizar Formulário (Admin)

```http
PUT http://localhost:3001/api/formulario/1
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "titulo": "Formulário Atualizado",
  "descricao": "Nova descrição",
  "ativo": false
}
```

---

## 🏷️ CAMPOS PERSONALIZADOS

### 31. Listar Tipos de Campos

```http
GET http://localhost:3001/api/campo
Authorization: Bearer SEU_TOKEN_AQUI
```

**Response:**

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
    "id_campo": 3,
    "tipo_campo": "data"
  },
  {
    "id_campo": 4,
    "tipo_campo": "link"
  },
  {
    "id_campo": 5,
    "tipo_campo": "upload"
  },
  {
    "id_campo": 6,
    "tipo_campo": "multipla_escolha"
  },
  {
    "id_campo": 7,
    "tipo_campo": "verdadeiro_falso"
  },
  {
    "id_campo": 8,
    "tipo_campo": "discursiva"
  }
]
```

---

## 🧪 TESTES ESPECIAIS

### 32. Teste de Conexão (Sem Auth)

```http
GET http://localhost:3001/
```

**Response:**

```json
{
  "message": "API Casa dos Discípulos - Online ✓"
}
```

---

## 🔄 FLUXO COMPLETO: Novo Membro Fazendo Quiz

### Passo 1: Registrar

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "senha123",
  "tipo": "membro"
}
```

### Passo 2: Login

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "senha": "senha123"
}
```

**Copie o token retornado!**

### Passo 3: Ver Módulos Disponíveis

```http
GET http://localhost:3001/api/modulo
Authorization: Bearer SEU_TOKEN
```

### Passo 4: Ver Conteúdo do Módulo

```http
GET http://localhost:3001/api/modulo/1
Authorization: Bearer SEU_TOKEN
```

### Passo 5: Ver Quiz do Módulo

```http
GET http://localhost:3001/api/quiz/1
Authorization: Bearer SEU_TOKEN
```

**Copie os IDs das questões!**

### Passo 6: Responder o Quiz

```http
POST http://localhost:3001/api/quiz/1/responder
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "id_usuario": 4,
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
      "resposta": "A fé é o fundamento de tudo..."
    }
  ]
}
```

### Passo 7: Ver Resultado

```http
GET http://localhost:3001/api/quiz/1/respostas/usuario?usuarioId=4
Authorization: Bearer SEU_TOKEN
```

### Passo 8: Verificar Pontuação Atualizada

```http
GET http://localhost:3001/api/usuarios/4
Authorization: Bearer SEU_TOKEN
```

---

## 📊 QUERIES SQL ÚTEIS

### Verificar Usuários Cadastrados

```sql
SELECT id_usuario, nome, email, tipo, pontuacao, ativo
FROM usuario;
```

### Ver Progresso dos Usuários nos Módulos

```sql
SELECT
  u.nome as usuario,
  m.titulo as modulo,
  um.status,
  um.nota_quiz,
  um.data_inicio,
  um.data_conclusao
FROM usuario_modulo um
JOIN usuario u ON um.id_usuario = u.id_usuario
JOIN modulo m ON um.id_modulo = m.id_modulo
ORDER BY u.nome, m.ordem;
```

### Ver Respostas de Quiz

```sql
SELECT
  u.nome as usuario,
  q.titulo as quiz,
  qq.enunciado,
  qq.tipo_questao,
  qr.resposta,
  qr.correta,
  qr.pontos_obtidos
FROM quiz_resposta qr
JOIN usuario u ON qr.id_usuario = u.id_usuario
JOIN quiz_questao qq ON qr.id_questao = qq.id_questao
JOIN quiz q ON qq.id_quiz = q.id_quiz
ORDER BY u.nome, qq.ordem;
```

### Ver Ranking de Pontuação

```sql
SELECT
  ROW_NUMBER() OVER (ORDER BY pontuacao DESC) as posicao,
  nome,
  email,
  pontuacao,
  tipo
FROM usuario
WHERE ativo = true
ORDER BY pontuacao DESC;
```

---

## 🎯 DICAS POSTMAN

### Salvar Token Automaticamente

No script de teste da request de login, adicione:

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.collectionVariables.set("token", jsonData.token);
  console.log("Token salvo: " + jsonData.token);
}
```

### Usar Variáveis

Nas URLs, use:

- `{{baseUrl}}` em vez de `http://localhost:3001/api`
- `{{token}}` em vez de colar o token manualmente

### Organizar em Pastas

Organize as requests em pastas:

1. Autenticação
2. Usuários
3. Módulos
4. Quizzes
5. Respostas de Quiz
6. Lições
7. Formulários

---

**Última atualização:** 18/11/2025  
**Base URL padrão:** http://localhost:3001/api
