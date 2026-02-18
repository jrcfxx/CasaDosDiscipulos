# 📁 Database

Configuração e inicialização da conexão com banco de dados.

## Arquivos

### index.js

Configura a conexão com MySQL usando Knex.js:

```javascript
import knex from "knex";
import knexConfig from "../../knexfile.cjs";

const environment = process.env.NODE_ENV || "development";
const config = knexConfig[environment];

export default knex(config);
```

## Configuração

A configuração do banco está em `knexfile.cjs` na raiz do projeto:

```javascript
module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
  },
};
```

## Migrations

Criar nova migration:

```bash
npx knex migrate:make nome_da_migration
```

Executar migrations:

```bash
npm run migrate
```

Reverter última migration:

```bash
npm run migrate:rollback
```

## Seeds

Executar seeds (dados de teste):

```bash
npm run seed
```

## Estrutura de Tabelas

- **usuario** - Usuários do sistema
- **celula** - Células da igreja
- **modulo** - Módulos da Escola de Discípulos
- **quiz** - Quizzes dos módulos
- **quiz_questao** - Questões dos quizzes
- **quiz_resposta** - Respostas dos usuários
- **licao** - Lições para líderes
- **formulario** - Formulários da secretaria
- **formulario_resposta** - Respostas dos formulários
- **campo_personalizado** - Campos customizáveis
- **ranking** - Ranking de pontuação

## Relacionamentos

```
usuario 1--* quiz_resposta
usuario 1--* celula (como lider)
modulo 1--* quiz
quiz 1--* quiz_questao
quiz 1--* quiz_resposta
formulario 1--* formulario_resposta
celula 1--* formulario_resposta
```
