import knex from "../database/index.js";

/**
 * Seed para módulos de treinamento
 * Cada módulo contém conteúdo educacional + quiz avaliativo
 */
export async function seed() {
  await knex("modulo").del();

  await knex("modulo").insert([
    {
      titulo: "Fundamentos da Fé",
      descricao: "Aprenda os conceitos básicos da fé cristã",
      ordem: 1,
      ativo: true,
    },
    {
      titulo: "Discipulado",
      descricao: "O caminho do discipulado cristão",
      ordem: 2,
      ativo: true,
    },
    {
      titulo: "Liderança Cristã",
      descricao: "Princípios de liderança segundo a Bíblia",
      ordem: 3,
      ativo: true,
    },
  ]);

  console.log("✅ Módulos inseridos com sucesso!");
}
