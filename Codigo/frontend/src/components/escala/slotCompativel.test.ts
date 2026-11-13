import { describe, expect, it, vi } from "vitest";

// O módulo importa dnd-kit; aqui só a função pura interessa
vi.mock("@dnd-kit/core", () => ({}));
vi.mock("./EscalaQuadroUnificado", () => ({ SlotDrop: () => null, payloadDeDrop: () => null }));

import { slotCompativel } from "./EscalaVisoes";
import type { SlotInstrumento, SlotMembro } from "../../services/escalaService";

const slot = (p: Partial<SlotInstrumento>) =>
  ({ tipo: "_geral", areaNome: "", id_escala_area: 0, id_ministerio: null, membros: [], atual: 0, ordem: 0, ...p }) as SlotInstrumento;
const membro = { membroEscalaId: 1, tipoSlot: "violao", id_escala_area: 10 } as SlotMembro;

describe("soltar sobre o card do evento", () => {
  const origem = slot({ tipo: "violao", areaNome: "Louvor", id_escala_area: 10, id_ministerio: 1 });

  it("vai para a mesma função no mesmo ministério", () => {
    const destino = [
      slot({ tipo: "_geral", areaNome: "Mídia", id_ministerio: 2, id_escala_area: 20 }),
      slot({ tipo: "vocal", areaNome: "Louvor", id_ministerio: 1, id_escala_area: 30 }),
      slot({ tipo: "violao", areaNome: "Louvor", id_ministerio: 1, id_escala_area: 30 }),
    ];
    expect(slotCompativel(destino, origem, membro)?.tipo).toBe("violao");
  });

  it("nunca cai em outro ministério (antes ia para a primeira área do evento)", () => {
    const destino = [slot({ tipo: "_geral", areaNome: "Mídia", id_ministerio: 2, id_escala_area: 20 })];
    expect(slotCompativel(destino, origem, membro)).toBeUndefined();
  });

  it("sem a mesma função, usa a área geral do mesmo ministério", () => {
    const destino = [
      slot({ tipo: "_geral", areaNome: "Mídia", id_ministerio: 2 }),
      slot({ tipo: "_geral", areaNome: "Louvor", id_ministerio: 1, id_escala_area: 40 }),
    ];
    expect(slotCompativel(destino, origem, membro)?.id_escala_area).toBe(40);
  });
});
