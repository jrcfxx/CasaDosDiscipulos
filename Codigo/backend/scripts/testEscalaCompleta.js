/**
 * Teste de integração das REGRAS da Escala — banco de DESENVOLVIMENTO.
 * Cada regra é exercida pelo serviço real (mesmo caminho da API) e pelo caminho alternativo
 * (mover, copiar evento, aplicar modelo, desfazer, editar horário).
 * Cria e apaga os próprios dados. Uso: node scripts/testEscalaCompleta.js
 */
import knex from "../src/database/index.js";
import EscalaService from "../src/services/EscalaService.js";
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
const erroDe = async (fn) => {
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  }
};

const sufixo = Date.now();
const ADMIN = USER_TYPES.ADMIN;
const LIDER = USER_TYPES.LEADER;
const criados = { usuarios: [], eventos: [], ministerios: [], templates: [] };

async function usuario(nome, tipo = "membro") {
  const [id] = await knex("usuario").insert({
    nome: `${nome} ${sufixo}`,
    email: `esc.${nome.toLowerCase().replace(/\s/g, "")}.${sufixo}@exemplo.com`,
    senha: "x",
    tipo,
    ativo: true,
    lider_celula: false,
  });
  criados.usuarios.push(id);
  return id;
}

async function ministerio(nome) {
  const [id] = await knex("ministerio").insert({ nome: `${nome} ${sufixo}`, ativo: true, ordem: 999 });
  criados.ministerios.push(id);
  return id;
}

async function evento(admin, titulo, inicio, fim, ministerios, areas) {
  const ev = await EscalaService.createEvento(
    { titulo: `${titulo} ${sufixo}`, data_hora: inicio, data_hora_fim: fim, id_ministerios: ministerios, areas, status: "rascunho" },
    admin,
    ADMIN
  );
  criados.eventos.push(ev.id_escala_evento);
  const areasEv = await knex("escala_area").where({ id_escala_evento: ev.id_escala_evento }).orderBy("ordem");
  return { id: ev.id_escala_evento, areas: areasEv };
}

