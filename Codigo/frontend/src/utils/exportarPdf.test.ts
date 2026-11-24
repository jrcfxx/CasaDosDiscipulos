import { describe, it, expect } from "vitest";
import { escolherCorte, nomeArquivoPdf } from "./exportarPdf";

describe("quebra de página do PDF", () => {
  it("corta na borda de bloco mais baixa que ainda cabe na página", () => {
    // página de 1000px; blocos terminam em 300, 780 e 1040
    expect(escolherCorte(0, 1000, [300, 780, 1040], 3000)).toBe(780);
  });
  it("não aceita borda muito alta (desperdiçaria meia página)", () => {
    expect(escolherCorte(0, 1000, [200], 3000)).toBe(1000);
  });
  it("última página vai até o fim", () => {
    expect(escolherCorte(2500, 1000, [2600], 2900)).toBe(2900);
  });
  it("continua de onde a página anterior parou", () => {
    expect(escolherCorte(780, 1000, [1040, 1700, 1900], 3000)).toBe(1700);
  });
});

describe("nome do arquivo", () => {
  it("tira caracteres inválidos e põe .pdf", () => {
    expect(nomeArquivoPdf("Escala: Nov/2026")).toBe("Escala Nov 2026.pdf");
  });
});
