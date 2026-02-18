# ✅ Checklist - Como Rodar e Testar o Backend

## 📋 Preparação do Ambiente

### ☐ 1. Verificar Pré-requisitos

```bash
node --version    # Deve ser v16+
npm --version     # Deve ser v8+
mysql --version   # Deve ser MySQL 8+
```

### ☐ 2. Instalar Dependências

```bash
cd Codigo/backend
npm install
```

### ☐ 3. Configurar MySQL

**Opção A - MySQL Workbench:**

1. Abra o MySQL Workbench
2. Execute:

```sql
CREATE DATABASE casa_dos_discipulos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Opção B - Terminal:**

```bash
mysql -u root -p
# Digite sua senha
mysql> CREATE DATABASE casa_dos_discipulos;
mysql> exit;
```

### ☐ 4. Criar Arquivo .env

Crie o arquivo `backend/.env` com:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=casa_dos_discipulos
JWT_SECRET=meu_secret_super_seguro_123456
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Substitua `SUA_SENHA_AQUI`!

---

## 🗄️ Configurar Banco de Dados

### ☐ 5. Executar Migrations

```bash
npm run migrate
```

**Resultado esperado:**

```
Batch 1 run: 15 migrations
✓ 20250916002535_create_usuario_table.cjs
✓ 20250916002536_create_campo_personalizado_table.cjs
...
```

Se der erro, verifique:

- [ ] MySQL está rodando?
- [ ] Senha do `.env` está correta?
- [ ] Banco foi criado?

### ☐ 6. Popular com Dados de Teste

```bash
npm run seed
```

**Resultado esperado:**

```
🌱 Iniciando seeders...

✓ Usuarios seed inseridos!
✓ Campos personalizados inseridos com sucesso!
✓ Células inseridas com sucesso!
✓ Módulos inseridos com sucesso!
...

✅ Todos os seeders executados com sucesso!
```

---

## 🚀 Rodar o Servidor

### ☐ 7. Iniciar Backend

```bash
npm run dev
```

**Resultado esperado:**

```
🚀 Servidor rodando na porta 3001
```

### ☐ 8. Testar Conexão

Abra no navegador: `http://localhost:3001`

**Deve retornar:**

```json
{
  "message": "API Casa dos Discípulos - Online ✓"
}
```

---

## 🧪 Testar no Postman

### ☐ 9. Importar Collection

1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo: `backend/Casa_dos_Discipulos_API.postman_collection.json`
4. Collection será criada com todas as rotas

### ☐ 10. Fazer Primeiro Login

1. Abra a pasta **"1. Autenticação"**
2. Clique em **"Login - Admin"**
3. Clique em **Send**

**Deve retornar:**

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

**✨ O token é salvo automaticamente!** (graças ao script de teste da collection)

### ☐ 11. Testar Rotas Protegidas

**11.1. Listar Usuários**

- Pasta: **"2. Usuários"**
- Request: **"Listar Todos os Usuários"**
- Clique em **Send**

Deve retornar 3 usuários (admin, lider, membro).

**11.2. Listar Módulos**

- Pasta: **"3. Módulos"**
- Request: **"Listar Todos os Módulos"**
- Clique em **Send**

**11.3. Ver Quiz com Questões**

- Pasta: **"4. Quizzes"**
- Request: **"Buscar Quiz por ID (com questões)"**
- Clique em **Send**

Deve retornar quiz com array de `questoes`.

---

## 🎯 Testar Fluxo Completo de Quiz

### ☐ 12. Login como Membro

1. Pasta: **"1. Autenticação"**
2. Request: **"Login - Membro"**
3. **Send**

Token do membro será salvo automaticamente.

### ☐ 13. Ver Questões do Quiz

1. Pasta: **"4. Quizzes"**
2. Request: **"Buscar Quiz por ID (com questões)"**
3. **Send**
4. **Copie os IDs das questões** (id_questao)

### ☐ 14. Responder o Quiz

