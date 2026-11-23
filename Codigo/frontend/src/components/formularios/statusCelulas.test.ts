import { describe, it, expect } from "vitest";
import { filtrarRespostas, respondentesUnicos } from "./statusCelulas";
import { atalhosDoPeriodo, haQuantoTempo } from "./periodoRelatorio";

const respostas = [
  { id_celula: 1, data_resposta: "2026-11-05T19:00:00", nome_lider: "Simone" },
  { id_celula: 1, data_resposta: "2026-11-10T19:00:00", nome_lider: "Simone" },
  { id_celula: 2, data_resposta: "2026-09-01T19:00:00", nome_lider: "Kelly" },
  { id_celula: 3, data_resposta: "2026-11-08T19:00:00" },
];

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

describe("filtro pela data da reunião", () => {
  it("usa a data da reunião (data_referencia), não a do envio", () => {
    const lista = [{ id_celula: 1, data_resposta: "2026-11-02T22:00:00", data_referencia: "2026-11-01" }];
    const todos = { celula: "" as const, respondente: "", dataInicio: "", dataFim: "" };
    expect(filtrarRespostas(lista, { ...todos, dataInicio: "2026-11-01", dataFim: "2026-11-01" })).toHaveLength(1);
    expect(filtrarRespostas(lista, { ...todos, dataInicio: "2026-11-02", dataFim: "2026-11-02" })).toHaveLength(0);
  });
});

describe("atalhos de período do relatório", () => {
  const hoje = new Date(2026, 10, 23, 10); // segunda, 23/11/2026
  it("semanal: 'Últimas 4 semanas' começa num domingo, 3 semanas antes da atual", () => {
    const [a] = atalhosDoPeriodo("semanal", hoje);
    expect([a.rotulo, a.inicio, a.fim]).toEqual(["Últimas 4 semanas", "2026-11-01", "2026-11-23"]);
  });
  it("mensal: 'Últimos 3 meses' começa no dia 1", () => {
    expect(atalhosDoPeriodo("mensal", hoje)[0].inicio).toBe("2026-09-01");
  });
  it("mês passado vai do dia 1 ao último dia", () => {
    const m = atalhosDoPeriodo("semanal", hoje).find((x) => x.id === "mes-passado")!;
    expect([m.inicio, m.fim]).toEqual(["2026-10-01", "2026-10-31"]);
  });
  it("há quanto tempo", () => {
    expect(haQuantoTempo("2026-11-23", hoje)).toBe("hoje");
    expect(haQuantoTempo("2026-11-22", hoje)).toBe("ontem");
    expect(haQuantoTempo("2026-11-11", hoje)).toBe("há 12 dias");
  });
});

describe("respondentesUnicos", () => {
  it("lista ordenada, com '-' para quem não tem líder", () => {
    expect(respondentesUnicos(respostas)).toEqual(["-", "Kelly", "Simone"]);
  });
});
