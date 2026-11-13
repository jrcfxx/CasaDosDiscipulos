import { describe, expect, it } from "vitest";
import {
  dataDoMes,
  faixaHorario,
  formatarTelefone,
  inicioSemana,
  plural,
  referenciaDe,
  rotuloStatus,
  somarDias,
  tituloSemana,
} from "./escalaDatas";

describe("datas da escala", () => {
  it("semana começa no domingo, inclusive virando o mês", () => {
    expect(inicioSemana("2026-11-25")).toBe("2026-11-22");
    expect(inicioSemana("2026-12-03")).toBe("2026-11-29");
    expect(inicioSemana("2026-11-22")).toBe("2026-11-22");
  });

  it("referência única: a mesma data alimenta dia, semana e mês", () => {
    expect(referenciaDe("2026-12-06")).toEqual({ ano: 2026, mes: 12, dataDia: "2026-12-06", dataSemana: "2026-12-06" });
    expect(referenciaDe("2027-01-01")).toEqual({ ano: 2027, mes: 1, dataDia: "2027-01-01", dataSemana: "2026-12-27" });
  });

  it("ir para um mês usa hoje se for o mês atual, senão o dia 1", () => {
    const hoje = new Date(2026, 10, 13, 10, 0);
    expect(dataDoMes(2026, 11, hoje)).toBe("2026-11-13");
    expect(dataDoMes(2026, 12, hoje)).toBe("2026-12-01");
  });

  it("somar dias atravessa mês e ano", () => {
    expect(somarDias("2026-12-27", 7)).toBe("2027-01-03");
    expect(somarDias("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("título da semana mostra o intervalo", () => {
    expect(tituloSemana("2026-11-08")).toBe("8 – 14 de novembro de 2026");
    expect(tituloSemana("2026-11-29")).toBe("29 de novembro – 5 de dezembro de 2026");
    expect(tituloSemana("2026-12-27")).toBe("27 de dezembro de 2026 – 2 de janeiro de 2027");
  });

  it("textos amigáveis", () => {
    expect(rotuloStatus("rascunho")).toBe("Rascunho");
    expect(rotuloStatus("concluida")).toBe("Concluída");
    expect(plural(1, "evento")).toBe("1 evento");
    expect(plural(3, "pessoa")).toBe("3 pessoas");
    expect(formatarTelefone("31975472748")).toBe("(31) 97547-2748");
    expect(formatarTelefone("3138152570")).toBe("(31) 3815-2570");
  });

  it("evento que passa da meia-noite é sinalizado", () => {
    expect(faixaHorario("23:30", "02:00")).toBe("23:30 – 02:00 (dia seguinte)");
    expect(faixaHorario("19:00", "21:00")).toBe("19:00 – 21:00");
    expect(faixaHorario("18:00", null)).toBe("18:00");
  });
});
