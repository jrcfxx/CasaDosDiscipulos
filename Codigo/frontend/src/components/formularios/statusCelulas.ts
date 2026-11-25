/**
 * Filtros da lista de respostas dos formulários da Secretaria das Células.
 * (O relatório de em dia/atrasada é calculado no backend: utils/relatorioFormulario.js.)
 */

export interface RespostaResumo {
  id_celula: number;
  data_resposta: string;
  /** yyyy-mm-dd: data da reunião (ou do envio) — é a usada no filtro de datas */
  data_referencia?: string;
  nome_lider?: string;
}

export interface FiltrosRespostas {
  /** "" = todas as células */
  celula: number | "";
  /** "" = todos; "-" = respostas sem líder identificado */
  respondente: string;
  /** yyyy-mm-dd ou "" */
  dataInicio: string;
  dataFim: string;
}

/** Respostas filtradas por célula, respondente e intervalo de datas (dias inteiros) */
export function filtrarRespostas<T extends RespostaResumo>(respostas: T[], f: FiltrosRespostas): T[] {
  return respostas.filter((r) => {
    if (f.celula !== "" && r.id_celula !== f.celula) return false;
    if (f.respondente) {
      if (f.respondente === "-") {
        if (r.nome_lider) return false;
      } else if ((r.nome_lider || "").toLowerCase() !== f.respondente.toLowerCase()) {
        return false;
      }
    }
    if (f.dataInicio || f.dataFim) {
      try {
        const dr = (r.data_referencia ? new Date(r.data_referencia + "T12:00:00") : new Date(r.data_resposta)).setHours(0, 0, 0, 0);
        // "yyyy-mm-dd" sozinho é lido como meia-noite UTC (21h da véspera em Brasília):
        // com o horário explícito a data é lida no fuso local, como no painel.
        if (f.dataInicio) {
          const di = new Date(f.dataInicio + "T00:00:00").setHours(0, 0, 0, 0);
          if (dr < di) return false;
        }
        if (f.dataFim) {
          const df = new Date(f.dataFim + "T00:00:00").setHours(23, 59, 59, 999);
          if (dr > df) return false;
        }
      } catch {
        /* ignora data inválida */
      }
    }
    return true;
  });
}

/** Lista de respondentes para o filtro ("-" representa resposta sem líder) */
export function respondentesUnicos(respostas: RespostaResumo[]): string[] {
  return [...new Set(respostas.map((r) => r.nome_lider || "-").filter(Boolean))].sort();
}
