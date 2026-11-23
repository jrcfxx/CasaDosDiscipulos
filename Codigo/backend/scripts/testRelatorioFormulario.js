/**
 * Regras do relatório de formulários (janelas por frequência, em dia/atrasada, totais).
 * Uso: npm run test:formularios   (não precisa de banco)
 */
import { janelasDoPeriodo, montarRelatorio, dataDeReferencia } from "../src/utils/relatorioFormulario.js";

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "OK  " : "FALHOU"} ${msg}`);
  if (!cond) falhas++;
};

// ---------- Janelas ----------
// 24/10/2026 é sábado; "hoje" = segunda 23/11
const HOJE = "2026-11-23";
let j = janelasDoPeriodo("semanal", "2026-10-24", "2026-11-23", HOJE);
ok(j[0].inicio === "2026-10-18", `semana começa no domingo, mesmo com o período começando no sábado (${j[0].inicio})`);
ok(j.at(-1).inicio === "2026-11-22" && j.at(-1).estado === "em_andamento", "semana atual fica 'em andamento'");
ok(j.length === 6, `6 semanas tocam o período (${j.length})`);
ok(j.slice(0, -1).every((x) => x.estado === "encerrada"), "as anteriores estão encerradas");

j = janelasDoPeriodo("semanal", "2026-11-01", "2026-12-31", HOJE);
ok(j.at(-1).inicio === "2026-11-22", "semanas que ainda não começaram ficam de fora");

j = janelasDoPeriodo("mensal", "2026-09-15", "2026-11-23", HOJE);
ok(j.map((x) => x.inicio).join(",") === "2026-09-01,2026-10-01,2026-11-01", "mensal: meses de calendário inteiros");
ok(j[1].fim === "2026-10-31" && j[2].estado === "em_andamento", "fim do mês certo e mês atual em andamento");

j = janelasDoPeriodo("bimestral", "2026-08-10", "2026-11-23", HOJE);
ok(j.map((x) => x.inicio).join(",") === "2026-07-01,2026-09-01,2026-11-01", "bimestral: jul-ago, set-out, nov-dez");

const q1 = janelasDoPeriodo("quinzenal", "2026-11-01", "2026-11-23", HOJE);
const q2 = janelasDoPeriodo("quinzenal", "2026-11-05", "2026-11-23", HOJE);
ok(q1[0].inicio === q2[0].inicio, "quinzenas estáveis: a mesma data cai sempre na mesma quinzena");
ok(q1.every((x) => (new Date(x.fim) - new Date(x.inicio)) / 86400000 === 13), "quinzena = 14 dias");

ok(janelasDoPeriodo("", "2026-11-01", "2026-11-23", HOJE).length === 1, "sem frequência: uma janela só");

// ---------- Data de referência ----------
ok(dataDeReferencia({ data_resposta: "2026-11-02T22:30:00Z", valores: { 9: "2026-11-01" } }, 9) === "2026-11-01",
  "usa a data da reunião informada, não a do envio");
ok(dataDeReferencia({ data_resposta: "2026-11-02T15:00:00Z", valores: {} }, 9) === "2026-11-02",
  "sem data da reunião preenchida: usa a do envio");

// ---------- Relatório ----------
const campos = [
  { id: 1, label: "Data da reunião", tipo: "data" },
  { id: 2, label: "Presentes", tipo: "numero" },
  { id: 3, label: "Visitantes", tipo: "numero" },
];
const celulas = [
  { id_celula: 1, nome: "Farol", ativa: 1 },
  { id_celula: 2, nome: "Visão", ativa: 1 },
  { id_celula: 3, nome: "Pérolas", ativa: 1 },
  { id_celula: 4, nome: "Antiga", ativa: 0 },
];
const resp = (id, cel, reuniao, presentes, visitantes, envio) => ({
  id_resposta: id,
  id_celula: cel,
  data_resposta: envio || `${reuniao}T22:00:00Z`,
  valores: { 1: reuniao, 2: String(presentes), 3: visitantes == null ? "" : String(visitantes) },
});
const respostas = [
  // Farol: todas as semanas encerradas de 01/11 a 21/11 (enviou a de 15/11 na segunda seguinte)
  resp(1, 1, "2026-11-01", 8, 1),
  resp(2, 1, "2026-11-08", 10, 2),
  resp(3, 1, "2026-11-15", 6, 0, "2026-11-16T23:00:00Z"),
  // Visão: só na primeira semana
  resp(4, 2, "2026-11-03", 5, null),
  // Antiga (inativa): nada
];
const r = montarRelatorio({ frequencia: "semanal", inicio: "2026-11-01", fim: "2026-11-23", celulas, respostas, campos, hoje: HOJE });

ok(r.janelas.length === 4, `4 semanas (3 encerradas + a atual) (${r.janelas.length})`);
ok(!r.celulas.some((c) => c.nome === "Antiga"), "célula inativa sem envio não entra (não vira 'atrasada' para sempre)");
const farol = r.celulas.find((c) => c.nome === "Farol");
const visao = r.celulas.find((c) => c.nome === "Visão");
const perolas = r.celulas.find((c) => c.nome === "Pérolas");
ok(farol.emDia === true && farol.faltas === 0, "Farol em dia");
ok(farol.janelas.at(-1).situacao === "aguardando", "semana atual sem envio = aguardando (não é atraso)");
ok(farol.janelas[2].situacao === "enviado", "relatório enviado na segunda conta na semana da reunião (domingo)");
ok(visao.emDia === false && visao.faltas === 2, `Visão: 2 semanas sem envio (${visao.faltas})`);
ok(perolas.faltas === 3 && perolas.ultimoEnvio === null, "Pérolas: nunca enviou = 3 faltas");
ok(r.resumo.emDia === 1 && r.resumo.atrasadas === 2, `resumo: 1 em dia, 2 atrasadas (${r.resumo.emDia}/${r.resumo.atrasadas})`);
ok(r.resumo.enviosEsperados === 9 && r.resumo.enviosCumpridos === 4, `envios: 4 de 9 (${r.resumo.enviosCumpridos}/${r.resumo.enviosEsperados})`);
ok(r.resumo.pontualidade === 44, `pontualidade 44% (${r.resumo.pontualidade})`);
ok(r.celulas[0].nome === "Pérolas", "mais atrasadas primeiro");

const pres = r.resumo.totais.find((t) => t.label === "Presentes");
const vis = r.resumo.totais.find((t) => t.label === "Visitantes");
ok(pres.soma === 29 && pres.media === 7.3, `presentes: soma 29, média 7,3 por reunião (${pres.soma}/${pres.media})`);
ok(vis.soma === 3 && vis.preenchidos === 3, "visitantes vazios não contam na média");
ok(farol.totais.find((t) => t.label === "Presentes").soma === 24, "totais por célula");

// O período começa no meio da semana: o envio da terça daquela semana conta
const r2 = montarRelatorio({
  frequencia: "semanal", inicio: "2026-11-05", fim: "2026-11-07",
  celulas: [{ id_celula: 2, nome: "Visão", ativa: 1 }], respostas, campos, hoje: HOJE,
});
ok(r2.celulas[0].janelas[0].situacao === "enviado", "período no meio da semana: considera a semana inteira");
ok(r2.inicioEfetivo === "2026-11-01" && r2.fimEfetivo === "2026-11-07", "informa o intervalo efetivo");

// Sem frequência: não existe 'em dia'
const r3 = montarRelatorio({ frequencia: "", inicio: "2026-11-01", fim: "2026-11-23", celulas, respostas, campos, hoje: HOJE });
ok(r3.resumo.emDia === null && r3.resumo.pontualidade === null, "sem frequência: em dia/pontualidade não se aplicam");
ok(r3.resumo.respostas === 4, "…mas conta os relatórios recebidos");

// Formulário que começou a ser usado depois do início do período: o que vem antes não conta
const r4 = montarRelatorio({
  frequencia: "mensal", inicio: "2026-09-01", fim: "2026-11-23",
  celulas: [{ id_celula: 1, nome: "Farol", ativa: 1 }, { id_celula: 2, nome: "Visão", ativa: 1 }],
  respostas: [resp(9, 1, "2026-11-07", 5, 0)], campos, hoje: HOJE,
});
ok(r4.janelas.length === 1 && r4.janelas[0].inicio === "2026-11-01", "meses antes do primeiro relatório do formulário não contam");
ok(r4.inicioUso === "2026-11-07" && r4.resumo.atrasadas === 0, "ninguém fica atrasado por mês em que o formulário nem existia");
const r5 = montarRelatorio({ frequencia: "semanal", inicio: "2026-11-01", fim: "2026-11-23", celulas, respostas: [], campos, hoje: HOJE });
ok(r5.janelas.length === 1 && r5.janelas[0].estado === "em_andamento", "formulário sem nenhuma resposta: só a semana atual");

console.log(falhas ? `\n${falhas} falha(s).` : "\nRelatório de formulários: todas as regras passaram.");
process.exit(falhas ? 1 : 0);
