import knex from "../database/index.js";

/**
 * Seed para lições educacionais
 * Lições são conteúdos para estudo das células
 */
export async function seed() {
  await knex("licao").del();

  await knex("licao").insert([
    {
      titulo: "Fundamentos da Caminhada Cristã",
      descricao: "Primeira lição sobre os fundamentos da fé",
      ativo: true,
    },
    {
      titulo: "A Vida de Oração",
      descricao: "Como desenvolver uma vida de oração consistente",
      ativo: true,
    },
    {
      titulo: "Vivendo em Comunidade",
      descricao: "A importância da igreja e das células",
      ativo: true,
    },
  ]);

  console.log("✅ Lições inseridas com sucesso!");
}