1. Pasta: **"5. Respostas de Quiz"**
2. Request: **"Submeter Respostas de Quiz"**
3. Edite o Body com os IDs corretos:

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
      "resposta": "Resposta discursiva completa aqui"
    }
  ]
}
```

4. **Send**

**Deve retornar:**

```json
{
  "message": "Respostas submetidas com sucesso",
  "total_questoes": 3,
  "pontos_obtidos": 25
}
```

### ☐ 15. Verificar Pontuação Atualizada

1. Pasta: **"2. Usuários"**
2. Request: **"Buscar Usuário por ID"**
3. Mude a URL para: `{{baseUrl}}/usuarios/3`
4. **Send**

Deve mostrar `"pontuacao": 25` (ou o valor obtido).

### ☐ 16. Ver Resultado do Quiz

1. Pasta: **"5. Respostas de Quiz"**
2. Request: **"Ver Respostas de Usuário Específico"**
3. **Send**

Retorna todas as respostas com indicação de certas/erradas.

---

## ✅ Testes Adicionais

### ☐ 17. Criar Módulo (Como Admin)

1. Login como admin novamente
2. Pasta: **"3. Módulos"**
3. Request: **"Criar Módulo (Admin)"**
4. **Send**

### ☐ 18. Criar Quiz (Como Admin)

1. Pasta: **"4. Quizzes"**
2. Request: **"Criar Quiz (Admin)"**
3. Edite `id_modulo` para o módulo criado
4. **Send**

### ☐ 19. Testar Lições

1. Pasta: **"6. Lições"**
2. Request: **"Listar Todas as Lições"**
3. **Send**

### ☐ 20. Testar Formulários

1. Pasta: **"7. Formulários"**
2. Request: **"Buscar Formulário por ID"**
3. **Send**

Deve retornar formulário com array de `campos`.

---

## 🔍 Verificar no Banco de Dados

### ☐ 21. Abrir MySQL Workbench

Execute estas queries para ver os dados:

**Ver usuários:**

```sql
USE casa_dos_discipulos;
SELECT id_usuario, nome, email, tipo, pontuacao FROM usuario;
```

**Ver progresso dos módulos:**

```sql
SELECT
  u.nome,
  m.titulo,
  um.status,
  um.nota_quiz,
  um.data_conclusao
FROM usuario_modulo um
JOIN usuario u ON um.id_usuario = u.id_usuario
JOIN modulo m ON um.id_modulo = m.id_modulo;
```

**Ver respostas de quiz:**

```sql
SELECT
  u.nome as usuario,
  qq.enunciado,
  qr.resposta,
  qr.correta,
  qr.pontos_obtidos
FROM quiz_resposta qr
JOIN usuario u ON qr.id_usuario = u.id_usuario
JOIN quiz_questao qq ON qr.id_questao = qq.id_questao;
```

---

## 🚨 Resolução de Problemas

### ❌ Erro: "Cannot connect to database"

**Soluções:**

```bash
# Windows - Iniciar MySQL
net start MySQL80

# Verificar se está rodando
mysql -u root -p
```

### ❌ Erro: "Table doesn't exist"

**Solução:**

```bash
npm run migrate:rollback
npm run migrate
npm run seed
```

### ❌ Erro: "JWT must be provided"

**Soluções:**

- Faça login novamente (request "Login - Admin")
- Verifique se o token foi salvo nas variáveis da collection
- Collection Variables → `token` deve estar preenchido

### ❌ Erro: "Port 3001 already in use"

**Solução:**

1. Feche outros servidores rodando na porta 3001
2. Ou mude a porta no `.env`: `PORT=3002`

### ❌ Seed falha: "Foreign key constraint"

**Solução:**

```bash
# Limpar tudo e recomeçar
npm run migrate:rollback
npm run migrate
npm run seed
```

---

## 📚 Documentação Completa

Após seguir este checklist, consulte:

- **README.md** - Overview do projeto
- **GUIA_COMPLETO.md** - Tutorial detalhado de todas as rotas
- **ANALISE_BACKEND.md** - Análise técnica completa

---

## ✅ Checklist Resumido

```
☐ Instalar dependências (npm install)
☐ Criar banco de dados MySQL
☐ Configurar .env
☐ Executar migrations (npm run migrate)
☐ Executar seeds (npm run seed)
☐ Rodar servidor (npm run dev)
☐ Importar collection no Postman
☐ Fazer login (token salvo automaticamente)
☐ Testar rotas principais
☐ Responder quiz completo
☐ Verificar pontuação atualizada
```

---

**Tempo estimado:** 15-20 minutos  
**Última atualização:** 18/11/2025
