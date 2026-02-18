import knex from "../database/index.js";

/**
 * Seed para níveis iniciais do sistema
 */
export async function seed() {
  // Deletes ALL existing entries
  await knex("nivel").del();

  // Inserts seed entries
  await knex("nivel").insert([
    {
      id_nivel: 1,
      nome: "Iniciante",
      descricao: "Nível inicial para novos membros",
      ordem: 1,
      ativo: true,
    },
    {
      id_nivel: 2,
      nome: "Discípulo",
      descricao: "Completou módulos básicos",
      ordem: 2,
      ativo: true,
    },
    {
      id_nivel: 3,
      nome: "Discípulo Avançado",
      descricao: "Completou módulos intermediários",
      ordem: 3,
      ativo: true,
    },
    {
      id_nivel: 4,
      nome: "Líder em Formação",
      descricao: "Completou módulos avançados",
      ordem: 4,
      ativo: true,
    },
    {
      id_nivel: 5,
      nome: "Líder",
      descricao: "Completou todos os módulos",
      ordem: 5,
      ativo: true,
    },
  ]);
}
