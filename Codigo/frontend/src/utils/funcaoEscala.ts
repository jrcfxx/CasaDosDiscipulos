import { getCamposPorArea } from "../config/ministerioCampos";

type Detalhes = Record<string, string | number | null> | null | undefined;

/**
 * Função da pessoa na área ("Violão", "Câmera 1"...), a partir dos campos de escolha da área.
 * Observações e textos livres ficam de fora: aqui é só o rótulo curto.
 */
export function funcaoDe(detalhes: Detalhes, nomeArea: string): string | null {
  if (!detalhes) return null;
  for (const campo of getCamposPorArea(nomeArea)) {
    if (campo.tipo !== "select") continue;
    const v = detalhes[campo.chave];
    if (v == null || !String(v).trim()) continue;
    return campo.opcoes?.find((o) => o.value === v)?.label ?? String(v);
  }
  return null;
}
