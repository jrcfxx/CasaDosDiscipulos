/**
 * Migration: permitir múltiplos líderes por célula
 * Cria tabela celula_lider, migra id_lider, remove coluna id_lider de celula
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Criar tabela celula_lider
  await knex.schema.createTable("celula_lider", (table) => {
    table.increments("id_celula_lider").primary();
    table
      .integer("id_celula")
      .unsigned()
      .notNullable()
      .references("id_celula")
      .inTable("celula")
      .onDelete("CASCADE");
    table
      .integer("id_usuario")
      .unsigned()
      .notNullable()
      .references("id_usuario")
      .inTable("usuario")
      .onDelete("CASCADE");
    table
      .boolean("principal")
      .defaultTo(false)
      .notNullable()
      .comment("Se true, é o líder principal para exibição");
    table.unique(["id_celula", "id_usuario"]);
  });

  // 2. Migrar dados existentes
  const celulas = await knex("celula").select("id_celula", "id_lider");
  for (const c of celulas) {
    if (c.id_lider) {
      await knex("celula_lider").insert({
        id_celula: c.id_celula,
        id_usuario: c.id_lider,
        principal: true,
      });
    }
  }

  // 3. Remover id_lider de celula
  await knex.schema.alterTable("celula", (table) => {
    table.dropForeign(["id_lider"]);
    table.dropColumn("id_lider");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // 1. Adicionar id_lider de volta
  await knex.schema.alterTable("celula", (table) => {
    table
      .integer("id_lider")
      .unsigned()
      .nullable()
      .references("id_usuario")
      .inTable("usuario")
      .onDelete("RESTRICT");
  });

  // 2. Migrar principal de volta
  const lideres = await knex("celula_lider")
    .where({ principal: true })
    .select("id_celula", "id_usuario");
  for (const l of lideres) {
    await knex("celula").where({ id_celula: l.id_celula }).update({ id_lider: l.id_usuario });
  }

  await knex.schema.alterTable("celula", (table) => {
    table.integer("id_lider").unsigned().notNullable().alter();
  });

  // 3. Dropar celula_lider
  await knex.schema.dropTable("celula_lider");
};
