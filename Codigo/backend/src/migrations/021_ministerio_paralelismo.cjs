/**
 * Pares de paralelismo entre ministérios:
 * a mesma pessoa pode ser escalada nos dois no mesmo evento.
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  const exists = await knex.schema.hasTable("ministerio_paralelismo");
  if (exists) {
    await knex.schema.dropTable("ministerio_paralelismo");
  }

  await knex.schema.createTable("ministerio_paralelismo", (table) => {
    table.increments("id_ministerio_paralelismo").primary();
    table
      .integer("id_ministerio")
      .unsigned()
      .notNullable()
      .references("ministerio.id_ministerio")
      .onDelete("CASCADE");
    table
      .integer("id_ministerio_paralelo")
      .unsigned()
      .notNullable()
      .references("ministerio.id_ministerio")
      .onDelete("CASCADE");
    table.unique(["id_ministerio", "id_ministerio_paralelo"], {
      indexName: "uq_min_paralelismo",
    });
    table.index(["id_ministerio_paralelo"], "idx_min_paralelo");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("ministerio_paralelismo");
};
