import { describe, it, expect } from "vitest";
import { cortesValidos, escolherCorte, escolherLayout, nomeArquivoPdf, paginar } from "./exportarPdf";

describe("cortes válidos", () => {
  it("colunas lado a lado: não corta no meio de um cartão da coluna vizinha", () => {
    // coluna A: cartões 0-100 e 110-210; coluna B: cartão 50-160
    const c = cortesValidos([[0, 100], [110, 210], [50, 160]], 300);
    expect(c).not.toContain(100); // 100 corta o cartão da coluna B (50-160)
    expect(c).not.toContain(110);
    expect(c).toContain(210);
    expect(c).toContain(300);
  });
});

describe("quebra de página", () => {
  it("corta no corte válido mais baixo que cabe na página", () => {
    expect(escolherCorte(0, 1000, [300, 780, 1040], 3000)).toBe(780);
  });
  it("não aceita corte muito alto (desperdiçaria meia página)", () => {
    expect(escolherCorte(0, 1000, [200], 3000)).toBe(1000);
  });
  it("paginar cobre o conteúdo inteiro sem buracos", () => {
    const f = paginar(2500, 1000, [700, 1600, 2300]);
    expect(f).toEqual([[0, 700], [700, 1600], [1600, 2500]]);
  });
});

describe("escolha de orientação e tamanho", () => {
  it("organograma alto e estreito: retrato numa página só (antes saía em 2 páginas em paisagem)", () => {
    const l = escolherLayout(1100, 1468, [400, 900, 1468], true);
    expect(l.fatias).toHaveLength(1);
    expect(l.paisagem).toBe(false);
  });
  it("conteúdo largo e baixo: paisagem", () => {
    const l = escolherLayout(1800, 700, [700], false);
    expect(l.paisagem).toBe(true);
    expect(l.fatias).toHaveLength(1);
  });
  it("nunca passa da largura da página (nada cortado nas laterais)", () => {
    const l = escolherLayout(2400, 900, [900]);
    const larguraUtil = (l.paisagem ? 841.89 : 595.28) - 48;
    expect(2400 * l.escala).toBeLessThanOrEqual(larguraUtil + 0.01);
  });
  it("conteúdo longo: várias páginas com texto legível, sem encolher demais", () => {
    const cortes = Array.from({ length: 60 }, (_, i) => (i + 1) * 100);
    const l = escolherLayout(1000, 6000, cortes);
    expect(l.fatias.length).toBeGreaterThan(1);
    expect(l.escala).toBeGreaterThanOrEqual(0.45);
  });
});

describe("nome do arquivo", () => {
  it("tira caracteres inválidos e põe .pdf", () => {
    expect(nomeArquivoPdf("Escala: Nov/2026")).toBe("Escala Nov 2026.pdf");
  });
});
