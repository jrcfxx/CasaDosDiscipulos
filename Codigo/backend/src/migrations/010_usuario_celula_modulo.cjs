/**
 * Tabelas usuario_celula, usuario_modulo, modulo_quiz
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("usuario_celula", (table) => {
    table.increments("id_usuario_celula").primary();
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.integer("id_celula").unsigned().notNullable().references("celula.id_celula").onDelete("CASCADE");
    table.boolean("principal").defaultTo(false).notNullable();
    table.unique(["id_usuario", "id_celula"]);
  });

  await knex.schema.createTable("usuario_modulo", (table) => {
    table.increments("id_usuario_modulo").primary();
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.integer("id_modulo").unsigned().notNullable().references("modulo.id_modulo").onDelete("CASCADE");
    table.enum("status", ["nao_iniciado", "em_andamento", "concluido"]).defaultTo("nao_iniciado");
    table.decimal("nota_quiz", 5, 2).nullable();
    table.timestamp("data_inicio").defaultTo(knex.fn.now());
    table.timestamp("data_conclusao").nullable();
    table.boolean("auto_completo_por_nivel").defaultTo(false);
    table.unique(["id_usuario", "id_modulo"]);
  });

  await knex.schema.createTable("modulo_quiz", (table) => {
    table.increments("id").primary();
    table.integer("id_modulo").unsigned().notNullable().references("modulo.id_modulo").onDelete("CASCADE");
    table.integer("id_quiz").unsigned().notNullable().references("quiz.id_quiz").onDelete("CASCADE");
    table.timestamp("vinculado_em").defaultTo(knex.fn.now());
    table.unique(["id_modulo", "id_quiz"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("modulo_quiz");
  await knex.schema.dropTableIfExists("usuario_modulo");
  await knex.schema.dropTableIfExists("usuario_celula");
};
