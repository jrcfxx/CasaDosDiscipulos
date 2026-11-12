import { describe, it, expect } from "vitest";
import { parseAlternativas, parseSelect } from "./campoConteudo";

describe("parseAlternativas (múltipla escolha / checkbox)", () => {
  it("lê o JSON salvo e normaliza 'correta'", () => {
    const json = JSON.stringify({ alternativas: [{ texto: "A", correta: 1 }, { texto: "B" }] });
    expect(parseAlternativas(json)).toEqual({
      alternativas: [
        { texto: "A", correta: true },
        { texto: "B", correta: false },
      ],
    });
  });
  it("aceita objeto já decodificado", () => {
    expect(parseAlternativas({ alternativas: [{ texto: "X", correta: true }] }).alternativas[0].texto).toBe("X");
  });
  it("texto puro (dado antigo) vira uma alternativa correta", () => {
    expect(parseAlternativas("Jesus")).toEqual({ alternativas: [{ texto: "Jesus", correta: true }] });
    expect(parseAlternativas('{"outra":1}')).toEqual({ alternativas: [{ texto: '{"outra":1}', correta: true }] });
  });
  it("vazio ou inválido vira lista vazia", () => {
    expect(parseAlternativas("")).toEqual({ alternativas: [] });
    expect(parseAlternativas(null)).toEqual({ alternativas: [] });
    expect(parseAlternativas(42)).toEqual({ alternativas: [] });
  });
});

describe("parseSelect", () => {
  it("lê opções e resposta correta", () => {
    expect(parseSelect('{"opcoes":["a","b"],"correta":"b"}')).toEqual({ opcoes: ["a", "b"], correta: "b" });
    expect(parseSelect('{"opcoes":["a"]}')).toEqual({ opcoes: ["a"], correta: "" });
  });
  it("texto puro vira opção única e correta", () => {
    expect(parseSelect("Sim")).toEqual({ opcoes: ["Sim"], correta: "Sim" });
  });
  it("vazio vira estrutura vazia", () => {
    expect(parseSelect(undefined)).toEqual({ opcoes: [], correta: "" });
  });
});
