import knex from "../database/index.js";

/**
 * Seed para respostas de quiz
 * Exemplos de respostas dos usuários às questões
 */
export async function seed() {
  await knex("quiz_resposta").del();

  const usuarios = await knex("usuario").select("id_usuario", "email").where({ ativo: true });
  const quizzes = await knex("quiz").select("id_quiz").orderBy("id_quiz");
  const getUsuario = (email) => usuarios.find((u) => u.email === email);

  const membro1 = getUsuario("membro@test.com");
  const maria = getUsuario("maria@test.com");
  const joao = getUsuario("joao@test.com");
  const fernanda = getUsuario("fernanda@test.com");
  const pedro = getUsuario("pedro@test.com");

  if (!membro1 || quizzes.length === 0) {
    console.log("Execute seed_usuario e seed_quiz primeiro.");
    return;
  }

  const respostas = [];
  for (const quiz of quizzes.slice(0, 5)) {
    const questoes = await knex("quiz_questao").where({ id_quiz: quiz.id_quiz }).orderBy("ordem");
    const multipla = questoes.find((q) => q.tipo_questao === "multipla_escolha");
    const vf = questoes.find((q) => q.tipo_questao === "verdadeiro_falso");

    const usersToAdd = [membro1, maria, joao, fernanda, pedro].filter(Boolean);
    usersToAdd.forEach((u, idx) => {
      if (multipla) {
        const resp = idx % 3 === 0 ? multipla.resposta_correta : "b";
        respostas.push({
          id_questao: multipla.id_questao,
          id_usuario: u.id_usuario,
          resposta: resp,
          correta: resp === multipla.resposta_correta,
          pontos_obtidos: resp === multipla.resposta_correta ? (multipla.pontos || 10) : 0,
        });
      }
      if (vf) {
        const resp = idx % 2 === 0 ? vf.resposta_correta : "f";
        respostas.push({
          id_questao: vf.id_questao,
          id_usuario: u.id_usuario,
          resposta: resp,
          correta: resp === vf.resposta_correta,
          pontos_obtidos: resp === vf.resposta_correta ? (vf.pontos || 5) : 0,
        });
      }
    });
  }

  if (respostas.length > 0) {
    await knex("quiz_resposta").insert(respostas);
  }
  console.log(`✅ ${respostas.length} respostas de quiz inseridas com sucesso!`);
}
