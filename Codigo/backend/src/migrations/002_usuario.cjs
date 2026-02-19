/**
 * Tabela usuario - usuários do sistema (admin, líder, membro)
 * @param { import("knex").Knex } knex
 */
exports.up = (knex) =>
  knex.schema.createTable("usuario", (table) => {
    table.increments("id_usuario").primary();
    table.string("nome", 255).notNullable();
    table.string("email", 255).unique().notNullable();
    table.string("senha", 255).notNullable();
    table.enum("tipo", ["administrador", "lider", "membro"]).defaultTo("membro").notNullable();
    table.integer("pontuacao").defaultTo(0);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
    table.boolean("ativo").defaultTo(true);
    table.timestamp("ultimo_login").nullable();
    table.string("telefone", 20).nullable().comment("WhatsApp E.164");
    table.string("foto", 500).nullable();
    table
      .integer("id_nivel")
      .unsigned()
      .nullable()
      .references("id_nivel")
      .inTable("nivel")
      .onDelete("SET NULL");
    table.boolean("lider_celula").defaultTo(true).comment("Líder: acesso Secretaria");
    table.boolean("lider_ministerio").defaultTo(false).comment("Líder: acesso Escala");
  });

exports.down = (knex) => knex.schema.dropTableIfExists("usuario");
