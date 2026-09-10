/**
 * Escala avançada: status, id_ministerio em área, histórico, templates, índices
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  const hasStatus = await knex.schema.hasColumn("escala_evento", "status");
  if (!hasStatus) {
    await knex.schema.alterTable("escala_evento", (table) => {
      table
        .string("status", 20)
        .notNullable()
        .defaultTo("publicada")
        .comment("rascunho | publicada | concluida");
    });
    await knex("escala_evento").where("ativo", true).update({ status: "publicada" });
    await knex("escala_evento").where("ativo", false).update({ status: "rascunho" });
  }

  const hasIdxData = await knex.raw(
    `SELECT COUNT(1) AS c FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'escala_evento' AND index_name = 'idx_escala_evento_data_hora'`
  );
  if (!hasIdxData[0][0]?.c) {
    await knex.schema.alterTable("escala_evento", (table) => {
      table.index(["data_hora"], "idx_escala_evento_data_hora");
      table.index(["status"], "idx_escala_evento_status");
    });
  }

  const hasIdMinisterio = await knex.schema.hasColumn("escala_area", "id_ministerio");
  if (!hasIdMinisterio) {
    await knex.schema.alterTable("escala_area", (table) => {
      table
        .integer("id_ministerio")
        .unsigned()
        .nullable()
        .references("id_ministerio")
        .inTable("ministerio")
        .onDelete("SET NULL");
      table.index(["id_ministerio"], "idx_escala_area_ministerio");
    });

    // Backfill por nome
    const areas = await knex("escala_area").select("id_escala_area", "nome");
    const ministerios = await knex("ministerio").select("id_ministerio", "nome");
    const map = new Map(
      ministerios.map((m) => [String(m.nome).toLowerCase().trim(), m.id_ministerio])
    );
    for (const area of areas) {
      const idMin = map.get(String(area.nome).toLowerCase().trim());
      if (idMin) {
        await knex("escala_area")
          .where("id_escala_area", area.id_escala_area)
          .update({ id_ministerio: idMin });
      }
    }
  }

  const hasHistorico = await knex.schema.hasTable("escala_historico");
  if (!hasHistorico) {
    await knex.schema.createTable("escala_historico", (table) => {
      table.increments("id_escala_historico").primary();
      table
        .integer("id_escala_evento")
        .unsigned()
        .nullable()
        .references("id_escala_evento")
        .inTable("escala_evento")
        .onDelete("SET NULL");
      table
        .integer("id_usuario")
        .unsigned()
        .nullable()
        .references("id_usuario")
        .inTable("usuario")
        .onDelete("SET NULL");
      table.string("acao", 40).notNullable();
      table.text("dados_antes").nullable();
      table.text("dados_depois").nullable();
      table.timestamp("criado_em").defaultTo(knex.fn.now());
      table.index(["id_escala_evento"], "idx_escala_historico_evento");
    });
  }

  const hasTemplate = await knex.schema.hasTable("escala_template");
  if (!hasTemplate) {
    await knex.schema.createTable("escala_template", (table) => {
      table.increments("id_escala_template").primary();
      table.string("nome", 150).notNullable();
      table
        .integer("id_criador")
        .unsigned()
        .nullable()
        .references("id_usuario")
        .inTable("usuario")
        .onDelete("SET NULL");
      table.text("payload").notNullable().comment("JSON: áreas + slots");
      table.timestamp("criado_em").defaultTo(knex.fn.now());
      table.timestamp("atualizado_em").defaultTo(knex.fn.now());
    });
  }
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("escala_template");
  await knex.schema.dropTableIfExists("escala_historico");

  if (await knex.schema.hasColumn("escala_area", "id_ministerio")) {
    await knex.schema.alterTable("escala_area", (table) => {
      table.dropForeign(["id_ministerio"]);
      table.dropIndex(["id_ministerio"], "idx_escala_area_ministerio");
      table.dropColumn("id_ministerio");
    });
  }

  if (await knex.schema.hasColumn("escala_evento", "status")) {
    await knex.schema.alterTable("escala_evento", (table) => {
      table.dropIndex(["data_hora"], "idx_escala_evento_data_hora");
      table.dropIndex(["status"], "idx_escala_evento_status");
      table.dropColumn("status");
    });
  }
};
