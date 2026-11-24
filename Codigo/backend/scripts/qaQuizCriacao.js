/**
 * QA da criação de quiz pela Secretaria — banco de DESENVOLVIMENTO.
 * Cobre: pergunta checkbox (antes dava 500), Verdadeiro/Falso com resposta "true",
 * e que um erro no meio não deixa quiz pela metade. Cria e apaga seus próprios dados.
 * Uso: node scripts/qaQuizCriacao.js
 */
import knex from "../src/database/index.js";
import QuizService from "../src/services/QuizService.js";

if (process.env.NODE_ENV === "production") {
  console.error("Não rode este teste em produção.");
  process.exit(1);
}

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "OK  " : "FAIL"} ${msg}`);
  if (!cond) falhas += 1;
};
const idCampo = async (tipo) =>
  (await knex("campo_personalizado").where({ tipo_campo: tipo }).first())?.id_campo;

const criados = [];
async function main() {
  const titulo = `QA quiz ${Date.now()}`;
  const quiz = await QuizService.create({
    titulo,
    ativo: true,
    campos: [
      { id_campo: await idCampo("texto"), label: "Leia antes", conteudo: "Instrução" },
      {
        id_campo: await idCampo("checkbox"), label: "Quais são frutos do Espírito?",
        conteudo: JSON.stringify({ alternativas: [
          { texto: "Amor", correta: true }, { texto: "Ira", correta: false }, { texto: "Paz", correta: true },
        ] }),
      },
      { id_campo: await idCampo("verdadeiro_falso"), label: "Jesus nasceu em Belém", conteudo: true },
      {
        id_campo: await idCampo("multipla_escolha"), label: "Primeiro rei",
        conteudo: JSON.stringify({ alternativas: [{ texto: "Davi", correta: false }, { texto: "Saul", correta: true }] }),
      },
    ],
  });
  criados.push(quiz.id_quiz);
  const q = quiz.questoes;
  ok(q.length === 3, `3 questões sincronizadas (veio ${q.length})`);
  ok(q[0]?.tipo_questao === "checkbox" && q[0]?.resposta_correta === "A,C", "checkbox salvo com gabarito A,C");
  ok(q[1]?.tipo_questao === "verdadeiro_falso" && q[1]?.resposta_correta === "v", "V/F true -> gabarito Verdadeiro");
  ok(q[2]?.resposta_correta === "B", "múltipla escolha com gabarito B");
  ok(quiz.campos.map((c) => c.label).join("|") === "Leia antes|Quais são frutos do Espírito?|Jesus nasceu em Belém|Primeiro rei", "campos na ordem enviada");

  // Erro no meio da criação não deixa quiz órfão
  const tituloRuim = `QA quiz ruim ${Date.now()}`;
  let falhou = false;
  try {
    await QuizService.create({ titulo: tituloRuim, campos: [{ id_campo: 999999, label: "x", conteudo: "" }] });
  } catch {
    falhou = true;
  }
  const orfao = await knex("quiz").where({ titulo: tituloRuim }).first();
  if (orfao) criados.push(orfao.id_quiz);
  ok(falhou && !orfao, "falha na criação não deixa quiz pela metade");
}

main()
  .catch((e) => { console.error(e); falhas += 1; })
  .finally(async () => {
    if (criados.length) await knex("quiz").whereIn("id_quiz", criados).del();
    await knex.destroy();
    console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
    process.exit(falhas ? 1 : 0);
  });
