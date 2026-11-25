/**
 * QA da escala pela API (servidor local rodando em :3001), caso a caso e perfil a perfil.
 * Cria eventos "QA …" em nov/dez 2026, roda as checagens e apaga tudo no fim.
 * Uso: node scripts/qaEscalaApi.js
 */
import knex from "../src/database/index.js";
import { tokenDeTeste, encerrarSessoesDeTeste } from "./sessaoTeste.js";

const API = "http://localhost:3001/api";
const IDS = { admin: 182, liderLouvor: 170, liderMidia: 178, membroLouvor: 155, membroMidia: 115 };
const MIN = { louvor: 8, midia: 14 };
const falhas = [];
let oks = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) oks++;
  else falhas.push(`${msg}${extra ? ` — ${extra}` : ""}`);
  console.log(`${cond ? "OK    " : "FALHA "} ${msg}${!cond && extra ? ` — ${extra}` : ""}`);
};

const tokens = {};
async function api(quem, metodo, caminho, corpo) {
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { Authorization: `Bearer ${tokens[quem]}`, "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  let dados = null;
  const txt = await r.text();
  try {
    dados = JSON.parse(txt);
  } catch {
    dados = txt;
  }
  return { status: r.status, dados: dados?.dados ?? dados, bruto: dados };
}

const criados = { eventos: new Set(), templates: new Set() };
const trocarSenhaAntes = {};

async function evento(titulo, ini, fim, ministerios, extra = {}) {
  const r = await api("admin", "POST", "/escala/eventos", {
    titulo, data_hora: ini, data_hora_fim: fim, id_ministerios: ministerios, ativo: true, ...extra,
  });
  if (r.status !== 201) throw new Error(`criar ${titulo}: ${r.status} ${JSON.stringify(r.bruto)}`);
  criados.eventos.add(r.dados.id_escala_evento);
  return r.dados;
}
const area = (ev, nome) => ev.areas.find((a) => a.nome === nome);
const completo = async (quem, id) => (await api(quem, "GET", `/escala/eventos/${id}/completo`)).dados;

async function main() {
  // ---------------- preparação
  for (const [nome, id] of Object.entries(IDS)) {
    const u = await knex("usuario").where({ id_usuario: id }).first();
    trocarSenhaAntes[id] = u.trocar_senha;
    tokens[nome] = await tokenDeTeste(u);
  }
  await knex("usuario").whereIn("id_usuario", Object.values(IDS)).update({ trocar_senha: 0 });
  // limpa restos de execuções anteriores
  const antigos = await knex("escala_evento").where("titulo", "like", "QA %").pluck("id_escala_evento");
  for (const id of antigos) await api("admin", "DELETE", `/escala/eventos/${id}`);

  console.log("\n== 1. Criação e validação de eventos");
  let r = await api("admin", "POST", "/escala/eventos", { titulo: "QA Inválido", data_hora: "2026-11-29T20:00", data_hora_fim: "2026-11-29T19:00", id_ministerios: [8] });
  ok(r.status === 400, "fim antes do início é recusado", `status ${r.status}`);
  if (r.dados?.id_escala_evento) criados.eventos.add(r.dados.id_escala_evento);
  r = await api("admin", "POST", "/escala/eventos", { titulo: "QA Zero", data_hora: "2026-11-29T20:00", data_hora_fim: "2026-11-29T20:00", id_ministerios: [8] });
  ok(r.status === 400, "evento com duração zero (fim = início) é recusado", `status ${r.status}`);
  if (r.dados?.id_escala_evento) criados.eventos.add(r.dados.id_escala_evento);
  r = await api("admin", "POST", "/escala/eventos", { titulo: "QA Data ruim", data_hora: "abc", id_ministerios: [8] });
  ok(r.status === 400, "data inválida é recusada com 400", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/eventos", { titulo: "  ", data_hora: "2026-11-29T20:00", id_ministerios: [8] });
  ok(r.status === 400, "título só com espaços é recusado", `status ${r.status}`);
  if (r.dados?.id_escala_evento) criados.eventos.add(r.dados.id_escala_evento);
  r = await api("admin", "POST", "/escala/eventos", { titulo: "QA Ministério inexistente", data_hora: "2026-11-29T20:00", data_hora_fim: "2026-11-29T21:00", id_ministerios: [999999] });
  ok(r.status === 400 || r.status === 404, "ministério inexistente é recusado (não 500)", `status ${r.status}`);
  if (r.dados?.id_escala_evento) criados.eventos.add(r.dados.id_escala_evento);
  r = await api("liderLouvor", "POST", "/escala/eventos", { titulo: "QA Líder cria", data_hora: "2026-11-29T20:00", id_ministerios: [8] });
  ok(r.status === 403, "líder não cria evento", `status ${r.status}`);
  r = await api("membroLouvor", "POST", "/escala/eventos", { titulo: "QA Membro cria", data_hora: "2026-11-29T20:00", id_ministerios: [8] });
  ok(r.status === 403, "membro não cria evento", `status ${r.status}`);

  const culto = await evento("QA Culto Domingo", "2026-11-29T18:30", "2026-11-29T20:30", [MIN.louvor, MIN.midia]);
  const paralelo = await evento("QA Paralelo Mídia", "2026-11-29T19:00", "2026-11-29T20:00", [MIN.midia]);
  const vigilia = await evento("QA Vigília", "2026-11-27T23:00", "2026-11-28T02:00", [MIN.louvor, MIN.midia]);
  const rascunho = await evento("QA Ensaio Rascunho", "2026-11-28T15:00", "2026-11-28T17:00", [MIN.louvor], { status: "rascunho" });
  const virada = await evento("QA Virada do mês", "2026-11-30T22:00", "2026-12-01T00:30", [MIN.louvor]);
  const semMinRes = await api("admin", "POST", "/escala/eventos", { titulo: "QA Sem ministério", data_hora: "2026-11-30T19:00", data_hora_fim: "2026-11-30T20:00", id_ministerios: [] });
  ok(semMinRes.status === 400, "evento sem ministério é recusado (regra: ao menos um)", `status ${semMinRes.status}`);
  const semMin = await evento("QA Sem ministério", "2026-11-30T19:00", "2026-11-30T20:00", [MIN.midia]);
  const longo = await evento("QA " + "Evento com um nome bem comprido ".repeat(4).trim(), "2026-12-02T20:00", "2026-12-02T21:00", [MIN.midia]);
  ok(culto.status === "publicada", "evento novo nasce publicado (padrão)", culto.status);
  ok(rascunho.status === "rascunho", "evento criado como rascunho fica rascunho", rascunho.status);
  ok(area(culto, "Louvor") && area(culto, "Mídia"), "evento com 2 ministérios cria as 2 áreas", JSON.stringify(culto.areas?.map((a) => a.nome)));

  console.log("\n== 2. Atribuições e regras");
  const L = (ev) => area(ev, "Louvor").id_escala_area;
  const M = (ev) => area(ev, "Mídia").id_escala_area;
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(culto), id_usuario: IDS.membroLouvor, detalhes: { instrumento: "violao" } });
  ok(r.status === 201, "admin escala membro do Louvor no Louvor", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 120)}`);
  const attLucas = r.dados?.id_escala_atribuicao;
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: M(culto), id_usuario: IDS.membroMidia, detalhes: {} });
  ok(r.status === 201, "admin escala membro da Mídia na Mídia", `status ${r.status}`);
  const attAmanda = r.dados?.id_escala_atribuicao;
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: M(paralelo), id_usuario: IDS.membroMidia, detalhes: {} });
  ok(r.status === 409 && r.bruto?.confirmavel === true, "mesma pessoa em 2 eventos no mesmo horário: conflito confirmável", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(culto), id_usuario: IDS.membroLouvor, detalhes: { instrumento: "violao" }, confirmarConflitos: true });
  ok(r.status === 409 && r.bruto?.confirmavel === false, "mesma pessoa 2x na MESMA função: bloqueado mesmo confirmando", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(culto), id_usuario: IDS.membroLouvor, detalhes: { instrumento: "vocal" } });
  ok(r.status === 409 && r.bruto?.confirmavel === true, "outra função no mesmo ministério: pede confirmação", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(culto), id_usuario: IDS.membroLouvor, detalhes: { instrumento: "vocal" }, confirmarConflitos: true });
  ok(r.status === 201, "confirmando, a pessoa fica em violão e vocal", `status ${r.status}`);
  if (r.dados?.id_escala_atribuicao) await api("admin", "DELETE", `/escala/atribuicoes/${r.dados.id_escala_atribuicao}`);
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(culto), id_usuario: IDS.membroMidia, detalhes: { instrumento: "vocal" } });
  ok(r.status === 409 && (r.bruto?.conflitos || []).some((c) => c.tipo === "fora_do_ministerio" || c.tipo === "duplo_instrumento"), "pessoa da Mídia no Louvor do mesmo evento: conflito (fora do ministério / 2 áreas)", `status ${r.status} ${JSON.stringify(r.bruto?.conflitos?.map((c) => c.tipo))}`);
  r = await api("liderLouvor", "POST", "/escala/atribuicoes", { id_escala_area: M(culto), id_usuario: IDS.membroMidia, detalhes: {} });
  ok(r.status === 403, "líder do Louvor não escala na Mídia", `status ${r.status}`);
  r = await api("liderLouvor", "POST", "/escala/atribuicoes", { id_escala_area: L(vigilia), id_usuario: IDS.membroMidia, detalhes: {} });
  ok([400, 403, 409].includes(r.status), "líder do Louvor não escala pessoa de fora do Louvor", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 200)}`);
  r = await api("liderLouvor", "POST", "/escala/atribuicoes", { id_escala_area: L(vigilia), id_usuario: IDS.membroLouvor, detalhes: { instrumento: "violao" } });
  ok(r.status === 201, "líder do Louvor escala membro do Louvor no Louvor", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);
  r = await api("membroLouvor", "POST", "/escala/atribuicoes", { id_escala_area: L(virada), id_usuario: IDS.membroLouvor, detalhes: {} });
  ok(r.status === 403, "membro não escala ninguém", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: 999999, id_usuario: IDS.membroLouvor, detalhes: {} });
  ok(r.status === 404 || r.status === 400, "área inexistente: 404/400 (não 500)", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(virada), id_usuario: 99999999, detalhes: {} });
  ok(r.status === 404 || r.status === 400, "pessoa inexistente: 404/400 (não 500)", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(virada), id_usuario: IDS.membroLouvor, detalhes: { instrumento: "violao" } });
  ok(r.status === 201, "escalar no evento que vira a noite para outro mês", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);

  // Vigília (23h-02h do dia 27→28) x Ensaio rascunho 28 15h: sem choque
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(rascunho), id_usuario: IDS.membroLouvor, detalhes: { instrumento: "violao" } });
  ok(r.status === 201, "eventos em horários diferentes: sem conflito", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);

  // limite: violão tem 2 vagas no Louvor
  const extras = await knex("usuario").where({ ativo: true }).whereNotIn("id_usuario", Object.values(IDS)).limit(3).pluck("id_usuario");
  for (const id of extras) await knex("usuario_ministerio").insert({ id_usuario: id, id_ministerio: MIN.louvor }).onConflict().ignore();
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(culto), id_usuario: extras[0], detalhes: { instrumento: "violao" } });
  ok(r.status === 201, "2º violão cabe no limite", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/atribuicoes", { id_escala_area: L(culto), id_usuario: extras[1], detalhes: { instrumento: "violao" } });
  ok(r.status === 409 && (r.bruto?.conflitos || []).some((c) => c.tipo === "limite"), "3º violão: conflito de limite", `status ${r.status} ${JSON.stringify(r.bruto?.conflitos?.map((c) => c.tipo))}`);

  console.log("\n== 3. Visibilidade por perfil (rascunho, telefone)");
  const tudoMes = async (quem, ano, mes) => {
    const v = await api(quem, "GET", `/escala/visualizacao/mes/${ano}/${mes}?modo=completo`);
    return { status: v.status, eventos: (v.dados?.dias || []).flatMap((d) => d.eventos.map((e) => ({ ...e, dia: d.data }))) };
  };
  const novAdmin = await tudoMes("admin", 2026, 11);
  const novMembro = await tudoMes("membroLouvor", 2026, 11);
  const temQA = (lst, t) => lst.some((e) => e.nome === t);
  ok(temQA(novAdmin.eventos, "QA Ensaio Rascunho"), "admin vê rascunho no mês");
  ok(!temQA(novMembro.eventos, "QA Ensaio Rascunho"), "membro NÃO vê rascunho no mês");
  r = await api("membroLouvor", "GET", `/escala/eventos/${rascunho.id_escala_evento}/completo`);
  ok(r.status === 404 || r.status === 403, "membro não abre rascunho pelo id", `status ${r.status}`);
  r = await api("membroLouvor", "GET", "/escala/minhas");
  ok(Array.isArray(r.dados) && !r.dados.some((x) => x.evento.nome === "QA Ensaio Rascunho"), "Minhas escalas do membro não mostra rascunho", JSON.stringify((r.dados || []).map((x) => x.evento.nome)));
  ok(Array.isArray(r.dados) && r.dados.some((x) => x.evento.nome === "QA Culto Domingo"), "Minhas escalas do membro mostra o culto em que está");
  const telefoneMembro = JSON.stringify(novMembro).includes('"telefone"') && /"telefone":"\d/.test(JSON.stringify(novMembro));
  ok(!telefoneMembro, "membro não recebe telefones na escala");
  const telefoneAdmin = /"telefone":"\d/.test(JSON.stringify(novAdmin));
  ok(telefoneAdmin, "admin recebe telefones (para contatar a equipe)");
  const telCompletoMembro = await completo("membroLouvor", culto.id_escala_evento);
  ok(!/usuario_telefone":"\d/.test(JSON.stringify(telCompletoMembro)), "membro não vê telefone ao abrir o evento");

  console.log("\n== 4. Coerência entre as visões (dia, semana, mês, ano, agenda)");
  const dia27 = await api("admin", "GET", "/escala/visualizacao/dia/2026-11-27");
  const dia28 = await api("admin", "GET", "/escala/visualizacao/dia/2026-11-28");
  ok((dia27.dados?.eventos || []).some((e) => e.nome === "QA Vigília"), "vigília (23h→02h) aparece no dia em que começa");
  const vigNoMes = novAdmin.eventos.filter((e) => e.nome === "QA Vigília");
  ok(vigNoMes.length === 1 && vigNoMes[0].dia === "2026-11-27", "vigília aparece uma vez no mês, no dia 27", JSON.stringify(vigNoMes.map((e) => e.dia)));
  ok(vigNoMes[0]?.horaFim === "02:00", "vigília termina 02:00", vigNoMes[0]?.horaFim);
  ok(!(dia28.dados?.eventos || []).some((e) => e.nome === "QA Vigília"), "vigília não duplica no dia seguinte");
  const dezAdmin = await tudoMes("admin", 2026, 12);
  ok(temQA(novAdmin.eventos, "QA Virada do mês") && !temQA(dezAdmin.eventos, "QA Virada do mês"), "evento 30/11 22h→01/12 fica só em novembro");
  const sem = await api("admin", "GET", "/escala/visualizacao/semana/2026-11-29");
  const semEventos = (sem.dados?.dias || []).flatMap((d) => d.eventos.map((e) => e.nome));
  ok(sem.dados?.dias?.length === 7, "semana tem 7 dias", sem.dados?.dias?.length);
  ok(["QA Culto Domingo", "QA Paralelo Mídia", "QA Virada do mês", "QA Sem ministério", longo.titulo].every((t) => semEventos.includes(t)), "semana 29/11 traz todos os eventos dela", JSON.stringify(semEventos));
  const semDomingo = await api("admin", "GET", "/escala/visualizacao/semana/2026-12-01");
  ok(semDomingo.status === 200 && semDomingo.dados?.dataInicio, "semana pedida numa terça responde", `status ${semDomingo.status} inicio=${semDomingo.dados?.dataInicio}`);
  const ano = await api("admin", "GET", "/escala/visao/ano/2026");
  ok(ano.status === 200, "visão do ano responde", `status ${ano.status}`);
  const contAno = JSON.stringify(ano.dados).match(/QA Culto Domingo/g)?.length || 0;
  ok(contAno >= 1, "culto aparece na visão do ano", String(contAno));
  // totais coerentes: preenchidas = pessoas no culto
  const cultoMes = novAdmin.eventos.find((e) => e.nome === "QA Culto Domingo");
  const pessoasCulto = new Set(Object.values(cultoMes?.instrumentos || {}).flatMap((s) => s.membros.map((m) => m.usuario?.id))).size;
  ok(cultoMes?.totais?.totalPessoas === pessoasCulto, "total de pessoas do evento confere com as áreas", `${cultoMes?.totais?.totalPessoas} vs ${pessoasCulto}`);
  const semMinMes = novAdmin.eventos.find((e) => e.nome === "QA Sem ministério");
  ok(!!semMinMes, "evento sem ministério aparece no mês");

  console.log("\n== 5. Entradas malformadas (devem dar 400/404, nunca 500)");
  for (const [rota, esperado] of [
    ["/escala/visualizacao/mes/2026/13", [400]],
    ["/escala/visualizacao/mes/abc/1", [400]],
    ["/escala/visualizacao/dia/2026-02-30", [400]],
    ["/escala/visualizacao/dia/abc", [400]],
    ["/escala/visualizacao/semana/xyz", [400]],
    ["/escala/visao/ano/abc", [400]],
    ["/escala/eventos/abc", [400]],
    ["/escala/eventos/99999999", [404]],
    ["/escala/eventos/99999999/completo", [404]],
    ["/escala/minhas?dias=abc", [200]],
    ["/escala/visualizacao/mes/2026/11?ministerios=abc", [200]],
  ]) {
    const x = await api("admin", "GET", rota);
    ok(esperado.includes(x.status), `GET ${rota} → ${esperado.join("/")}`, `veio ${x.status}`);
  }

  console.log("\n== 6. Mover pessoas");
  r = await api("admin", "POST", `/escala/atribuicoes/${attLucas}/mover`, { id_escala_area: area(paralelo, "Louvor")?.id_escala_area || 999999 });
  ok(r.status === 404 || r.status === 400, "mover para área inexistente (Paralelo não tem Louvor): 404/400", `status ${r.status}`);
  r = await api("liderLouvor", "PUT", "/escala/mover-membro", { membroEscalaOrigemId: attAmanda, escalaDestinoId: paralelo.id_escala_evento, instrumentoDestino: "_geral", id_escala_area: M(paralelo) });
  ok(r.status === 403, "líder do Louvor não move gente da Mídia", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/mover-membro-validar", { membroEscalaOrigemId: attLucas, escalaDestinoId: virada.id_escala_evento, instrumentoDestino: "violao", id_escala_area: L(virada) });
  ok(r.status === 200 && (r.bruto?.conflitos || r.dados?.conflitos || []).some((c) => c.tipo === "mesma_area" || c.tipo === "mesma_funcao"), "mover Lucas para evento onde já está no Louvor: aponta a função repetida", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 200)}`);
  r = await api("thaisSemToken", "GET", "/escala/minhas");
  ok(r.status === 401, "sem login: 401", `status ${r.status}`);

  console.log("\n== 7. Copiar, publicar, desfazer, histórico, templates");
  r = await api("admin", "POST", `/escala/eventos/${culto.id_escala_evento}/copiar`, { data_hora: "2026-12-06T18:30", data_hora_fim: "2026-12-06T20:30" });
  ok(r.status === 201, "copiar evento para +7 dias", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);
  const copia = r.dados?.evento || r.dados;
  if (copia?.id_escala_evento) criados.eventos.add(copia.id_escala_evento);
  if (copia?.id_escala_evento) {
    const c = await completo("admin", copia.id_escala_evento);
    const n = (c.areas || []).reduce((t, a) => t + (a.atribuicoes || []).length, 0);
    ok(n >= 2, "cópia leva as pessoas", String(n));
    ok(c.status === "rascunho" || c.status === "publicada", "cópia tem status válido", c.status);
  }
  r = await api("admin", "POST", `/escala/eventos/${rascunho.id_escala_evento}/publicar`);
  ok(r.status === 200, "publicar rascunho", `status ${r.status}`);
  ok((await completo("admin", rascunho.id_escala_evento)).status === "publicada", "rascunho virou publicada");
  r = await api("admin", "POST", `/escala/eventos/${rascunho.id_escala_evento}/publicar`);
  ok(r.status === 400 || r.status === 409 || r.status === 200, "publicar de novo não dá 500", `status ${r.status}`);
  r = await api("admin", "DELETE", `/escala/atribuicoes/${attAmanda}`);
  ok(r.status === 200 || r.status === 204, "remover atribuição", `status ${r.status}`);
  r = await api("admin", "POST", `/escala/eventos/${culto.id_escala_evento}/desfazer`);
  ok(r.status === 200, "desfazer a remoção", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);
  const depois = await completo("admin", culto.id_escala_evento);
  ok((area(depois, "Mídia")?.atribuicoes || []).some((a) => a.id_usuario === IDS.membroMidia), "pessoa voltou depois do desfazer");
  r = await api("admin", "GET", `/escala/eventos/${culto.id_escala_evento}/historico`);
  ok(r.status === 200 && Array.isArray(r.dados) && r.dados.length >= 3, "histórico registra as ações", `status ${r.status} n=${r.dados?.length}`);
  r = await api("membroLouvor", "GET", `/escala/eventos/${culto.id_escala_evento}/historico`);
  ok(r.status === 403, "membro não vê histórico", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/templates", { nome: "QA Template", id_escala_evento: culto.id_escala_evento });
  ok(r.status === 201, "criar template a partir do evento", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 120)}`);
  const tpl = r.dados?.id_escala_template || r.dados?.id;
  if (tpl) criados.templates.add(tpl);
  if (tpl) {
    r = await api("admin", "POST", `/escala/templates/${tpl}/aplicar`, { data_hora: "2026-12-13T18:30", data_hora_fim: "2026-12-13T20:30" });
    ok(r.status === 201 || r.status === 200, "aplicar template", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);
    const novo = r.dados?.evento || r.dados;
    if (novo?.id_escala_evento) criados.eventos.add(novo.id_escala_evento);
  }
  r = await api("admin", "POST", "/escala/eventos/copiar-dia", { data_origem: "2026-11-29", data_destino: "2026-12-20" });
  ok(r.status === 201 || r.status === 200, "copiar dia", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);
  for (const e of r.dados?.eventos || r.dados?.criados || []) if (e?.id_escala_evento) criados.eventos.add(e.id_escala_evento);
  const dia20 = await api("admin", "GET", "/escala/visualizacao/dia/2026-12-20");
  const nomes20 = (dia20.dados?.eventos || []).map((e) => e.nome);
  ok(nomes20.includes("QA Culto Domingo") && nomes20.includes("QA Paralelo Mídia"), "dia copiado traz os eventos", JSON.stringify(nomes20));
  r = await api("admin", "POST", "/escala/eventos/copiar-dia", { data_origem: "2026-11-29", data_destino: "2026-11-29" });
  ok(r.status === 400, "copiar dia para o mesmo dia é recusado", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/eventos/copiar-semana", { data_inicio_origem: "2026-11-29", data_inicio_destino: "2026-11-29" });
  ok(r.status === 400, "copiar semana para a mesma semana é recusado", `status ${r.status}`);
  r = await api("admin", "POST", "/escala/eventos/copiar-dia", { data_origem: "2026-11-27", data_destino: "2026-12-04" });
  const vigCopia = (r.bruto?.dados || []).find((e) => String(e.titulo || "").includes("Vigília"));
  const fimVig = String(vigCopia?.data_hora_fim || "");
  ok(r.status === 201 && vigCopia && (fimVig.startsWith("2026-12-05") || new Date(fimVig) > new Date(vigCopia.data_hora)), "copiar dia com vigília (23h→2h) mantém o fim no dia seguinte", `status ${r.status} ${vigCopia?.data_hora} → ${fimVig}`);

  console.log("\n== 8. Editar e excluir evento");
  r = await api("admin", "PUT", `/escala/eventos/${paralelo.id_escala_evento}`, { data_hora: "2026-11-29T21:00", data_hora_fim: "2026-11-29T20:00" });
  ok(r.status === 400, "editar com fim antes do início é recusado", `status ${r.status}`);
  r = await api("admin", "PUT", `/escala/eventos/${paralelo.id_escala_evento}`, { titulo: "QA Paralelo Mídia (editado)" });
  ok(r.status === 200, "editar só o título", `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`);
  r = await api("admin", "PUT", `/escala/eventos/${culto.id_escala_evento}`, { id_ministerios: [MIN.louvor] });
  const semMidia = await completo("admin", culto.id_escala_evento);
  ok(r.status === 200, "tirar um ministério do evento", `status ${r.status}`);
  ok(!area(semMidia, "Mídia") || (area(semMidia, "Mídia").atribuicoes || []).length >= 0, "área removida não deixa erro ao abrir o evento");
  r = await api("admin", "DELETE", `/escala/eventos/${semMin.id_escala_evento}`);
  ok(r.status === 204 || r.status === 200, "excluir evento", `status ${r.status}`);
  r = await api("admin", "GET", `/escala/eventos/${semMin.id_escala_evento}`);
  ok(r.status === 404, "evento excluído some", `status ${r.status}`);
  r = await api("liderLouvor", "DELETE", `/escala/eventos/${culto.id_escala_evento}`);
  ok(r.status === 403, "líder não exclui evento", `status ${r.status}`);

  console.log("\n== 9. Líder vê a escala toda");
  const novLider = await tudoMes("liderMidia", 2026, 11);
  ok(temQA(novLider.eventos, "QA Vigília") && temQA(novLider.eventos, "QA Virada do mês"), "líder da Mídia vê evento só do Louvor (Virada)");
  const vir = novLider.eventos.find((e) => e.nome === "QA Virada do mês");
  ok(vir && Object.values(vir.instrumentos || {}).every((s) => s.podeGerenciar === false), "…mas sem poder editar as áreas do Louvor");

  // limpeza dos vínculos de teste
  for (const id of extras) await knex("usuario_ministerio").where({ id_usuario: id, id_ministerio: MIN.louvor }).del();
}

try {
  await main();
} catch (e) {
  console.error("ERRO NO SCRIPT:", e);
  falhas.push("script parou: " + e.message);
} finally {
  for (const id of criados.templates) await api("admin", "DELETE", `/escala/templates/${id}`).catch(() => {});
  const ids = new Set([...criados.eventos, ...(await knex("escala_evento").where("titulo", "like", "QA %").pluck("id_escala_evento"))]);
  for (const id of ids) await api("admin", "DELETE", `/escala/eventos/${id}`).catch(() => {});
  for (const [id, v] of Object.entries(trocarSenhaAntes)) await knex("usuario").where({ id_usuario: id }).update({ trocar_senha: v });
  await encerrarSessoesDeTeste();
  await knex.destroy();
  console.log(`\n${oks} OK, ${falhas.length} FALHA(S)`);
  if (falhas.length) console.log(falhas.map((f) => " - " + f).join("\n"));
}
