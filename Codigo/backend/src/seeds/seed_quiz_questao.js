import knex from "../database/index.js";

/**
 * Seed para questões de quiz
 * Cria questões de diferentes tipos para os quizzes cadastrados
 */
export async function seed() {
  await knex("quiz_questao").del();

  // Buscar quizzes cadastrados
  const quizzes = await knex("quiz").select("id_quiz", "titulo");

  if (quizzes.length === 0) {
    console.log("Nenhum quiz encontrado. Execute seed_quiz.js primeiro.");
    return;
  }

  const questoes = [];

  // Para cada quiz, criar 3 questões de exemplo
  quizzes.forEach((quiz, idx) => {
    // Questão múltipla escolha
    questoes.push({
      id_quiz: quiz.id_quiz,
      tipo_questao: "multipla_escolha",
      enunciado: `Questão de múltipla escolha sobre ${quiz.titulo}`,
      pontos: 10,
      ordem: 1,
      opcoes: JSON.stringify([
        { id: "a", texto: "Opção A" },
        { id: "b", texto: "Opção B" },
        { id: "c", texto: "Opção C" },
        { id: "d", texto: "Opção D" },
      ]),
      resposta_correta: "a",
    });

    // Questão verdadeiro/falso
    questoes.push({
      id_quiz: quiz.id_quiz,
      tipo_questao: "verdadeiro_falso",
      enunciado: `Afirmação verdadeira ou falsa sobre ${quiz.titulo}`,
      pontos: 5,
      ordem: 2,
      opcoes: JSON.stringify([
        { id: "v", texto: "Verdadeiro" },
        { id: "f", texto: "Falso" },
      ]),
      resposta_correta: "v",
    });

    // Questão discursiva
    questoes.push({
      id_quiz: quiz.id_quiz,
      tipo_questao: "discursiva",
      enunciado: `Explique com suas palavras o conceito principal de ${quiz.titulo}`,
      pontos: 15,
      ordem: 3,
      opcoes: null,
      resposta_correta: null, // Discursivas não têm resposta automática
    });
  });

  await knex("quiz_questao").insert(questoes);

  console.log(`✅ ${questoes.length} questões de quiz inseridas com sucesso!`);
}
