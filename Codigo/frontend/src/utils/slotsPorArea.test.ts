import { describe, expect, it } from "vitest";
import { agruparPorArea, iconeDaArea } from "./slotsPorArea";
import type { SlotInstrumento } from "../services/escalaService";

function slot(p: Partial<SlotInstrumento>): SlotInstrumento {
  return {
    tipo: "x", nome: "X", icone: "equipe", limite: null, atual: 0, ordem: 0, chaveDetalhe: null,
    id_escala_area: 1, areaNome: "Área", podeGerenciar: true, membros: [], ...p,
  };
}
const m = (n: number) => Array.from({ length: n }, (_, i) => ({ id_usuario: i + 1 })) as unknown as SlotInstrumento["membros"];

describe("agruparPorArea", () => {
  it("põe as funções do Louvor dentro do Louvor, na ordem, sem misturar com outras áreas", () => {
    const grupos = agruparPorArea([
      ["2:_geral", slot({ tipo: "_geral", id_escala_area: 2, areaNome: "Recepção", ordem: 1, limite: 3, membros: m(1) })],
      ["1:bateria", slot({ tipo: "bateria", id_escala_area: 1, areaNome: "Louvor", ordem: 6, limite: 1, icone: "bateria" })],
      ["1:vocal", slot({ tipo: "vocal", id_escala_area: 1, areaNome: "Louvor", ordem: 2, limite: 4, icone: "microfone", membros: m(2) })],
      ["1:_geral", slot({ tipo: "_geral", id_escala_area: 1, areaNome: "Louvor", ordem: 9, membros: m(1) })],
    ]);
    expect(grupos.map((g) => g.areaNome)).toEqual(["Recepção", "Louvor"]);
    const louvor = grupos[1];
    expect(louvor.entradas.map(([k]) => k)).toEqual(["1:vocal", "1:bateria", "1:_geral"]);
    expect(louvor.atual).toBe(3);
    expect(louvor.limite).toBe(5); // "_geral" não soma vaga
    expect(iconeDaArea(louvor)).toBe("musica");
    // área de um "_geral" só: sem limite somado -> null
    expect(grupos[0].limite).toBeNull();
  });

  it("limite vira null quando alguma função não tem limite", () => {
    const [g] = agruparPorArea([
      ["1:a", slot({ tipo: "a", limite: 2 })],
      ["1:b", slot({ tipo: "b", limite: null, ordem: 1 })],
    ]);
    expect(g.limite).toBeNull();
  });

  it("ícone da área usa a primeira função com ícone próprio", () => {
    const [g] = agruparPorArea([
      ["1:a", slot({ tipo: "a", icone: "equipe" })],
      ["1:b", slot({ tipo: "b", icone: "projecao", ordem: 1 })],
    ]);
    expect(iconeDaArea(g)).toBe("projecao");
  });
});
