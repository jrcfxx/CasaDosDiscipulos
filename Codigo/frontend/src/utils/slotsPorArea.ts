import type { SlotInstrumento } from "../services/escalaService";

export interface GrupoArea {
  id_escala_area: number;
  areaNome: string;
  id_ministerio?: number | null;
  entradas: [string, SlotInstrumento][];
  /** Pessoas escaladas na área (todas as funções) */
  atual: number;
  /** Soma das vagas das funções com limite (null se alguma função não tem limite) */
  limite: number | null;
}

/**
 * Agrupa as funções do evento por área, na ordem em que vêm. Assim "Vocal", "Violão", "Bateria"…
 * aparecem DENTRO de "Louvor" (antes apareciam soltas no meio dos outros ministérios).
 */
export function agruparPorArea(entradas: [string, SlotInstrumento][]): GrupoArea[] {
  const ordenadas = [...entradas].sort((a, b) => (a[1].ordem || 0) - (b[1].ordem || 0));
  const grupos: GrupoArea[] = [];
  const porArea = new Map<number, GrupoArea>();
  for (const [chave, slot] of ordenadas) {
    let g = porArea.get(slot.id_escala_area);
    if (!g) {
      g = {
        id_escala_area: slot.id_escala_area,
        areaNome: slot.areaNome,
        id_ministerio: slot.id_ministerio ?? null,
        entradas: [],
        atual: 0,
        limite: 0,
      };
      porArea.set(slot.id_escala_area, g);
      grupos.push(g);
    }
    g.entradas.push([chave, slot]);
    g.atual += slot.membros.length;
    // "_geral" sem ninguém não conta vaga: é só onde cai quem não tem função definida
    if (slot.tipo === "_geral") continue;
    g.limite = g.limite == null || slot.limite == null ? null : g.limite + slot.limite;
  }
  for (const g of grupos) if (g.limite === 0) g.limite = null;
  return grupos;
}

/** Ícone do cabeçalho da área, a partir das funções dela */
export function iconeDaArea(g: GrupoArea): string {
  const icones = g.entradas.map(([, s]) => s.icone);
  if (icones.some((i) => ["microfone", "guitarra", "teclado", "bateria", "musica"].includes(i))) return "musica";
  return icones.find((i) => i && i !== "equipe") || "equipe";
}