async function main() {
  // ---------- Cenário ----------
  const mLouvor = await ministerio("Louvor");
  const mMidia = await ministerio("Midia");
  const mSom = await ministerio("Som");
  const nomeLouvor = `Louvor ${sufixo}`;
  const nomeMidia = `Midia ${sufixo}`;
  const nomeSom = `Som ${sufixo}`;

  const admin = await usuario("Admin Esc", "administrador");
  const lider = await usuario("Lider Esc", "lider");
  const ana = await usuario("Ana");
  const bia = await usuario("Bia");
  const caio = await usuario("Caio");
  const davi = await usuario("Davi");
  const inativo = await usuario("Inativo");
  await knex("usuario").where({ id_usuario: inativo }).update({ ativo: false });

  await knex("ministerio_lider").insert([
    { id_ministerio: mLouvor, id_usuario: lider },
    { id_ministerio: mMidia, id_usuario: lider },
  ]);
  await knex("usuario_ministerio").insert([
    { id_ministerio: mLouvor, id_usuario: ana },
    { id_ministerio: mLouvor, id_usuario: bia },
    { id_ministerio: mLouvor, id_usuario: caio },
    { id_ministerio: mMidia, id_usuario: davi },
    { id_ministerio: mSom, id_usuario: ana },
    { id_ministerio: mLouvor, id_usuario: inativo },
  ]);

  const domingo = await evento(admin, "Culto Domingo", "2032-03-07 19:00:00", "2032-03-07 21:00:00", [mLouvor, mMidia, mSom], [nomeLouvor, nomeMidia, nomeSom]);
  const [aLouvor, aMidia, aSom] = domingo.areas;

  // ---------- 1. Mesma pessoa duas vezes na mesma área ----------
  await EscalaService.addAtribuicao(aLouvor.id_escala_area, ana, admin, ADMIN, { instrumento: "violao" });
  let e = await erroDe(() => EscalaService.addAtribuicao(aLouvor.id_escala_area, ana, admin, ADMIN, { instrumento: "vocal" }));
  ok(e?.statusCode === 409, "mesma pessoa 2x na MESMA área é bloqueada");
  e = await erroDe(() =>
    EscalaService.addAtribuicao(aLouvor.id_escala_area, ana, admin, ADMIN, { instrumento: "vocal" }, { confirmarConflitos: true })
  );
  ok(e?.statusCode === 409, "…e nem com confirmação passa");

  // ---------- 2. Mesma pessoa em duas áreas do mesmo evento ----------
  e = await erroDe(() => EscalaService.addAtribuicao(aSom.id_escala_area, ana, admin, ADMIN, null));
  ok(e?.statusCode === 409 && e.confirmavel === true, "mesma pessoa em 2 áreas do MESMO evento → conflito (só passa confirmando)");
  const totalAnaAntes = await contarNoEvento(ana, domingo.id);
  ok(totalAnaAntes === 1, `sem confirmação ela continua 1x no evento (${totalAnaAntes})`);

  // ---------- 3. Paralelismo entre ministérios ----------
  await knex("ministerio_paralelismo").insert({ id_ministerio: mLouvor, id_ministerio_paralelo: mSom });
  e = await erroDe(() => EscalaService.addAtribuicao(aSom.id_escala_area, ana, admin, ADMIN, null));
  ok(e === null, "ministérios com paralelismo: pode estar nos dois");
  await knex("ministerio_paralelismo").where({ id_ministerio: mLouvor }).del();

  // ---------- 4. Limite de vagas por função ----------
  await EscalaService.addAtribuicao(aLouvor.id_escala_area, bia, admin, ADMIN, { instrumento: "violao" });
  e = await erroDe(() => EscalaService.addAtribuicao(aLouvor.id_escala_area, caio, admin, ADMIN, { instrumento: "violao" }));
  ok(e?.statusCode === 409 && /vagas/.test(e.message), "3º violão (limite 2) é bloqueado");

  // ---------- 5. Função inválida ----------
  e = await erroDe(() => EscalaService.addAtribuicao(aLouvor.id_escala_area, caio, admin, ADMIN, { instrumento: "harpa_espacial" }, { confirmarConflitos: true }));
  ok(e?.statusCode === 409 && e.confirmavel === false, "função inexistente é bloqueada mesmo confirmando");

  // ---------- 6. Pessoa inativa ou inexistente ----------
  e = await erroDe(() => EscalaService.addAtribuicao(aLouvor.id_escala_area, inativo, admin, ADMIN, { instrumento: "vocal" }));
  ok(e?.statusCode >= 400 && e?.statusCode < 500, `pessoa desativada não pode ser escalada (${e?.statusCode})`);
  e = await erroDe(() => EscalaService.addAtribuicao(aLouvor.id_escala_area, 999999999, admin, ADMIN, { instrumento: "vocal" }));
  ok(e?.statusCode >= 400 && e?.statusCode < 500, `pessoa inexistente é recusada com mensagem, não erro 500 (${e?.statusCode})`);

  // ---------- 7. Choque de horário entre eventos ----------
  const ensaio = await evento(admin, "Ensaio", "2032-03-07 20:00:00", "2032-03-07 22:00:00", [mLouvor], [nomeLouvor]);
  e = await erroDe(() => EscalaService.addAtribuicao(ensaio.areas[0].id_escala_area, bia, admin, ADMIN, { instrumento: "vocal" }));
  ok(e?.statusCode === 409 && /mesmo horário/.test(e.message), "evento que sobrepõe outro em que a pessoa está → conflito");
  const depois = await evento(admin, "Depois", "2032-03-07 21:00:00", "2032-03-07 22:00:00", [mLouvor], [nomeLouvor]);
  e = await erroDe(() => EscalaService.addAtribuicao(depois.areas[0].id_escala_area, bia, admin, ADMIN, { instrumento: "vocal" }));
  ok(e === null, "evento que começa quando o outro termina NÃO conflita");
  const semFim = await evento(admin, "Sem fim", "2032-03-07 22:30:00", null, [mLouvor], [nomeLouvor]);
  await EscalaService.addAtribuicao(semFim.areas[0].id_escala_area, caio, admin, ADMIN, { instrumento: "vocal" });
  const logo = await evento(admin, "Logo depois", "2032-03-07 23:30:00", "2032-03-07 23:59:00", [mLouvor], [nomeLouvor]);
  e = await erroDe(() => EscalaService.addAtribuicao(logo.areas[0].id_escala_area, caio, admin, ADMIN, { instrumento: "vocal" }));
  ok(e?.statusCode === 409, "evento sem término conta como 2h para choque de horário");

  // ---------- 8. Horários do evento ----------
  e = await erroDe(() =>
    EscalaService.createEvento({ titulo: "Zero", data_hora: "2032-03-08 19:00:00", data_hora_fim: "2032-03-08 19:00:00", id_ministerios: [mLouvor], status: "rascunho" }, admin, ADMIN)
  );
  ok(e?.statusCode === 400, "evento com término = início é recusado");
  e = await erroDe(() => EscalaService.updateEvento(domingo.id, { data_hora_fim: "2032-03-07 18:00:00" }, ADMIN, admin));
  ok(e?.statusCode === 400, "editar só o término para antes do início é recusado");
  e = await erroDe(() => EscalaService.updateEvento(domingo.id, { data_hora: "2032-03-07 22:00:00" }, ADMIN, admin));
  ok(e?.statusCode === 400, "editar só o início para depois do término é recusado");

  // ---------- 9. Mover ----------
  const anaLouvor = await knex("escala_atribuicao").where({ id_escala_area: aLouvor.id_escala_area, id_usuario: ana }).first();
  e = await erroDe(() => EscalaService.moverAtribuicao(anaLouvor.id_escala_atribuicao, aSom.id_escala_area, null, admin, ADMIN));
  ok(e?.statusCode === 409, "mover para área do mesmo evento onde a pessoa JÁ está → bloqueado");
  // Ana está no Louvor e no Som (aceito quando havia paralelismo). Ir para a Mídia a deixaria
  // em Mídia + Som, que não são paralelos → tem que bloquear
  e = await erroDe(() => EscalaService.moverAtribuicao(anaLouvor.id_escala_atribuicao, aMidia.id_escala_area, null, admin, ADMIN));
  ok(e?.statusCode === 409, "mover para área que a deixaria em 2 ministérios não paralelos → bloqueado");
  const anaSom = await knex("escala_atribuicao").where({ id_escala_area: aSom.id_escala_area, id_usuario: ana }).first();
  await EscalaService.removeAtribuicao(anaSom.id_escala_atribuicao, admin, ADMIN);
  e = await erroDe(() => EscalaService.moverAtribuicao(anaLouvor.id_escala_atribuicao, aMidia.id_escala_area, null, admin, ADMIN));
  ok(e === null, "mover para outra área livre do mesmo evento funciona");
  ok((await contarNoEvento(ana, domingo.id)) === 1, "após mover ela sai da área anterior: continua 1x no evento");

  // ---------- 10. Líder ----------
  e = await erroDe(() => EscalaService.addAtribuicao(aLouvor.id_escala_area, davi, lider, LIDER, { instrumento: "vocal" }));
  ok(e?.statusCode >= 400 && e?.statusCode < 500, "líder NÃO escala no Louvor alguém que só é da Mídia");
  e = await erroDe(() => EscalaService.addAtribuicao(aSom.id_escala_area, caio, lider, LIDER, null));
  ok(e?.statusCode === 403, "líder não mexe em área de ministério que não lidera (Som)");
  const lista = await EscalaService.getUsuariosParaEscalar(domingo.id, lider, LIDER, nomeLouvor);
  ok(lista.length > 0 && lista.every((u) => [ana, bia, caio].includes(u.id_usuario)), "lista de candidatos do líder no Louvor só traz gente do Louvor");
  ok(!lista.some((u) => u.id_usuario === inativo), "candidatos não incluem pessoas desativadas");

  // Ministério renomeado: área continua ligada pelo id
  await knex("ministerio").where({ id_ministerio: mLouvor }).update({ nome: `Louvor renomeado ${sufixo}` });
  const listaRen = await EscalaService.getUsuariosParaEscalar(domingo.id, admin, ADMIN, nomeLouvor);
  ok(listaRen.length > 0 && listaRen.every((u) => [ana, bia, caio].includes(u.id_usuario)), "renomear o ministério não quebra a lista de candidatos da área");
  await knex("ministerio").where({ id_ministerio: mLouvor }).update({ nome: nomeLouvor });

  // ---------- 11. Copiar evento / modelo ----------
  await knex("usuario_ministerio").where({ id_ministerio: mLouvor, id_usuario: caio }).del(); // Caio saiu do Louvor
  await knex("escala_atribuicao").where({ id_escala_area: aLouvor.id_escala_area }).del();
  await EscalaService.addAtribuicao(aLouvor.id_escala_area, bia, admin, ADMIN, { instrumento: "vocal" });
  await knex("escala_atribuicao").insert({ id_escala_area: aLouvor.id_escala_area, id_usuario: caio, detalhes: JSON.stringify({ instrumento: "baixo" }) });
  const copia = await EscalaService.copiarEvento(domingo.id, { data_hora: "2032-03-14 19:00:00", data_hora_fim: "2032-03-14 21:00:00" }, admin, ADMIN);
  criados.eventos.push(copia.dados.id_escala_evento);
  const pessoasCopia = (copia.dados.areas || []).flatMap((a) => a.atribuicoes.map((x) => x.id_usuario));
  ok(!pessoasCopia.includes(caio), "copiar evento NÃO leva quem saiu do ministério da área");
  ok(copia.warnings.some((w) => /ministério/i.test(w.mensagem)), "…e avisa o motivo");
  const repetidos = pessoasCopia.filter((id, i) => pessoasCopia.indexOf(id) !== i);
  ok(repetidos.every((id) => id === ana), "na cópia, só se repete quem tinha paralelismo/exceção na origem");

  e = await erroDe(() => EscalaService.copiarEvento(domingo.id, { data_hora: "2032-03-21 19:00:00", data_hora_fim: "2032-03-21 18:00:00" }, admin, ADMIN));
  ok(e?.statusCode === 400, "copiar com término antes do início é recusado");

  const tpl = await EscalaService.criarTemplate({ nome: `Modelo ${sufixo}`, id_escala_evento: domingo.id }, admin, ADMIN);
  criados.templates.push(tpl.id_escala_template);
  const aplicado = await EscalaService.aplicarTemplate(tpl.id_escala_template, { data_hora: "2032-03-28 19:00:00", data_hora_fim: "2032-03-28 21:00:00" }, admin, ADMIN);
  criados.eventos.push(aplicado.dados.id_escala_evento);
  const pessoasTpl = (aplicado.dados.areas || []).flatMap((a) => a.atribuicoes.map((x) => x.id_usuario));
  ok(!pessoasTpl.includes(caio), "aplicar modelo NÃO leva quem saiu do ministério da área");

  // ---------- 12. Privacidade: telefone só para admin/líder ----------
  await knex("usuario").where({ id_usuario: bia }).update({ telefone: "31988887777" });
  const temTelefone = (obj) => JSON.stringify(obj).includes("31988887777");
  const diaMembro = await EscalaService.getVisualizacaoDia("2032-03-07", ana, USER_TYPES.MEMBER);
  const diaAdmin = await EscalaService.getVisualizacaoDia("2032-03-07", admin, ADMIN);
  ok(!temTelefone(diaMembro) && temTelefone(diaAdmin), "visão do dia: membro NÃO recebe telefones; admin recebe");
  const evMembro = await EscalaService.getEventoCompleto(domingo.id, ana, USER_TYPES.MEMBER).catch(() => null);
  ok(evMembro === null || !temTelefone(evMembro), "detalhe do evento: membro NÃO recebe telefones");
  const mesMembro = await EscalaService.getVisualizacaoMes(2032, 3, "completo", ana, USER_TYPES.MEMBER);
  ok(!temTelefone(mesMembro), "mês detalhado: membro NÃO recebe telefones");

  // ---------- 13. Desfazer ----------
  const biaAttr = await knex("escala_atribuicao").where({ id_escala_area: aLouvor.id_escala_area, id_usuario: bia }).first();
  await EscalaService.removeAtribuicao(biaAttr.id_escala_atribuicao, admin, ADMIN);
  // Enquanto isso, Bia foi escalada em outro evento no mesmo horário
  const outro = await evento(admin, "Outro mesmo horário", "2032-03-07 19:00:00", "2032-03-07 21:00:00", [mLouvor], [nomeLouvor]);
  await EscalaService.addAtribuicao(outro.areas[0].id_escala_area, bia, admin, ADMIN, { instrumento: "vocal" });
  e = await erroDe(() => EscalaService.desfazerUltimaAlteracao(domingo.id, admin, ADMIN));
  const voltou = await knex("escala_atribuicao").where({ id_escala_area: aLouvor.id_escala_area, id_usuario: bia }).first();
  ok(e?.statusCode === 409 && !voltou, "desfazer não recoloca a pessoa se isso criar choque de horário");
}

