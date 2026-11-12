/**
 * Staff / estrutura da Casa (organograma editável pelo admin).
 * - staff_item: árvore (grupo → função → subfunção...) com o nome das pessoas
 * - site_config: textos simples do site (título e subtítulo da seção)
 * Já carrega o organograma que era exibido como imagem (Staff Casa 2026), sem a célula Farol.
 * @param { import("knex").Knex } knex
 */
const ESTRUTURA_INICIAL = [
  {
    titulo: "Diretoria Adm.",
    filhos: [
      ["Presidente", "Wanderson Lino"],
      ["Vice 1", "Wilza Leal"],
      ["Vice 2", "Arlem Cleizer"],
      ["Secretárias", "Lorrayne Andrade, Valquiria Kelly"],
      ["Tesoureiras", "Nuzia Resende, Ana Paula Silva"],
    ],
  },
  {
    titulo: "Ministerial",
    filhos: [
      {
        titulo: "Pastoral",
        pessoas: "Pr. Wanderson e equipe",
        filhos: [
          ["Escola de Discípulos", "Iza, Evaldo"],
          ["Kids", "Iza"],
          ["Adolescentes", null],
          ["Juventude", "Ana Paula"],
          ["Mulheres Casa", "Simone"],
          ["Casais Casa", "Tabelines"],
        ],
      },
      ["Louvor", "Samuel Augusto"],
      ["Intercessão", "Lea"],
      ["Dança", "Lorrayne Carmo"],
      ["Coral", "Normandes Resende"],
      ["Ação social", "Elinar"],
    ],
  },
  {
    titulo: "Apoio",
    filhos: [
      ["Voluntários", "Lorrayne Andrade"],
      ["Mídia", "Thais"],
      ["Secretaria de células", null],
      ["Decoração", "Lo Andrade"],
      ["Manutenção", "Cleiton"],
    ],
  },
  {
    titulo: "Células",
    filhos: [
      {
        titulo: "GD mãe",
        pessoas: "FLECHA",
        filhos: [
          ["Pérolas", "Iza"],
          ["Videira", "Simone"],
          ["Morada", "Kelly"],
          ["Resgate", "Arlem"],
          ["Visão", "Lorrayne"],
        ],
      },
    ],
  },
];

async function inserir(knex, itens, idPai) {
  for (let i = 0; i < itens.length; i++) {
    const item = Array.isArray(itens[i]) ? { titulo: itens[i][0], pessoas: itens[i][1] } : itens[i];
    const [id] = await knex("staff_item").insert({
      id_pai: idPai,
      titulo: item.titulo,
      pessoas: item.pessoas ?? null,
      ordem: i,
    });
    if (item.filhos?.length) await inserir(knex, item.filhos, id);
  }
}

exports.up = async (knex) => {
  if (!(await knex.schema.hasTable("staff_item"))) {
    await knex.schema.createTable("staff_item", (table) => {
      table.increments("id_staff_item").primary();
      table
        .integer("id_pai")
        .unsigned()
        .nullable()
        .references("id_staff_item")
        .inTable("staff_item")
        .onDelete("CASCADE");
      table.string("titulo", 120).notNullable().comment("Grupo ou função (ex.: Louvor)");
      table.string("pessoas", 255).nullable().comment("Responsáveis; vazio = a definir");
      table.integer("ordem").notNullable().defaultTo(0);
      table.timestamp("data_criacao").defaultTo(knex.fn.now());
      table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
      table.index(["id_pai", "ordem"], "idx_staff_item_pai_ordem");
    });
  }

  if (!(await knex.schema.hasTable("site_config"))) {
    await knex.schema.createTable("site_config", (table) => {
      table.string("chave", 80).primary();
      table.text("valor").nullable();
      table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
    });
  }

  const [{ n }] = await knex("staff_item").count({ n: "*" });
  if (Number(n) === 0) {
    await inserir(knex, ESTRUTURA_INICIAL, null);
  }
  for (const [chave, valor] of [
    ["staff_titulo", "Staff Casa 2026"],
    ["staff_subtitulo", "Diretoria, ministérios, apoio e células sob a GD mãe FLECHA."],
  ]) {
    const existe = await knex("site_config").where({ chave }).first();
    if (!existe) await knex("site_config").insert({ chave, valor });
  }
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("staff_item");
  await knex("site_config").whereIn("chave", ["staff_titulo", "staff_subtitulo"]).del().catch(() => {});
};
