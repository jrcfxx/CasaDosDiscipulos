# 📁 Models

Models definem a estrutura dos dados e contêm queries de acesso ao banco de dados.

## Responsabilidades

- Executar queries SQL via Knex.js
- CRUD básico (Create, Read, Update, Delete)
- Queries específicas da entidade
- Joins com tabelas relacionadas
- **NÃO** contém validações de negócio

## Padrão de Implementação

```javascript
import knex from "../database/index.js";

const EntityModel = {
  async getAll() {
    return knex("table_name").select("*").orderBy("created_at", "desc");
  },

  async getById(id) {
    return knex("table_name").where({ id }).first();
  },

  async create(data) {
    const [id] = await knex("table_name").insert(data);
    return this.getById(id);
  },

  async update(id, data) {
    const updated = await knex("table_name").where({ id }).update(data);

    if (!updated) return null;
    return this.getById(id);
  },

  async delete(id) {
    return knex("table_name").where({ id }).del();
  },
};

export default EntityModel;
```

## Models Implementados

- **UsuarioModel.js** - Usuários (admin, lider, membro)
- **CelulaModel.js** - Células da igreja
- **ModuloModel.js** - Módulos educacionais
- **QuizModel.js** - Quizzes e questões
- **QuizRespostaModel.js** - Respostas de quizzes
- **LicaoModel.js** - Lições para líderes
- **FormularioModel.js** - Formulários da secretaria
- **FormularioRespostaModel.js** - Respostas de formulários
- **FormularioSecretariaModel.js** - Gestão de formulários
- **CampoModel.js** - Campos personalizados

## Boas Práticas

✅ **Use Knex query builder**
✅ **Sempre retorne dados após INSERT/UPDATE**
✅ **Use `.first()` para queries únicas**
✅ **Faça JOINs quando precisar de dados relacionados**
✅ **Use transações para operações múltiplas**

❌ **Não coloque validações de negócio**
❌ **Não lance exceções customizadas**
❌ **Evite raw SQL quando possível**

## Exemplo com JOIN

```javascript
async getWithRelations(id) {
  return knex('quiz')
    .select(
      'quiz.*',
      'modulo.titulo as titulo_modulo'
    )
    .leftJoin('modulo', 'quiz.id_modulo', 'modulo.id_modulo')
    .where({ 'quiz.id_quiz': id })
    .first();
}
```

## Exemplo com Transação

```javascript
async createWithItems(data, items) {
  return knex.transaction(async (trx) => {
    const [id] = await trx('main_table').insert(data);

    for (const item of items) {
      await trx('related_table').insert({
        ...item,
        main_id: id
      });
    }

    return this.getById(id);
  });
}
```

## Queries Especiais

Alguns models têm queries específicas:

- **getByLider(id_lider)** - Celulas de um líder
- **getByFormulario(id_formulario)** - Respostas de um formulário
- **getActive()** - Apenas registros ativos
- **getQuestoes(id_quiz)** - Questões de um quiz
