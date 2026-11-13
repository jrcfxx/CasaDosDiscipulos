import React from "react";
import type { EventoUnificado, SlotInstrumento, VisualizacaoMes } from "../../services/escalaService";
import { faixaHorario, plural, rotuloStatus, toIsoDate } from "../../utils/escalaDatas";
import { funcaoDe } from "../../utils/funcaoEscala";

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Áreas do evento com quem está escalado e quantas vagas faltam */
export function resumoAreas(ev: EventoUnificado) {
  const porArea = new Map<string, { nome: string; pessoas: string[]; faltam: number }>();
  const slots = Object.values(ev.instrumentos || {}).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  for (const s of slots as SlotInstrumento[]) {
    const a = porArea.get(s.areaNome) || { nome: s.areaNome, pessoas: [], faltam: 0 };
    for (const m of s.membros) {
      const f = funcaoDe(m.detalhes, s.areaNome) || (s.tipo !== "_geral" ? s.nome : null);
      a.pessoas.push(f ? `${m.usuario.nome} (${f})` : m.usuario.nome);
    }
    if (s.limite != null) a.faltam += Math.max(0, s.limite - s.membros.length);
    porArea.set(s.areaNome, a);
  }
  return [...porArea.values()];
}

interface Props {
  visao: VisualizacaoMes;
  onAbrirEvento: (id: number) => void;
  onAbrirDia: (data: string) => void;
  podeEditar: boolean;
}

/** Agenda: lista cronológica dos eventos do mês, com a equipe de cada um */
const EscalaAgenda: React.FC<Props> = ({ visao, onAbrirEvento, onAbrirDia, podeEditar }) => {
  const hoje = toIsoDate(new Date());
  const dias = (visao.dias || []).filter((d) => d.eventos.length > 0);

  if (dias.length === 0) {
    return (
      <div className="esc-vazio">
        <p className="esc-vazio__titulo">Nenhum evento em {visao.mesNome?.toLowerCase() || "este mês"}</p>
        <p className="esc-vazio__texto">Use as setas para ver outros meses.</p>
      </div>
    );
  }

  return (
    <ol className="agenda" aria-label="Agenda do mês">
      {dias.map((dia) => {
        const d = new Date(`${dia.data}T12:00:00`);
        const classeDia = dia.data === hoje ? " agenda-dia--hoje" : dia.data < hoje ? " agenda-dia--passado" : "";
        return (
          <li key={dia.data} className={`agenda-dia${classeDia}`}>
            <button
              type="button"
              className="agenda-dia__data"
              onClick={() => onAbrirDia(dia.data)}
              title="Abrir o dia"
              aria-label={`Abrir ${dia.diaDaSemana}, ${dia.diaNumero}`}
            >
              <span className="agenda-dia__semana">{dia.diaDaSemana.slice(0, 3)}</span>
              <span className="agenda-dia__numero">{dia.diaNumero}</span>
              <span className="agenda-dia__mes">{MESES_CURTOS[d.getMonth()]}</span>
            </button>
            <div className="agenda-dia__eventos">
              {dia.eventos.map((ev) => {
                const areas = resumoAreas(ev);
                const total = ev.totais?.vagasTotal ?? 0;
                const cheias = ev.totais?.vagasPreenchidas ?? 0;
                const pct = total > 0 ? Math.min(100, Math.round((cheias / total) * 100)) : null;
                return (
                  <article key={ev.id} className={`agenda-evento status-${ev.status}`}>
                    <button type="button" className="agenda-evento__alvo" onClick={() => onAbrirEvento(ev.id)}>
                      <span className="agenda-evento__topo">
                        <span className="agenda-evento__hora">{faixaHorario(ev.horaInicio, ev.horaFim)}</span>
                        {ev.status !== "publicada" && (
                          <span className={`esc-chip esc-chip--${ev.status}`}>{rotuloStatus(ev.status)}</span>
                        )}
                      </span>
                      <span className="agenda-evento__nome">{ev.nome}</span>
                    </button>
                    {pct != null && podeEditar && (
                      <div className="agenda-evento__preench" title={`${cheias} de ${total} vagas preenchidas`}>
                        <span className="esc-barra" aria-hidden>
                          <span style={{ width: `${pct}%` }} className={pct === 100 ? "completo" : ""} />
                        </span>
                        <span className="agenda-evento__preench-txt">
                          {cheias}/{total} vagas
                        </span>
                      </div>
                    )}
                    {areas.length > 0 ? (
                      <dl className="agenda-evento__areas">
                        {areas.map((a) => (
                          <div key={a.nome} className="agenda-area">
                            <dt>{a.nome}</dt>
                            <dd>
                              {a.pessoas.length ? a.pessoas.join(", ") : <span className="agenda-area__ninguem">Ninguém escalado</span>}
                              {podeEditar && a.faltam > 0 && (
                                <span className="agenda-area__faltam">
                                  {a.faltam === 1 ? "falta 1" : `faltam ${a.faltam}`}
                                </span>
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="agenda-area__ninguem">Sem áreas definidas</p>
                    )}
                    {!podeEditar && ev.totais?.totalPessoas ? (
                      <p className="agenda-evento__rodape">{plural(ev.totais.totalPessoas, "pessoa servindo", "pessoas servindo")}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default EscalaAgenda;
