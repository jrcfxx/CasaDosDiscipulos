import React, { useEffect, useMemo, useState } from "react";
import escalaService, { type MinhaEscala } from "../../services/escalaService";
import { funcaoDe } from "../../utils/funcaoEscala";
import { plural, toIsoDate } from "../../utils/escalaDatas";

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function hora(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "Hoje", "Amanhã", "Em 5 dias" */
export function quandoFalta(inicio: Date, agora = new Date()): string {
  const a = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const b = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const dias = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (dias <= 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
}

interface Props {
  onAbrirEvento: (id: number) => void;
  onVerCalendario: () => void;
  idUsuario?: number;
}

/** Visão do membro: quando eu sirvo, onde, em qual função e com quem */
const MinhasEscalas: React.FC<Props> = ({ onAbrirEvento, onVerCalendario, idUsuario }) => {
  const [itens, setItens] = useState<MinhaEscala[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    escalaService
      .getMinhasEscalas()
      .then((l) => vivo && setItens(l))
      .catch(() => vivo && setErro(true));
    return () => {
      vivo = false;
    };
  }, []);

  // Agrupa por mês ("Novembro de 2026")
  const grupos = useMemo(() => {
    const m = new Map<string, MinhaEscala[]>();
    for (const it of itens || []) {
      const d = new Date(it.inicio);
      const chave = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      m.set(chave, [...(m.get(chave) || []), it]);
    }
    return [...m.entries()];
  }, [itens]);

  if (erro) {
    return (
      <div className="minhas-vazio" role="alert">
        <p>Não foi possível carregar suas escalas agora.</p>
        <button type="button" className="esc-btn" onClick={() => window.location.reload()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!itens) {
    return (
      <div className="minhas-lista" aria-busy="true" aria-label="Carregando suas escalas">
        {[0, 1, 2].map((i) => (
          <div key={i} className="minha-card minha-card--esqueleto" />
        ))}
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="minhas-vazio">
        <p className="minhas-vazio__titulo">Você não tem escalas nos próximos meses</p>
        <p className="minhas-vazio__texto">
          Quando a liderança escalar você e publicar a escala, ela aparece aqui.
        </p>
        <button type="button" className="esc-btn" onClick={onVerCalendario}>
          Ver calendário da igreja
        </button>
      </div>
    );
  }

  const hoje = toIsoDate(new Date());

  return (
    <div className="minhas-escalas">
      <p className="minhas-resumo">
        {plural(itens.length, "escala")} nos próximos meses
      </p>
      {grupos.map(([mes, lista]) => (
        <section key={mes} className="minhas-grupo" aria-label={mes}>
          <h2 className="minhas-grupo__titulo">{mes}</h2>
          <ul className="minhas-lista">
            {lista.map((it) => {
              const ini = new Date(it.inicio);
              const fim = it.fim ? new Date(it.fim) : null;
              const funcao = funcaoDe(it.detalhes, it.area);
              const ehHoje = toIsoDate(ini) === hoje;
              const totalEquipe = it.equipe.reduce((n, a) => n + a.pessoas.length, 0);
              return (
                <li key={it.id} className={`minha-card${ehHoje ? " minha-card--hoje" : ""}`}>
                  <div className="minha-card__data" aria-hidden>
                    <span className="minha-card__dia-semana">{DIAS_CURTOS[ini.getDay()]}</span>
                    <span className="minha-card__dia">{ini.getDate()}</span>
                    <span className="minha-card__mes">{MESES_CURTOS[ini.getMonth()]}</span>
                  </div>
                  <div className="minha-card__corpo">
                    <div className="minha-card__topo">
                      <span className={`minha-card__quando${ehHoje ? " hoje" : ""}`}>{quandoFalta(ini)}</span>
                      <span className="minha-card__hora">
                        {hora(ini)}
                        {fim ? ` – ${hora(fim)}` : ""}
                      </span>
                      {it.evento.status === "rascunho" && <span className="esc-chip esc-chip--rascunho">Rascunho</span>}
                    </div>
                    <h3 className="minha-card__evento">{it.evento.nome}</h3>
                    <p className="minha-card__funcao">
                      <span className="minha-card__area">{it.area}</span>
                      {funcao && <span className="minha-card__papel">{funcao}</span>}
                    </p>
                    {totalEquipe > 1 && (
                      <details className="minha-card__equipe">
                        <summary>
                          Equipe do dia · {plural(totalEquipe, "pessoa")}
                        </summary>
                        <div className="minha-equipe">
                          {it.equipe.map((area) => (
                            <div key={area.nome} className="minha-equipe__area">
                              <span className="minha-equipe__nome-area">{area.nome}</span>
                              <span className="minha-equipe__pessoas">
                                {area.pessoas.map((p, i) => {
                                  const f = funcaoDe(p.detalhes, area.nome);
                                  const eu = p.id === idUsuario;
                                  return (
                                    <span key={`${p.id}-${i}`} className={eu ? "minha-equipe__eu" : undefined}>
                                      {eu ? "Você" : p.nome}
                                      {f ? ` (${f})` : ""}
                                      {i < area.pessoas.length - 1 ? ", " : ""}
                                    </span>
                                  );
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  <button
                    type="button"
                    className="minha-card__abrir"
                    onClick={() => onAbrirEvento(it.evento.id)}
                    aria-label={`Ver detalhes de ${it.evento.nome}`}
                  >
                    Detalhes
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default MinhasEscalas;
