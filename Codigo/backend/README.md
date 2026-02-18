# 🏠 Casa dos Discípulos - Backend API

Sistema de gestão para igreja com dois módulos principais:

- **Escola de Discípulos**: Módulos educacionais com quizzes gamificados
- **Secretaria das Células**: Lições e formulários para líderes de células

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

Crie o arquivo `.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=casa_dos_discipulos
JWT_SECRET=seu_secret_jwt
NODE_ENV=development
```

### 3. Criar Banco no MySQL

```sql
CREATE DATABASE casa_dos_discipulos;
```

### 4. Executar Migrations

```bash
npm run migrate
```

### 5. Popular com Dados de Teste

```bash
npm run seed
```

### 6. Rodar o Servidor

```bash
npm run dev
```

Servidor estará rodando em: `http://localhost:3001`

## 📖 Documentação Completa

- **[GUIA_COMPLETO.md](./GUIA_COMPLETO.md)** - Tutorial passo a passo completo
- **[ANALISE_BACKEND.md](./ANALISE_BACKEND.md)** - Análise técnica detalhada
- **[Casa_dos_Discipulos_API.postman_collection.json](./Casa_dos_Discipulos_API.postman_collection.json)** - Collection do Postman

## 🧪 Testar no Postman

### 1. Importar Collection

1. Abra o Postman
2. **Import** → Selecione `Casa_dos_Discipulos_API.postman_collection.json`
3. Collection será criada com todas as rotas

### 2. Fazer Login

Use a request **"Login - Admin"**:

```json
{
  "email": "admin@test.com",
  "senha": "123456"
}
```

O token será automaticamente salvo nas variáveis da collection!

### 3. Testar Rotas

Todas as outras requests já usarão o token automaticamente.

## 📊 Usuários Padrão (Seeds)

| Email           | Senha  | Tipo          |
| --------------- | ------ | ------------- |
| admin@test.com  | 123456 | administrador |
| lider@test.com  | 123456 | lider         |
| membro@test.com | 123456 | membro        |

## 🛣️ Principais Rotas

### Autenticação

- `POST /api/auth/register` - Cadastrar usuário
- `POST /api/auth/login` - Fazer login

### Escola de Discípulos

- `GET /api/modulo` - Listar módulos
- `GET /api/quiz/:id` - Ver quiz com questões
- `POST /api/quiz/:id/responder` - Submeter respostas

### Secretaria das Células

- `GET /api/licao` - Listar lições
- `GET /api/formulario` - Listar formulários
- `GET /api/celula` - Listar células
- `POST /api/formulario-resposta` - Submeter resposta de formulário

### Administração

- `GET /api/usuarios` - Listar usuários (admin)
- `POST /api/modulo` - Criar módulo (admin)
- `POST /api/quiz` - Criar quiz (admin)

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                # Roda com hot reload

# Database
npm run migrate            # Executa migrations
npm run migrate:rollback   # Desfaz migrations
npm run seed              # Popula dados de teste

# Produção
npm start                 # Roda servidor em produção
```

## 🗂️ Estrutura do Projeto

```
backend/
├── src/
│   ├── app.js                    # Configuração do Express
│   ├── controllers/              # Controladores HTTP
│   ├── models/                   # Acesso ao banco de dados
│   ├── services/                 # Lógica de negócio
│   ├── routes/                   # Definição de rotas
│   ├── middlewares/              # Auth, validações, erros
│   ├── validations/              # Schemas Joi
│   ├── utils/                    # Utilitários e constantes
│   ├── migrations/               # Migrations do banco
│   └── seeds/                    # Dados de teste
├── knexfile.cjs                  # Config do Knex
├── package.json
└── .env                          # Variáveis de ambiente
```

## 🏗️ Arquitetura

O projeto segue o padrão **MVC com Service Layer**:

```
Request → Route → Controller → Service → Model → Database
                      ↓
                  Response
```

### Camadas:

- **Routes**: Define endpoints e middlewares
- **Controllers**: Recebe requisições HTTP, valida entrada
- **Services**: Contém lógica de negócio e validações
- **Models**: Acessa banco de dados (queries)
- **Middlewares**: Autenticação, RBAC, tratamento de erros

## 🔐 Autenticação

Todas as rotas (exceto `/auth/login` e `/auth/register`) requerem token JWT.

**No Postman:**

```
Header: Authorization
Value: Bearer SEU_TOKEN_AQUI
```

**Tipos de Usuário:**

- `administrador` - Acesso total
- `lider` - Acessa lições e formulários
- `membro` - Acessa módulos e quizzes

## 📦 Tecnologias

- **Node.js** 16+
- **Express** 5.1.0
- **MySQL** 8+
- **Knex.js** 3.1.0 (Query Builder)
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Joi** - Validações
- **Dotenv** - Variáveis de ambiente

## 🐛 Troubleshooting

### Erro de Conexão com Banco

```bash
# Verifique se MySQL está rodando
net start MySQL80

# Teste credenciais
mysql -u root -p
```

### Porta 3001 em Uso

Altere no `.env`:

```env
PORT=3002
```

### Tabelas não existem

```bash
npm run migrate:rollback
npm run migrate
npm run seed
```

## 📈 Status do Projeto

✅ **Funcionalidades Implementadas:**

- Sistema de autenticação JWT
- CRUD completo de usuários, módulos, quizzes
- Sistema de quiz com correção automática
- Gamificação (pontuação e ranking)
- Progresso de módulos
- RBAC (controle de acesso por role)
- CRUD completo de células
- CRUD completo de lições
- CRUD completo de formulários
- Sistema de respostas de formulários
- Validações Joi em todas as entidades

⚠️ **Em Desenvolvimento:**

- CRUD de questões via API (gerenciadas via QuizService)
- Upload de arquivos
- Dashboard de relatórios

## 🤝 Contribuindo

1. Faça login como admin
2. Crie módulos, quizzes e lições
3. Teste os fluxos completos
4. Reporte bugs ou sugestões

## 📞 Suporte

Consulte a documentação completa em `GUIA_COMPLETO.md` para:

- Passo a passo detalhado
- Exemplos de todas as rotas
- Fluxos completos de uso
- Solução de problemas

---

**Desenvolvido por:** Equipe Casa dos Discípulos  
**Licença:** MIT  
**Última atualização:** 18/11/2025
