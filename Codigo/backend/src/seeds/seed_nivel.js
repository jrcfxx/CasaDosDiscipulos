import knex from "../database/index.js";

/**
 * Seed para níveis iniciais do sistema
 * Usado por usuario (id_nivel) e modulo (id_nivel)
 */
export async function seed() {
  await knex("nivel").del();

  await knex("nivel").insert([
    { nome: "Iniciante", descricao: "Nível inicial para novos membros", ordem: 1, ativo: true },
    { nome: "Discípulo", descricao: "Completou módulos básicos", ordem: 2, ativo: true },
    { nome: "Discípulo Avançado", descricao: "Completou módulos intermediários", ordem: 3, ativo: true },
    { nome: "Líder em Formação", descricao: "Completou módulos avançados", ordem: 4, ativo: true },
    { nome: "Líder", descricao: "Completou todos os módulos", ordem: 5, ativo: true },
  ]);

  console.log("✅ Níveis inseridos com sucesso!");
}
