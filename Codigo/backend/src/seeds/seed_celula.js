import knex from "../database/index.js";

/**
 * Seed para células da igreja
 * Cria células de exemplo vinculadas aos líderes cadastrados
 */
export async function seed() {
  await knex("celula").del();

  // Buscar o ID do líder cadastrado
  const lider = await knex("usuario").where({ tipo: "lider" }).first();

  if (!lider) {
    console.log("Nenhum líder encontrado. Execute seed_usuario.js primeiro.");
    return;
  }

  await knex("celula").insert([
    {
      nome: "Célula Esperança",
      endereco: "Rua das Flores, 123 - Centro",
      dia_reuniao: "quarta",
      horario_reuniao: "19:30:00",
      id_lider: lider.id_usuario,
      ativa: true,
    },
    {
      nome: "Célula Renovação",
      endereco: "Av. Principal, 456 - Bairro Novo",
      dia_reuniao: "quinta",
      horario_reuniao: "20:00:00",
      id_lider: lider.id_usuario,
      ativa: true,
    },
    {
      nome: "Célula Fé e Vida",
      endereco: "Rua do Comércio, 789 - Vila Rosa",
      dia_reuniao: "sexta",
      horario_reuniao: "19:00:00",
      id_lider: lider.id_usuario,
      ativa: true,
    },
  ]);

  console.log("✅ Células inseridas com sucesso!");
}
