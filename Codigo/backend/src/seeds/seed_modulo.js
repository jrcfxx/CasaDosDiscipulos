import knex from "../database/index.js";

/**
 * Seed para módulos de treinamento
 * Cada módulo contém conteúdo educacional + quiz avaliativo
 * Depende de: seed_nivel (id_nivel)
 */
export async function seed() {
  await knex("modulo_pre_requisito").del();
  await knex("modulo").del();

  const nivel1 = await knex("nivel").where({ ordem: 1 }).first();
  const nivel2 = await knex("nivel").where({ ordem: 2 }).first();
  const nivel3 = await knex("nivel").where({ ordem: 3 }).first();

  await knex("modulo").insert([
    {
      titulo: "Fundamentos da Fé",
      descricao: "Aprenda os conceitos básicos da fé cristã",
      ordem: 1,
      ativo: true,
      id_nivel: nivel1?.id_nivel ?? null,
    },
    {
      titulo: "Discipulado",
      descricao: "O caminho do discipulado cristão",
      ordem: 2,
      ativo: true,
      id_nivel: nivel2?.id_nivel ?? null,
    },
    {
      titulo: "Liderança Cristã",
      descricao: "Princípios de liderança segundo a Bíblia",
      ordem: 3,
      ativo: true,
      id_nivel: nivel3?.id_nivel ?? null,
    },
  ]);

  // Pré-requisito: módulo 2 requer módulo 1, módulo 3 requer módulo 2
  const modulos = await knex("modulo").select("id_modulo").orderBy("ordem");
  if (modulos.length >= 3) {
    await knex("modulo_pre_requisito").insert([
      { id_modulo: modulos[1].id_modulo, id_modulo_requerido: modulos[0].id_modulo },
      { id_modulo: modulos[2].id_modulo, id_modulo_requerido: modulos[1].id_modulo },
    ]);
  }

  console.log("✅ Módulos inseridos com sucesso!");
}
