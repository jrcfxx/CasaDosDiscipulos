import knex from "../database/index.js";

/**
 * Seed para respostas de quiz (quiz_resposta)
 * Exemplos de respostas dos usuários às questões
 * Depende de: seed_usuario, seed_quiz, seed_quiz_questao
 */
export async function seed() {
  await knex("quiz_resposta").del();

  const membro1 = await knex("usuario").where({ email: "membro@test.com" }).first();
  const maria = await knex("usuario").where({ email: "maria@test.com" }).first();
  const quiz = await knex("quiz").select("id_quiz").orderBy("id_quiz").first();
  const questoes = quiz
    ? await knex("quiz_questao").where({ id_quiz: quiz.id_quiz }).orderBy("ordem")
    : [];

  if (!membro1 || !quiz || questoes.length === 0) {
    console.log("Execute seed_usuario, seed_quiz e seed_quiz_questao primeiro.");
    return;
  }

  const respostas = [];

  // Membro respondeu as questões do primeiro quiz (multipla_escolha e verdadeiro_falso)
  const q1 = questoes.find((q) => q.tipo_questao === "multipla_escolha");
  const q2 = questoes.find((q) => q.tipo_questao === "verdadeiro_falso");

  if (q1 && membro1) {
    respostas.push({
      id_questao: q1.id_questao,
      id_usuario: membro1.id_usuario,
      resposta: "a",
      correta: q1.resposta_correta === "a",
      pontos_obtidos: q1.resposta_correta === "a" ? (q1.pontos || 10) : 0,
    });
  }
  if (q2 && membro1) {
    respostas.push({
      id_questao: q2.id_questao,
      id_usuario: membro1.id_usuario,
      resposta: "v",
      correta: q2.resposta_correta === "v",
      pontos_obtidos: q2.resposta_correta === "v" ? (q2.pontos || 5) : 0,
    });
  }

  if (maria && q1) {
    respostas.push({
      id_questao: q1.id_questao,
      id_usuario: maria.id_usuario,
      resposta: "b",
      correta: false,
      pontos_obtidos: 0,
    });
  }

  if (respostas.length > 0) {
    await knex("quiz_resposta").insert(respostas);
  }

  console.log("✅ Respostas de quiz inseridas com sucesso!");
}
