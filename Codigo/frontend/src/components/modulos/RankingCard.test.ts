import { describe, expect, it } from "vitest";
import { deveMostrarPosicao, getMensagemMotivacional, type MinhaPosicao } from "./RankingCard";

const base: MinhaPosicao = {
  posicao: 1,
  pontuacao: 0,
  nivel_escola: null,
  pontuacao_primeiro: 80,
  pontuacao_anterior: null,
};

describe("ranking: posição sem desanimar", () => {
  it("quem ainda não pontuou não vê posição e recebe convite", () => {
    const d = { ...base, posicao: 72, pontuacao: 0 };
    expect(deveMostrarPosicao(d)).toBe(false);
    expect(getMensagemMotivacional(d)).toMatch(/primeiro módulo/);
  });

  it("fora do top 20 destaca os pontos, não a posição", () => {
    const d = { ...base, posicao: 35, pontuacao: 15, pontuacao_anterior: 20 };
    expect(deveMostrarPosicao(d)).toBe(false);
    const msg = getMensagemMotivacional(d);
    expect(msg).toMatch(/15 pontos/);
    expect(msg).toMatch(/mais 5/);
    expect(msg).not.toMatch(/35º/);
  });

  it("no top 20 com pontos, mostra a posição", () => {
    const d = { ...base, posicao: 7, pontuacao: 40 };
    expect(deveMostrarPosicao(d)).toBe(true);
    expect(getMensagemMotivacional(d)).toMatch(/7º/);
  });

  it("primeiro lugar continua comemorado", () => {
    expect(getMensagemMotivacional({ ...base, posicao: 1, pontuacao: 80 })).toMatch(/1º lugar/);
  });
});
