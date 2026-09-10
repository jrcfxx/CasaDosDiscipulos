import React, { useMemo, useState } from "react";
import type { EstatisticasEscala } from "../../services/escalaService";
import "../../style/EscalaRelatorio.css";

type Props = {
  titulo: string;
  subtitulo?: string;
  estatisticas: EstatisticasEscala | null | undefined;
  onAbrirEvento?: (id: number) => void;
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  concluida: "Concluída",
};

const TIPO_LABEL: Record<string, string> = {
  culto: "Culto",
  ensaio: "Ensaio",
  celula: "Célula",
  oracao: "Oração",
  kids: "Kids / Infantil",
  jovens: "Jovens",
  evento: "Outros",
};

function formatarDataCurta(iso?: string) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function Barra({ valor, max, tom = "teal" }: { valor: number; max: number; tom?: "teal" | "gold" | "warn" }) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  return (
    <div className="escala-relatorio__barra" aria-hidden>
      <span
        className={`escala-relatorio__barra-fill escala-relatorio__barra-fill--${tom}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const EscalaRelatorio: React.FC<Props> = ({ titulo, subtitulo, estatisticas, onAbrirEvento }) => {
  const [aberto, setAberto] = useState(true);
  const s = estatisticas;

  const maxTipo = useMemo(
    () => Math.max(1, ...(s?.porTipo || []).map((x) => x.quantidade)),
    [s?.porTipo]
  );
  const maxDia = useMemo(
    () => Math.max(1, ...(s?.porDiaSemana || []).map((x) => x.quantidade)),
    [s?.porDiaSemana]
  );
  const maxSlot = useMemo(
    () => Math.max(1, ...(s?.instrumentosMaisUsados || []).slice(0, 8).map((x) => x.quantidade)),
    [s?.instrumentosMaisUsados]
  );
  const maxArea = useMemo(
    () => Math.max(1, ...(s?.areasMaisUsadas || []).slice(0, 8).map((x) => x.quantidade)),
    [s?.areasMaisUsadas]
  );

  if (!s) return null;

  const topPessoas = s.pessoasMaisEscaladas?.length
    ? s.pessoasMaisEscaladas.slice(0, 10)
    : s.pessoaMaisEscalada
      ? [s.pessoaMaisEscalada]
      : [];

  return (
    <section className={`escala-relatorio ${aberto ? "aberto" : "fechado"}`} aria-labelledby="escala-relatorio-titulo">
      <header className="escala-relatorio__header">
        <div>
          <p className="escala-relatorio__eyebrow">Relatório da escala</p>
          <h2 id="escala-relatorio-titulo" className="escala-relatorio__titulo">
            {titulo}
          </h2>
          {subtitulo && <p className="escala-relatorio__subtitulo">{subtitulo}</p>}
        </div>
        <button
          type="button"
          className="escala-relatorio__toggle"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
        >
          {aberto ? "Recolher" : "Expandir"}
        </button>
      </header>

      {aberto && (
        <div className="escala-relatorio__body">
          {(s.alertas?.length || 0) > 0 && (
            <div className="escala-relatorio__alertas" role="status">
              {s.alertas!.map((a) => (
                <p key={a} className="escala-relatorio__alerta">
                  {a}
                </p>
              ))}
            </div>
          )}

          <div className="escala-relatorio__kpis">
            <article className="escala-relatorio__kpi">
              <span className="escala-relatorio__kpi-valor">{s.totalEventos}</span>
              <span className="escala-relatorio__kpi-label">Eventos</span>
            </article>
            <article className="escala-relatorio__kpi">
              <span className="escala-relatorio__kpi-valor">{s.pessoasUnicas}</span>
              <span className="escala-relatorio__kpi-label">Pessoas únicas</span>
            </article>
            <article className="escala-relatorio__kpi">
              <span className="escala-relatorio__kpi-valor">{s.totalPessoas}</span>
              <span className="escala-relatorio__kpi-label">Escalações</span>
            </article>
            <article className="escala-relatorio__kpi">
              <span className="escala-relatorio__kpi-valor">{s.taxaPreenchimento ?? 0}%</span>
              <span className="escala-relatorio__kpi-label">Preenchimento</span>
            </article>
            <article className="escala-relatorio__kpi">
              <span className="escala-relatorio__kpi-valor">{s.mediaPessoasPorEvento ?? 0}</span>
              <span className="escala-relatorio__kpi-label">Média / evento</span>
            </article>
            <article className="escala-relatorio__kpi">
              <span className="escala-relatorio__kpi-valor">{s.vagasDisponiveis ?? 0}</span>
              <span className="escala-relatorio__kpi-label">Vagas abertas</span>
            </article>
          </div>

          <div className="escala-relatorio__grid">
            <article className="escala-relatorio__card">
              <h3>Panorama do período</h3>
              <ul className="escala-relatorio__lista">
                <li>
                  Passados: <strong>{s.eventosPassados ?? 0}</strong>
                </li>
                <li>
                  Hoje: <strong>{s.eventosHoje ?? 0}</strong>
                </li>
                <li>
                  Futuros: <strong>{s.eventosFuturos ?? 0}</strong>
                </li>
                {s.diasComEventos != null && (
                  <li>
                    Dias com eventos: <strong>{s.diasComEventos}</strong>
                  </li>
                )}
                {s.diasVazios != null && (
                  <li>
                    Dias sem eventos: <strong>{s.diasVazios}</strong>
                  </li>
                )}
                <li>
                  Vagas preenchidas:{" "}
                  <strong>
                    {s.vagasPreenchidas ?? 0}/{s.vagasTotal ?? 0}
                  </strong>
                </li>
              </ul>
              {(s.porStatus || []).length > 0 && (
                <div className="escala-relatorio__chips">
                  {s.porStatus!.map((st) => (
                    <span key={st.chave} className={`escala-relatorio__chip status-${st.chave}`}>
                      {STATUS_LABEL[st.chave] || st.chave}: {st.quantidade}
                    </span>
                  ))}
                </div>
              )}
            </article>

            <article className="escala-relatorio__card">
              <h3>Quem mais serviu</h3>
              {topPessoas.length === 0 ? (
                <p className="escala-relatorio__vazio">Ninguém escalado neste período.</p>
              ) : (
                <ol className="escala-relatorio__ranking">
                  {topPessoas.map((p, i) => (
                    <li key={p.id}>
                      <span className="escala-relatorio__pos">{i + 1}º</span>
                      <div className="escala-relatorio__pessoa">
                        <strong>{p.nome}</strong>
                        <span>
                          {p.totalEscalas}x
                          {p.diasEscalado != null ? ` · ${p.diasEscalado} dia(s)` : ""}
                          {p.funcoesPrincipais?.[0]
                            ? ` · ${p.funcoesPrincipais.map((f) => f.nome).join(", ")}`
                            : ""}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </article>

            <article className="escala-relatorio__card">
              <h3>Equilíbrio da equipe</h3>
              <p className="escala-relatorio__hint">
                Pessoas com menos escalas — úteis para rotacionar e evitar sobrecarga.
              </p>
              {(s.pessoasMenosEscaladas || []).length === 0 ? (
                <p className="escala-relatorio__vazio">Sem dados suficientes.</p>
              ) : (
                <ul className="escala-relatorio__lista">
                  {s.pessoasMenosEscaladas!.map((p) => (
                    <li key={p.id}>
                      {p.nome}{" "}
                      <strong>
                        {p.totalEscalas}x
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="escala-relatorio__card">
              <h3>Tipos de evento</h3>
              {(s.porTipo || []).length === 0 ? (
                <p className="escala-relatorio__vazio">Sem eventos.</p>
              ) : (
                <ul className="escala-relatorio__bars">
                  {s.porTipo!.map((t) => (
                    <li key={t.chave}>
                      <div className="escala-relatorio__bar-row">
                        <span>{TIPO_LABEL[t.chave] || t.chave}</span>
                        <strong>{t.quantidade}</strong>
                      </div>
                      <Barra valor={t.quantidade} max={maxTipo} />
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="escala-relatorio__card">
              <h3>Distribuição na semana</h3>
              {(s.porDiaSemana || []).length === 0 ? (
                <p className="escala-relatorio__vazio">Sem dados.</p>
              ) : (
                <ul className="escala-relatorio__bars">
                  {s.porDiaSemana!.map((d) => (
                    <li key={d.chave}>
                      <div className="escala-relatorio__bar-row">
                        <span>{d.chave}</span>
                        <strong>{d.quantidade}</strong>
                      </div>
                      <Barra valor={d.quantidade} max={maxDia} tom="gold" />
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="escala-relatorio__card">
              <h3>Funções / slots mais usados</h3>
              {(s.instrumentosMaisUsados || []).length === 0 ? (
                <p className="escala-relatorio__vazio">Sem escalas registradas.</p>
              ) : (
                <ul className="escala-relatorio__bars">
                  {s.instrumentosMaisUsados!.slice(0, 8).map((slot) => {
                    const nome = slot.instrumento || slot.tipo || "—";
                    return (
                      <li key={nome}>
                        <div className="escala-relatorio__bar-row">
                          <span>{nome === "_geral" ? "Geral" : nome}</span>
                          <strong>{slot.quantidade}</strong>
                        </div>
                        <Barra valor={slot.quantidade} max={maxSlot} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>

            <article className="escala-relatorio__card">
              <h3>Ministérios / áreas</h3>
              {(s.areasMaisUsadas || []).length === 0 ? (
                <p className="escala-relatorio__vazio">Sem áreas com pessoas.</p>
              ) : (
                <ul className="escala-relatorio__bars">
                  {s.areasMaisUsadas!.slice(0, 8).map((a) => (
                    <li key={a.area}>
                      <div className="escala-relatorio__bar-row">
                        <span>{a.area}</span>
                        <strong>{a.quantidade}</strong>
                      </div>
                      <Barra valor={a.quantidade} max={maxArea} tom="gold" />
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="escala-relatorio__card escala-relatorio__card--wide">
              <h3>Atenção da administração</h3>
              <div className="escala-relatorio__atencao">
                <div>
                  <h4>
                    Sem ninguém escalado ({s.totalEventosSemPessoas ?? s.eventosSemPessoas?.length ?? 0})
                  </h4>
                  {(s.eventosSemPessoas || []).length === 0 ? (
                    <p className="escala-relatorio__vazio">Nenhum — ótimo!</p>
                  ) : (
                    <ul className="escala-relatorio__lista-eventos">
                      {s.eventosSemPessoas!.map((ev) => (
                        <li key={ev.id}>
                          <button
                            type="button"
                            className="escala-relatorio__link-ev"
                            onClick={() => onAbrirEvento?.(ev.id)}
                          >
                            {formatarDataCurta(ev.data)}
                            {ev.horaInicio ? ` · ${String(ev.horaInicio).slice(0, 5)}` : ""} — {ev.nome}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4>
                    Com vagas em aberto ({s.totalEventosIncompletos ?? s.eventosIncompletos?.length ?? 0})
                  </h4>
                  {(s.eventosIncompletos || []).length === 0 ? (
                    <p className="escala-relatorio__vazio">Nenhum — escalas completas.</p>
                  ) : (
                    <ul className="escala-relatorio__lista-eventos">
                      {s.eventosIncompletos!.map((ev) => (
                        <li key={ev.id}>
                          <button
                            type="button"
                            className="escala-relatorio__link-ev"
                            onClick={() => onAbrirEvento?.(ev.id)}
                          >
                            {formatarDataCurta(ev.data)}
                            {ev.horaInicio ? ` · ${String(ev.horaInicio).slice(0, 5)}` : ""} — {ev.nome}
                            {ev.vagasDisponiveis != null ? ` (${ev.vagasDisponiveis} vaga(s))` : ""}
                          </button>
                          {ev.slotsVazios && ev.slotsVazios.length > 0 && (
                            <span className="escala-relatorio__slots-faltando">
                              Falta: {ev.slotsVazios.map((x) => x.nome).join(", ")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
};

export default EscalaRelatorio;
