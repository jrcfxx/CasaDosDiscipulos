/**
 * Relatório de formulários da Secretaria das Células (regras puras, sem banco).
 *
 * O período é dividido em "janelas" conforme a frequência do formulário (semana, quinzena,
 * mês, bimestre). Em cada janela a célula está:
 *   - "enviado": mandou pelo menos um relatório com data dentro da janela;
 *   - "faltou": a janela já terminou e não houve envio;
 *   - "aguardando": a janela ainda está em andamento e não houve envio (não conta como atraso).
 * Célula "em dia" = nenhuma janela encerrada sem envio no período.
 */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "yyyy-mm-dd" de uma Date no fuso local */
export function isoLocal(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Date ao meio-dia local (evita pular de dia com horário de verão/fuso) */
function deIso(s) {
  const [a, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d, 12);
}

function somarDias(iso, n) {
  const d = deIso(iso);
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}

function rotuloIntervalo(ini, fim) {
  const a = deIso(ini);
  const b = deIso(fim);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MESES[b.getMonth()]}`;
  return `${a.getDate()} ${MESES[a.getMonth()]}–${b.getDate()} ${MESES[b.getMonth()]}`;
}

/** Quinzenas contadas a partir de um domingo fixo: a mesma data cai sempre na mesma quinzena */
const ANCORA_QUINZENA = "2024-01-07";

/**
 * Janelas da frequência que tocam o período [inicio, fim] (yyyy-mm-dd).
 * Janelas que começam depois de "hoje" ficam de fora (ainda não existem).
 */
export function janelasDoPeriodo(frequencia, inicio, fim, hoje = isoLocal(new Date())) {
  if (!inicio || !fim || inicio > fim) return [];
  const janelas = [];
  const add = (ini, f, rotulo) => {
    if (ini > hoje) return;
    janelas.push({
      inicio: ini,
      fim: f,
      rotulo,
      estado: f < hoje ? "encerrada" : "em_andamento",
    });
  };

  if (frequencia === "semanal" || frequencia === "quinzenal") {
    const passo = frequencia === "semanal" ? 7 : 14;
    let ini;
    if (passo === 7) {
      const d = deIso(inicio);
      d.setDate(d.getDate() - d.getDay()); // domingo
      ini = isoLocal(d);
    } else {
      const dias = Math.round((deIso(inicio) - deIso(ANCORA_QUINZENA)) / 86400000);
      ini = somarDias(ANCORA_QUINZENA, Math.floor(dias / 14) * 14);
    }
    while (ini <= fim) {
      const f = somarDias(ini, passo - 1);
      add(ini, f, rotuloIntervalo(ini, f));
      ini = somarDias(ini, passo);
    }
  } else if (frequencia === "mensal" || frequencia === "bimestral") {
    const meses = frequencia === "mensal" ? 1 : 2;
    const a = deIso(inicio);
    let ano = a.getFullYear();
    let mes = a.getMonth();
    if (meses === 2) mes -= mes % 2; // bimestres: jan-fev, mar-abr...
    for (;;) {
      const ini = isoLocal(new Date(ano, mes, 1, 12));
      if (ini > fim) break;
      const f = isoLocal(new Date(ano, mes + meses, 0, 12));
      const rotulo =
        meses === 1
          ? `${MESES[mes]}/${String(ano).slice(2)}`
          : `${MESES[mes]}–${MESES[(mes + 1) % 12]}/${String(ano).slice(2)}`;
      add(ini, f, rotulo);
      mes += meses;
      if (mes > 11) {
        ano += Math.floor(mes / 12);
        mes %= 12;
      }
    }
  } else {
    // Sem frequência: o período inteiro é uma janela só (acompanhamento de envio não se aplica)
    add(inicio, fim, rotuloIntervalo(inicio, fim));
  }
  return janelas;
}

/** Data que conta para o relatório: a do campo de data do formulário (ex.: "Data da reunião") ou a do envio */
export function dataDeReferencia(resposta, idCampoData) {
  if (idCampoData) {
    const v = resposta.valores?.[idCampoData];
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  }
  return isoLocal(new Date(resposta.data_resposta));
}

function numero(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Monta o relatório.
 * @param {object} p
 * @param {string} p.frequencia
 * @param {string} p.inicio yyyy-mm-dd
 * @param {string} p.fim yyyy-mm-dd
 * @param {Array<{id_celula:number,nome:string,ativa?:boolean|number,lideres?:string[]}>} p.celulas
 * @param {Array<{id_resposta:number,id_celula:number,data_resposta:string,nome_lider?:string,valores?:object}>} p.respostas
 * @param {Array<{id:number,label:string,tipo:string}>} p.campos campos do formulário (id = formulario_campo.id)
 * @param {string} [p.hoje]
 */
export function montarRelatorio({ frequencia, inicio, fim, celulas, respostas, campos, hoje = isoLocal(new Date()) }) {
  const campoData = campos.find((c) => c.tipo === "data") || null;
  const camposNumero = campos.filter((c) => c.tipo === "numero");
  // O formulário não guarda quando foi criado: o acompanhamento começa no primeiro relatório que
  // ele recebeu. Semanas/meses antes disso não contam como atraso (o formulário nem existia).
  const inicioUso = respostas.reduce((m, r) => {
    const d = dataDeReferencia(r, campoData?.id);
    return !m || d < m ? d : m;
  }, null) || hoje;
  const janelas = janelasDoPeriodo(frequencia || "", inicio, fim, hoje).filter((j) => j.fim >= inicioUso);
  const temFrequencia = Boolean(frequencia);

  // O período vale por janelas inteiras: se começa num sábado, a semana conta desde o domingo
  // (senão quem enviou na terça daquela semana apareceria como "faltou")
  const inicioEfetivo = janelas.length ? janelas[0].inicio : inicio;
  const fimEfetivo = janelas.length ? janelas[janelas.length - 1].fim : fim;
  const noPeriodo = respostas
    .map((r) => ({ ...r, data_ref: dataDeReferencia(r, campoData?.id) }))
    .filter((r) => r.data_ref >= inicioEfetivo && r.data_ref <= fimEfetivo);

  const ids = new Set(celulas.filter((c) => c.ativa === undefined || Boolean(c.ativa)).map((c) => c.id_celula));
  // Célula inativa que mandou relatório no período continua aparecendo (o envio existiu)
  for (const r of noPeriodo) ids.add(r.id_celula);
  const porId = new Map(celulas.map((c) => [c.id_celula, c]));

  const totaisCampo = (lista) =>
    camposNumero.map((c) => {
      const vals = lista.map((r) => numero(r.valores?.[c.id])).filter((n) => n !== null);
      const soma = vals.reduce((a, b) => a + b, 0);
      return {
        id: c.id,
        label: c.label,
        soma,
        media: vals.length ? Math.round((soma / vals.length) * 10) / 10 : null,
        preenchidos: vals.length,
      };
    });

  const linhas = [...ids].map((id) => {
    const cel = porId.get(id) || { id_celula: id, nome: `Célula ${id}` };
    const daCelula = noPeriodo.filter((r) => r.id_celula === id);
    const status = janelas.map((j) => {
      const n = daCelula.filter((r) => r.data_ref >= j.inicio && r.data_ref <= j.fim).length;
      return {
        envios: n,
        situacao: n > 0 ? "enviado" : j.estado === "encerrada" ? "faltou" : "aguardando",
      };
    });
    const encerradas = janelas.filter((j) => j.estado === "encerrada").length;
    const faltas = status.filter((s) => s.situacao === "faltou").length;
    const ultimo = daCelula.reduce((m, r) => (!m || r.data_ref > m ? r.data_ref : m), null);
    return {
      id_celula: id,
      nome: cel.nome,
      ativa: cel.ativa === undefined ? true : Boolean(cel.ativa),
      lideres: cel.lideres || [...new Set(daCelula.map((r) => r.nome_lider).filter(Boolean))],
      janelas: status,
      respostas: daCelula.length,
      encerradas,
      cumpridas: encerradas - faltas,
      faltas,
      emDia: temFrequencia ? faltas === 0 : null,
      ultimoEnvio: ultimo,
      totais: totaisCampo(daCelula),
    };
  });

  // Atrasadas primeiro (mais faltas no topo), depois por nome
  linhas.sort((a, b) => b.faltas - a.faltas || a.nome.localeCompare(b.nome, "pt-BR"));

  const esperados = linhas.reduce((n, l) => n + l.encerradas, 0);
  const cumpridos = linhas.reduce((n, l) => n + l.cumpridas, 0);
  const emDia = temFrequencia ? linhas.filter((l) => l.emDia).length : null;

  return {
    frequencia: frequencia || null,
    inicio,
    fim,
    inicioEfetivo,
    fimEfetivo,
    inicioUso,
    criterioData: campoData ? { tipo: "campo", label: campoData.label } : { tipo: "envio", label: "Data de envio" },
    janelas,
    celulas: linhas,
    resumo: {
      celulas: linhas.length,
      emDia,
      atrasadas: temFrequencia ? linhas.length - emDia : null,
      respostas: noPeriodo.length,
      enviosEsperados: esperados,
      enviosCumpridos: cumpridos,
      pontualidade: temFrequencia && esperados > 0 ? Math.round((cumpridos / esperados) * 100) : null,
      totais: totaisCampo(noPeriodo),
    },
  };
}
