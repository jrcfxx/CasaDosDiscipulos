import knex from "../database/index.js";

/**
 * Seed para quizzes
 * Cria quizzes vinculados a cada módulo
 */
export async function seed() {
  await knex("quiz").del();

  const modulos = await knex("modulo").select("id_modulo", "titulo").orderBy("ordem");

  if (modulos.length === 0) {
    console.log("Nenhum módulo encontrado. Execute seed_modulo.js primeiro.");
    return;
  }

  const quizzes = modulos.map((m, idx) => ({
    id_modulo: m.id_modulo,
    titulo: `Quiz: ${m.titulo}`,
    descricao: `Avalie seus conhecimentos sobre ${m.titulo.toLowerCase()}.`,
    ativo: true,
  }));

  await knex("quiz").insert(quizzes);
  const quizzesInseridos = await knex("quiz").select("id_quiz", "id_modulo").orderBy("id_quiz");
  if (quizzesInseridos.length > 0) {
    await knex("modulo_quiz").insert(
      quizzesInseridos.filter((q) => q.id_modulo).map((q) => ({ id_modulo: q.id_modulo, id_quiz: q.id_quiz }))
    );
  }
  console.log(`✅ ${quizzes.length} quizzes inseridos com sucesso!`);
}
