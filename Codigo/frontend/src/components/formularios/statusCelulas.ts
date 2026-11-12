/**
 * Regras do acompanhamento de formulários da Secretaria das Células
 * (antes calculadas dentro da tela FormulariosSecretariaCelulasAdmin).
 */

export interface RespostaResumo {
  id_celula: number;
  data_resposta: string;
  nome_lider?: string;
}

export interface CelulaResumo {
  id_celula: number;
  nome: string;
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
        const dr = new Date(r.data_resposta).setHours(0, 0, 0, 0);
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

export interface StatusCelulas {
  temFrequencia: boolean;
  periodoValido: boolean;
  celulasEmDia: Array<CelulaResumo & { count: number }>;
  celulasAtrasadas: CelulaResumo[];
  totalCelulas: number;
  emDiaCount: number;
  pendentesCount: number;
  percentualEmDia: number;
}

/**
 * Célula "em dia" = pelo menos uma resposta dentro do período escolhido.
 * Sem frequência definida no formulário, o acompanhamento não se aplica.
 */
export function calcularStatusCelulas(params: {
  celulas: CelulaResumo[];
  respostas: RespostaResumo[];
  frequencia: string;
  inicio: string;
  fim: string;
}): StatusCelulas {
  const { celulas, respostas, frequencia, inicio, fim } = params;
  const temFrequencia = !!frequencia;

  const dataInicioPeriodo = inicio ? new Date(inicio + "T00:00:00.000") : null;
  const dataFimPeriodo = fim ? new Date(fim + "T23:59:59.999") : null;
  const periodoValido = Boolean(
    dataInicioPeriodo &&
      dataFimPeriodo &&
      !isNaN(dataInicioPeriodo.getTime()) &&
      !isNaN(dataFimPeriodo.getTime()) &&
      dataInicioPeriodo <= dataFimPeriodo
  );

  const respostasNoPeriodo = periodoValido
    ? respostas.filter((r) => {
        const dt = new Date(r.data_resposta);
        return dt >= dataInicioPeriodo! && dt <= dataFimPeriodo!;
      })
    : respostas;

  const celulasEmDia: StatusCelulas["celulasEmDia"] = [];
  const celulasAtrasadas: CelulaResumo[] = [];
  if (temFrequencia) {
    celulas.forEach((c) => {
      const count = respostasNoPeriodo.filter((r) => r.id_celula === c.id_celula).length;
      const emDia = periodoValido ? count >= 1 : false;
      if (emDia) celulasEmDia.push({ id_celula: c.id_celula, nome: c.nome, count });
      else celulasAtrasadas.push({ id_celula: c.id_celula, nome: c.nome });
    });
  }

  const totalCelulas = celulas.length;
  const emDiaCount = celulasEmDia.length;
  return {
    temFrequencia,
    periodoValido,
    celulasEmDia,
    celulasAtrasadas,
    totalCelulas,
    emDiaCount,
    pendentesCount: celulasAtrasadas.length,
    percentualEmDia: totalCelulas > 0 ? Math.round((emDiaCount / totalCelulas) * 100) : 0,
  };
}
