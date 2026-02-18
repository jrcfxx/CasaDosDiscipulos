import knex from "../database/index.js";

/**
 * Seed para formulários da Secretaria
 * Cria formulários que serão preenchidos pelos líderes
 */
export async function seed() {
  await knex("formulario").del();

  await knex("formulario").insert([
    {
      titulo: "Relatório de Célula",
      descricao: "Preencha após cada reunião da célula",
      ativo: true,
    },
    {
      titulo: "Pedidos de Oração",
      descricao: "Registre pedidos de oração dos membros",
      ativo: true,
    },
    {
      titulo: "Avaliação de Evento",
      descricao: "Feedback sobre eventos e atividades da igreja",
      ativo: true,
    },
  ]);

  console.log("✅ Formulários inseridos com sucesso!");
}
