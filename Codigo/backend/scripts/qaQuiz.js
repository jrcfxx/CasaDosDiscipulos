/**
 * QA de ponta a ponta da criação/edição de QUIZZES (Secretaria) pela API.
 * Precisa do backend rodando em http://localhost:3001 e do banco local.
 * Uso: npm run qa:quiz
 * Cria quizzes "QA …" e apaga tudo no final.
 */
import "dotenv/config";
import knex from "../src/database/index.js";
import { gerarToken } from "../src/services/authService.js";

const API = "http://localhost:3001/api";
const falhas = [];
let oks = 0;
const ok = (cond, nome, detalhe = "") => {
  if (cond) {
    oks++;
    console.log(`OK     ${nome}`);
  } else {
    falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
    console.log(`FALHA  ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  }
};

let token;
async function api(metodo, caminho, corpo) {
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  let bruto = null;
  try {
    bruto = await r.json();
  } catch {
    /* sem corpo */
  }
  return { status: r.status, bruto };
}
const resumo = (r) => `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 180)}`;

async function main() {
  const admin = await knex("usuario").where({ id_usuario: 182 }).first(); // admin de teste local
  token = gerarToken(admin);
  const tipos = Object.fromEntries((await knex("campo_personalizado")).map((c) => [c.tipo_campo, c.id_campo]));
  const me = (enunciado, alternativas) => ({
    id_campo: tipos.multipla_escolha,
    label: enunciado,
    conteudo: JSON.stringify({ alternativas }),
  });
  const P1 = me("Quem construiu a arca?", [{ texto: "Noé", correta: true }, { texto: "Moisés", correta: false }]);
  const P2 = { id_campo: tipos.verdadeiro_falso, label: "Jesus nasceu em Belém", conteudo: "true" };
  const P3 = me("Quantos discípulos?", [{ texto: "7", correta: false }, { texto: "12", correta: true }]);
  const TXT = { id_campo: tipos.texto, label: "Leia antes", conteudo: "Leia Gênesis 6." };

  console.log("\n== 1. Criação");
  let r = await api("POST", "/quiz", { titulo: "  QA Quiz A  ", descricao: " desc ", campos: [TXT, P1, P2, P3] });
  ok(r.status === 201, "quiz válido é criado", resumo(r));
  const id = r.bruto?.id_quiz;
  ok(r.bruto?.titulo === "QA Quiz A", "título sem espaços nas pontas", JSON.stringify(r.bruto?.titulo));
  ok(r.bruto?.questoes?.length === 3, "3 perguntas viram questões (o texto de apoio não)", String(r.bruto?.questoes?.length));
  r = await api("POST", "/quiz", { titulo: "  ab " });
  ok(r.status === 400, "título curto: 400", resumo(r));

  console.log("\n== 2. Respostas continuam na pergunta certa ao reorganizar");
  const q = (await api("GET", `/quiz/${id}`)).bruto.questoes;
  const idDe = (enunciado) => q.find((x) => x.enunciado === enunciado)?.id_questao;
  const aluno = await knex("usuario").whereNot({ id_usuario: 182 }).first();
  await knex("quiz_resposta").insert([
    { id_questao: idDe("Quem construiu a arca?"), id_usuario: aluno.id_usuario, resposta: "A", correta: 1, pontos_obtidos: 10 },
    { id_questao: idDe("Quantos discípulos?"), id_usuario: aluno.id_usuario, resposta: "B", correta: 1, pontos_obtidos: 10 },
  ]);
  // Inverte a ordem: P3, P2, TXT, P1
  r = await api("PUT", `/quiz/${id}`, { campos: [P3, P2, TXT, P1] });
  ok(r.status === 200, "salvar com as perguntas em outra ordem", resumo(r));
  const depois = (await api("GET", `/quiz/${id}`)).bruto.questoes;
  ok(depois.map((x) => x.enunciado).join("|") === "Quantos discípulos?|Jesus nasceu em Belém|Quem construiu a arca?", "questões na nova ordem", JSON.stringify(depois.map((x) => x.enunciado)));
  const respArca = await knex("quiz_resposta").join("quiz_questao", "quiz_questao.id_questao", "quiz_resposta.id_questao").where("quiz_resposta.id_usuario", aluno.id_usuario).where("quiz_questao.id_quiz", id).select("quiz_questao.enunciado", "quiz_resposta.resposta");
  ok(
    respArca.find((x) => x.enunciado === "Quem construiu a arca?")?.resposta === "A" &&
      respArca.find((x) => x.enunciado === "Quantos discípulos?")?.resposta === "B",
    "cada resposta continua ligada à mesma pergunta depois de reordenar",
    JSON.stringify(respArca)
  );
  // Remove a pergunta do meio (V/F): as outras respostas não podem mudar de pergunta
  r = await api("PUT", `/quiz/${id}`, { campos: [P3, TXT, P1] });
  const respDepois = await knex("quiz_resposta").join("quiz_questao", "quiz_questao.id_questao", "quiz_resposta.id_questao").where("quiz_resposta.id_usuario", aluno.id_usuario).where("quiz_questao.id_quiz", id).select("quiz_questao.enunciado", "quiz_resposta.resposta");
  ok(r.status === 200 && respDepois.length === 2 && respDepois.find((x) => x.enunciado === "Quem construiu a arca?")?.resposta === "A", "tirar uma pergunta do meio não troca as respostas de lugar", JSON.stringify(respDepois));

  console.log("\n== 3. Ativar/desativar e contagem de respostas");
  const camposAntes = (await api("GET", `/quiz/${id}`)).bruto.campos.length;
  r = await api("PUT", `/quiz/${id}`, { ativo: false });
  ok(r.status === 200 && !r.bruto?.ativo, "desativar só com {ativo:false}", resumo(r));
  ok(r.bruto?.campos?.length === camposAntes, "desativar não mexe nas perguntas", `${r.bruto?.campos?.length} vs ${camposAntes}`);
  r = await api("GET", `/quiz/${id}/total-respostas`);
  ok(r.status === 200 && r.bruto?.respostas === 2 && r.bruto?.alunos === 1, "total de respostas para o aviso de excluir", resumo(r));
  r = await api("GET", `/quiz/abc`);
  ok(r.status === 400, "id inválido: 400", resumo(r));

  console.log("\n== 4. Quiz antigo (só perguntas, sem campos) aparece no editor");
  const [idLegado] = await knex("quiz").insert({ titulo: "QA Quiz legado", ativo: 1 });
  await knex("quiz_questao").insert([
    { id_quiz: idLegado, tipo_questao: "multipla_escolha", enunciado: "Pergunta antiga", pontos: 5, ordem: 1, opcoes: JSON.stringify([{ id: "a", texto: "Sim" }, { id: "b", texto: "Não" }]), resposta_correta: "a" },
    { id_quiz: idLegado, tipo_questao: "verdadeiro_falso", enunciado: "Afirmação antiga", pontos: 5, ordem: 2, opcoes: JSON.stringify([{ id: "v", texto: "Verdadeiro" }, { id: "f", texto: "Falso" }]), resposta_correta: "v" },
  ]);
  const legado = (await api("GET", `/quiz/${idLegado}`)).bruto;
  ok(legado?.campos?.length === 2 && legado.campos[0].label === "Pergunta antiga", "perguntas antigas viram campos editáveis", JSON.stringify(legado?.campos?.map((c) => c.label)));
  const alt = JSON.parse(legado?.campos?.[0]?.conteudo || "{}").alternativas || [];
  ok(alt.length === 2 && alt[0].correta === true && legado.campos[1].conteudo === "true", "alternativas e resposta certa vêm junto", JSON.stringify(legado?.campos));
  const idAntigo = legado.questoes[0].id_questao;
  r = await api("PUT", `/quiz/${idLegado}`, { campos: legado.campos.map(({ id_campo, label, conteudo }) => ({ id_campo, label, conteudo })) });
  const q2 = (await api("GET", `/quiz/${idLegado}`)).bruto.questoes;
  ok(r.status === 200 && q2[0].id_questao === idAntigo && q2[0].resposta_correta === "a", "salvar sem mudar nada mantém as questões antigas como estavam", JSON.stringify(q2[0]));
}

main()
  .catch((e) => {
    falhas.push(`script parou: ${e.message}`);
    console.error("ERRO NO SCRIPT:", e);
  })
  .finally(async () => {
    const ids = (await knex("quiz").where("titulo", "like", "QA %").select("id_quiz")).map((x) => x.id_quiz);
    if (ids.length) {
      const qs = (await knex("quiz_questao").whereIn("id_quiz", ids).select("id_questao")).map((x) => x.id_questao);
      if (qs.length) await knex("quiz_resposta").whereIn("id_questao", qs).del();
      await knex("quiz_questao").whereIn("id_quiz", ids).del();
      await knex("quiz_campo").whereIn("id_quiz", ids).del();
      await knex("modulo_quiz").whereIn("id_quiz", ids).del().catch(() => {});
      await knex("quiz").whereIn("id_quiz", ids).del();
    }
    console.log(`\n${oks} OK, ${falhas.length} FALHA(S)`);
    for (const f of falhas) console.log(` - ${f}`);
    await knex.destroy();
    process.exit(falhas.length ? 1 : 0);
  });
