/**
 * Teste de integração da pontuação de quiz — banco de DESENVOLVIMENTO.
 * Garante que pergunta aberta (discursiva) respondida soma os seus pontos e entra no máximo,
 * e que em branco vale zero. Cria e apaga seus próprios dados.
 * Uso: node scripts/testQuiz.js
 */
import knex from "../src/database/index.js";
import QuizRespostaService from "../src/services/QuizRespostaService.js";

if (process.env.NODE_ENV === "production") {
  console.error("Não rode este teste em produção.");
  process.exit(1);
}

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "OK  " : "FAIL"} ${msg}`);
  if (!cond) falhas += 1;
};

const sufixo = Date.now();
const usuarios = [];
let id_modulo = null;

async function main() {
  [id_modulo] = await knex("modulo").insert({
    titulo: `Teste quiz ${sufixo}`, ordem: 9999, ativo: true, obrigatorio: false,
  });
  const [id_quiz] = await knex("quiz").insert({ id_modulo, titulo: `Teste quiz ${sufixo}`, ativo: true });
  await knex("modulo_quiz").insert({ id_modulo, id_quiz });
  const [mc] = await knex("quiz_questao").insert({
    id_quiz, tipo_questao: "multipla_escolha", enunciado: "MC", pontos: 10, ordem: 1,
    opcoes: JSON.stringify([{ id: "a", texto: "A" }, { id: "b", texto: "B" }]), resposta_correta: "a",
  });
  const [vf] = await knex("quiz_questao").insert({
    id_quiz, tipo_questao: "verdadeiro_falso", enunciado: "VF", pontos: 5, ordem: 2,
    opcoes: JSON.stringify([{ id: "v", texto: "V" }, { id: "f", texto: "F" }]), resposta_correta: "v",
  });
  const [aberta] = await knex("quiz_questao").insert({
    id_quiz, tipo_questao: "discursiva", enunciado: "Aberta", pontos: 5, ordem: 3, obrigatoria: false,
  });

  const enviar = async (respMC, textoAberta) => {
    const [id_usuario] = await knex("usuario").insert({
      nome: "Teste Quiz", email: `teste.quiz.${sufixo}.${usuarios.length}@local.test`, senha: "x", tipo: "membro", ativo: true,
    });
    usuarios.push(id_usuario);
    const r = await QuizRespostaService.submitResponses(id_quiz, {
      id_usuario, id_modulo,
      respostas: [
        { id_questao: mc, resposta: respMC },
        { id_questao: vf, resposta: "v" },
        { id_questao: aberta, resposta: textoAberta },
      ],
    });
    const progresso = await knex("usuario_modulo").where({ id_usuario, id_modulo }).first();
    const respAberta = await knex("quiz_resposta").where({ id_usuario, id_questao: aberta }).first();
    return { r, progresso, respAberta };
  };

  const a = await enviar("b", "Minha resposta");
  ok(a.r.pontuacao_maxima === 20, `máximo inclui a pergunta aberta (${a.r.pontuacao_maxima}/20)`);
  ok(a.r.pontos_obtidos === 10, `aberta respondida soma os pontos: V/F 5 + aberta 5 = ${a.r.pontos_obtidos}`);
  ok(a.r.atingiu_50 === true && a.progresso.status === "concluido", "10/20 aprova (50%)");
  ok(a.respAberta.pontos_obtidos === 5 && a.respAberta.correta === null, "resposta aberta salva com 5 pontos e sem correção automática");

  const b = await enviar("b", "   ");
  ok(b.r.pontos_obtidos === 5, `aberta em branco vale zero (${b.r.pontos_obtidos})`);
  ok(b.r.atingiu_50 === false && b.progresso.status === "em_andamento", "5/20 não aprova");

  const c = await enviar("a", "Minha resposta");
  ok(c.r.pontos_obtidos === 20 && Number(c.progresso.nota_quiz) === 20, `tudo certo + aberta = 20/20 (nota salva ${c.progresso.nota_quiz})`);
}

main()
  .catch((err) => {
    console.error("Erro:", err.message);
    falhas += 1;
  })
  .finally(async () => {
    if (usuarios.length) await knex("usuario").whereIn("id_usuario", usuarios).del();
    if (id_modulo) await knex("modulo").where({ id_modulo }).del();
    await knex.destroy();
    console.log(falhas ? `\n${falhas} falha(s)` : "\nTodos os testes de quiz passaram.");
    process.exit(falhas ? 1 : 0);
  });
