/** Aviso devolvido ao copiar evento/dia/semana ou aplicar modelo */
export interface AvisoCopia {
  usuario?: string | null;
  nome?: string | null;
  id_usuario?: number;
  mensagem?: string;
}

/**
 * Texto curto dizendo QUEM ficou de fora e POR QUÊ (antes só aparecia "2 aviso(s)").
 * Ex.: "Não copiados: Ana (não participa mais do ministério de Louvor); Bia (conflito: Ensaio)".
 */
export function resumirAvisosCopia(avisos: unknown[] | undefined, limite = 4): string {
  const lista = (avisos || []) as AvisoCopia[];
  if (!lista.length) return "";
  const partes = lista.slice(0, limite).map((a) => {
    const quem = a.usuario || a.nome || (a.id_usuario ? `Pessoa #${a.id_usuario}` : "Pessoa");
    const motivo = String(a.mensagem || "")
      .replace(/^Não (copiado|incluído):\s*/i, "")
      .trim();
    return motivo ? `${quem} (${motivo.charAt(0).toLowerCase()}${motivo.slice(1)})` : quem;
  });
  const resto = lista.length > limite ? ` e mais ${lista.length - limite}` : "";
  return `Não copiados: ${partes.join("; ")}${resto}.`;
}
