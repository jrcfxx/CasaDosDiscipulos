/**
 * Teste de integração das correções de segurança/dados (banco de DESENVOLVIMENTO).
 *  C1 abrir quiz não apaga respostas · C2 gabarito não vaza · C3 uploads seguros
 *  C4 relatórios de célula isolados por líder
 * Cria dados de teste e apaga tudo no final.  Uso: node scripts/testSeguranca.js
 */
import knex from "../src/database/index.js";
import QuizService from "../src/services/QuizService.js";
import QuizController from "../src/controllers/QuizController.js";
import FormularioRespostaService from "../src/services/FormularioRespostaService.js";
import { protegerUploads, extensaoPermitida } from "../src/config/uploadSeguro.js";
import { USER_TYPES } from "../src/utils/constants.js";

if (process.env.NODE_ENV === "production") {
  console.error("Não rode este teste em produção.");
  process.exit(1);
}

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "OK  " : "FAIL"} ${msg}`);
  if (!cond) falhas += 1;
};
const limpeza = [];

async function testeC1eC2() {
  const campo = await knex("campo_personalizado").where({ tipo_campo: "multipla_escolha" }).first();
  if (!campo) return ok(false, "C1: precisa de um campo_personalizado multipla_escolha (rode o seed)");
  const usuario = await knex("usuario").where({ ativo: true }).first();

  const [idQuiz] = await knex("quiz").insert({ titulo: "TESTE quiz secretaria", ativo: true });
  limpeza.push(() => knex("quiz").where({ id_quiz: idQuiz }).del());
  const conteudo = JSON.stringify({
    alternativas: [
      { texto: "Errada", correta: false },
      { texto: "Certa", correta: true },
    ],
  });
  await knex("quiz_campo").insert({ id_quiz: idQuiz, id_campo: campo.id_campo, label: "Pergunta 1", conteudo });

  const q1 = await QuizService.getById(idQuiz);
  const idQuestao = q1.questoes[0]?.id_questao;
  ok(!!idQuestao, "C1: questão criada a partir do campo da Secretaria");
  await knex("quiz_resposta").insert({ id_questao: idQuestao, id_usuario: usuario.id_usuario, resposta: "B", correta: true, pontos_obtidos: 10 });

  // Abrir o quiz várias vezes não pode apagar a resposta
  await QuizService.getById(idQuiz);
  await QuizService.getById(idQuiz);
  const q2 = await QuizService.getById(idQuiz);
  const [{ n }] = await knex("quiz_resposta").where({ id_questao: idQuestao }).count({ n: "*" });
  ok(q2.questoes[0]?.id_questao === idQuestao, "C1: id da questão preservado após reabrir");
  ok(Number(n) === 1, `C1: resposta do usuário continua salva (${n})`);

  // Admin altera o enunciado: atualiza no lugar, resposta continua
  await knex("quiz_campo").where({ id_quiz: idQuiz }).update({ label: "Pergunta 1 (editada)" });
  const q3 = await QuizService.getById(idQuiz);
  const [{ n: n2 }] = await knex("quiz_resposta").where({ id_questao: idQuestao }).count({ n: "*" });
  ok(q3.questoes[0]?.enunciado === "Pergunta 1 (editada)" && Number(n2) === 1, "C1: edição atualiza a questão sem perder respostas");

  // C2: membro não recebe gabarito em nenhum lugar
  let enviado;
  const res = { status: () => res, json: (d) => (enviado = d) };
  await QuizController.getById({ params: { id: idQuiz }, usuario: { tipo: USER_TYPES.MEMBER } }, res, (e) => { throw e; });
  const texto = JSON.stringify(enviado);
  ok(!/"correta"/.test(texto) && !/resposta_correta/.test(texto), "C2: resposta do membro sem 'correta' nem 'resposta_correta'");
  ok(enviado.campos?.[0]?.conteudo?.includes("Certa"), "C2: alternativas continuam visíveis (só o gabarito sai)");
  await QuizController.getById({ params: { id: idQuiz }, usuario: { tipo: USER_TYPES.ADMIN } }, res, (e) => { throw e; });
  const conteudoAdmin = JSON.parse(enviado.campos[0].conteudo);
  ok(
    conteudoAdmin.alternativas[1].correta === true && enviado.questoes[0].resposta_correta === "B",
    "C2: admin continua vendo o gabarito"
  );
}

function testeC3() {
  ok(!extensaoPermitida("ataque.svg"), "C3: .svg recusado no envio");
  ok(!extensaoPermitida("pagina.html"), "C3: .html recusado no envio");
  ok(extensaoPermitida("foto.JPG") && extensaoPermitida("ata.pdf"), "C3: .jpg e .pdf aceitos");

  const chamar = (url) => {
    const headers = {};
    let status = 200;
    let seguiu = false;
    const res = {
      setHeader: (k, v) => (headers[k.toLowerCase()] = v),
      status: (s) => ((status = s), res),
      end: () => {},
    };
    protegerUploads({ path: url }, res, () => (seguiu = true));
    return { status, headers, seguiu };
  };
  const svg = chamar("/campos/antigo.svg");
  ok(svg.status === 404 && !svg.seguiu, "C3: SVG já existente não é mais servido");
  const img = chamar("/evento-1.jpg");
  ok(img.seguiu && /sandbox/.test(img.headers["content-security-policy"]) && img.headers["x-content-type-options"] === "nosniff", "C3: imagens servidas com CSP sandbox + nosniff");
  const doc = chamar("/campos/planilha.xlsx");
  ok(doc.headers["content-disposition"] === "attachment", "C3: documentos forçam download");
}

async function testeC4() {
  const vinculos = await knex("celula_lider").select("id_usuario", "id_celula");
  const formulario = await knex("formulario").first();
  if (vinculos.length < 2 || !formulario) return ok(false, "C4: precisa de 2 células com líder e 1 formulário (rode o seed)");
  const a = vinculos[0];
  const b = vinculos.find((v) => v.id_celula !== a.id_celula && v.id_usuario !== a.id_usuario);
  if (!b) return ok(false, "C4: precisa de líderes distintos em células distintas");

  const criarResposta = async (v) => {
    const [id] = await knex("formulario_resposta").insert({ id_formulario: formulario.id_formulario, id_usuario: v.id_usuario, id_celula: v.id_celula, data_resposta: new Date() });
    limpeza.push(() => knex("formulario_resposta").where({ id_resposta: id }).del());
    return id;
  };
  const idA = await criarResposta(a);
  const idB = await criarResposta(b);
  const liderA = { id_usuario: a.id_usuario, tipo: USER_TYPES.LEADER };

  const lista = await FormularioRespostaService.getAll(liderA);
  ok(lista.some((r) => r.id_resposta === idA), "C4: líder vê o relatório da própria célula");
  ok(!lista.some((r) => r.id_resposta === idB), "C4: líder NÃO vê relatório de outra célula");
  const erroVer = await FormularioRespostaService.getById(idB, liderA).catch((e) => e);
  ok(erroVer?.statusCode === 404, "C4: abrir relatório de outra célula → 404");
  const erroApagar = await FormularioRespostaService.delete(idB, liderA).catch((e) => e);
  const aindaExiste = await knex("formulario_resposta").where({ id_resposta: idB }).first();
  ok(erroApagar?.statusCode === 404 && !!aindaExiste, "C4: líder não consegue apagar relatório de outra célula");
  const outraCelula = await FormularioRespostaService.getByCelula(b.id_celula, liderA);
  ok(outraCelula.length === 0, "C4: listagem por célula alheia vem vazia");
  const admin = await FormularioRespostaService.getAll({ id_usuario: 0, tipo: USER_TYPES.ADMIN });
  ok(admin.some((r) => r.id_resposta === idB), "C4: admin continua vendo tudo");
}

async function testeR3() {
  const { default: UsuarioService } = await import("../src/services/UsuarioService.js");
  const admins = await knex("usuario").where({ tipo: USER_TYPES.ADMIN, ativo: true }).select("id_usuario");
  const eu = admins[0].id_usuario;
  const erroProprio = await UsuarioService.toggleActive(eu, eu).catch((e) => e);
  ok(erroProprio?.statusCode === 400, "R3: admin não desativa a própria conta");
  const erroRebaixar = await UsuarioService.update(eu, { tipo: USER_TYPES.MEMBER }, eu).catch((e) => e);
  ok(erroRebaixar?.statusCode === 400, "R3: admin não remove o próprio acesso de admin");

  // Com um único admin ativo, nem outro usuário consegue desativá-lo
  const outros = admins.slice(1).map((a) => a.id_usuario);
  if (outros.length) await knex("usuario").whereIn("id_usuario", outros).update({ ativo: false });
  limpeza.push(() => (outros.length ? knex("usuario").whereIn("id_usuario", outros).update({ ativo: true }) : null));
  const erroUltimo = await UsuarioService.softDelete(eu, null).catch((e) => e);
  const aindaAtivo = await knex("usuario").where({ id_usuario: eu }).first();
  ok(erroUltimo?.statusCode === 400 && aindaAtivo.ativo, "R3: último administrador ativo não pode ser desativado");
}

async function testeR5() {
  const { concluirEventosPassados } = await import("../src/jobs/escalaConcluirJob.js");
  const inserir = async (titulo, status, dataHora) => {
    const [id] = await knex("escala_evento").insert({ titulo, status, ativo: true, data_hora: dataHora });
    limpeza.push(() => knex("escala_evento").where({ id_escala_evento: id }).del());
    return id;
  };
  const passado = await inserir("TESTE passado", "publicada", "2020-01-05 19:00:00");
  const futuro = await inserir("TESTE futuro", "publicada", "2099-01-05 19:00:00");
  const rascunho = await inserir("TESTE rascunho antigo", "rascunho", "2020-01-05 19:00:00");
  await concluirEventosPassados();
  const status = async (id) => (await knex("escala_evento").where({ id_escala_evento: id }).first()).status;
  ok((await status(passado)) === "concluida", "R5: escala publicada que já passou vira concluída");
  ok((await status(futuro)) === "publicada", "R5: escala futura continua publicada");
  ok((await status(rascunho)) === "rascunho", "R5: rascunho não é alterado");
}

try {
  await testeC1eC2();
  testeC3();
  await testeC4();
  await testeR3();
  await testeR5();
} catch (e) {
  console.error("ERRO:", e);
  falhas += 1;
} finally {
  for (const desfazer of limpeza.reverse()) await desfazer().catch(() => {});
  await knex.destroy();
  console.log(falhas ? `\n${falhas} falha(s)` : "\nTodos os testes passaram.");
  process.exit(falhas ? 1 : 0);
}