async function contarNoEvento(idUsuario, idEvento) {
  const [{ n }] = await knex("escala_atribuicao as a")
    .join("escala_area as ar", "ar.id_escala_area", "a.id_escala_area")
    .where({ "a.id_usuario": idUsuario, "ar.id_escala_evento": idEvento })
    .count({ n: "*" });
  return Number(n);
}

try {
  await main();
} catch (err) {
  console.error("ERRO:", err);
  falhas += 1;
} finally {
  if (criados.templates.length) await knex("escala_template").whereIn("id_escala_template", criados.templates).del();
  if (criados.eventos.length) await knex("escala_evento").whereIn("id_escala_evento", criados.eventos).del();
  // Eventos criados por nome (ex.: tentativas que passaram) também saem
  await knex("escala_evento").where("titulo", "like", `%${sufixo}%`).del();
  if (criados.usuarios.length) {
    await knex("notificacao").whereIn("id_usuario", criados.usuarios).del();
    await knex("usuario").whereIn("id_usuario", criados.usuarios).del();
  }
  if (criados.ministerios.length) await knex("ministerio").whereIn("id_ministerio", criados.ministerios).del();
  await knex.destroy();
  console.log(falhas ? `\n${falhas} falha(s)` : "\nTodas as regras da escala passaram.");
  process.exit(falhas ? 1 : 0);
}
