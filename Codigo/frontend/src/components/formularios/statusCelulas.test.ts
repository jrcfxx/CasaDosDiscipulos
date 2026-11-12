import { describe, it, expect } from "vitest";
import { calcularStatusCelulas, filtrarRespostas, respondentesUnicos } from "./statusCelulas";

const celulas = [
  { id_celula: 1, nome: "Videira" },
  { id_celula: 2, nome: "Morada" },
  { id_celula: 3, nome: "Resgate" },
];
const respostas = [
  { id_celula: 1, data_resposta: "2026-11-05T19:00:00", nome_lider: "Simone" },
  { id_celula: 1, data_resposta: "2026-11-10T19:00:00", nome_lider: "Simone" },
  { id_celula: 2, data_resposta: "2026-09-01T19:00:00", nome_lider: "Kelly" },
  { id_celula: 3, data_resposta: "2026-11-08T19:00:00" },
];

describe("calcularStatusCelulas", () => {
  const base = { celulas, respostas, frequencia: "semanal", inicio: "2026-11-01", fim: "2026-11-12" };

  it("em dia = pelo menos 1 resposta no período; fora do período conta como atrasada", () => {
    const s = calcularStatusCelulas(base);
    expect(s.celulasEmDia.map((c) => [c.nome, c.count])).toEqual([["Videira", 2], ["Resgate", 1]]);
    expect(s.celulasAtrasadas.map((c) => c.nome)).toEqual(["Morada"]);
    expect([s.totalCelulas, s.emDiaCount, s.pendentesCount, s.percentualEmDia]).toEqual([3, 2, 1, 67]);
  });

  it("resposta no último dia do período conta (até 23:59:59)", () => {
    const s = calcularStatusCelulas({ ...base, inicio: "2026-11-10", fim: "2026-11-10" });
    expect(s.celulasEmDia.map((c) => c.nome)).toEqual(["Videira"]);
  });

  it("período inválido: ninguém fica em dia", () => {
    const s = calcularStatusCelulas({ ...base, inicio: "2026-11-12", fim: "2026-11-01" });
    expect(s.periodoValido).toBe(false);
    expect(s.emDiaCount).toBe(0);
    expect(s.pendentesCount).toBe(3);
  });

  it("sem frequência no formulário: acompanhamento não se aplica", () => {
    const s = calcularStatusCelulas({ ...base, frequencia: "" });
    expect(s.temFrequencia).toBe(false);
    expect(s.celulasEmDia).toEqual([]);
    expect(s.celulasAtrasadas).toEqual([]);
  });

  it("sem células: 0%", () => {
    expect(calcularStatusCelulas({ ...base, celulas: [] }).percentualEmDia).toBe(0);
  });
});

describe("filtrarRespostas", () => {
  const todos = { celula: "" as const, respondente: "", dataInicio: "", dataFim: "" };
  it("por célula e por respondente (sem diferenciar maiúsculas)", () => {
    expect(filtrarRespostas(respostas, { ...todos, celula: 1 })).toHaveLength(2);
    expect(filtrarRespostas(respostas, { ...todos, respondente: "simone" })).toHaveLength(2);
  });
  it('"-" traz só respostas sem líder identificado', () => {
    expect(filtrarRespostas(respostas, { ...todos, respondente: "-" })).toEqual([respostas[3]]);
  });
  it("por intervalo de datas: inclui o primeiro e o último dia inteiros (fuso local)", () => {
    const r = filtrarRespostas(respostas, { ...todos, dataInicio: "2026-11-05", dataFim: "2026-11-08" });
    expect(r.map((x) => x.data_resposta)).toEqual(["2026-11-05T19:00:00", "2026-11-08T19:00:00"]);
    // A véspera não entra
    expect(filtrarRespostas(respostas, { ...todos, dataInicio: "2026-11-06", dataFim: "2026-11-30" }).map((x) => x.data_resposta))
      .toEqual(["2026-11-10T19:00:00", "2026-11-08T19:00:00"]);
  });
});

describe("respondentesUnicos", () => {
  it("lista ordenada, com '-' para quem não tem líder", () => {
    expect(respondentesUnicos(respostas)).toEqual(["-", "Kelly", "Simone"]);
  });
});
