import React, { useEffect, useMemo, useState } from "react";
import escalaService, { type MinhaEscala } from "../../services/escalaService";
import { funcaoDe } from "../../utils/funcaoEscala";
import { plural, toIsoDate } from "../../utils/escalaDatas";
import Icone from "../ui/Icone";
import "../../style/escalaMinhas.css";

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function hora(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "Hoje", "Amanhã", "Em 5 dias" */
function quandoFalta(inicio: Date, agora = new Date()): string {
  const a = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const b = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const dias = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (dias <= 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
}

const iniciais = (nome: string) =>
  nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

interface Props {
  onAbrirEvento: (id: number) => void;
  onVerCalendario: () => void;
  idUsuario?: number;
}

/** Equipe do dia: quem serve junto, por área (você aparece como "Você") */
function Equipe({ it, idUsuario }: { it: MinhaEscala; idUsuario?: number }) {
  return (
    <div className="mse-equipe">
      {it.equipe.map((area) => (
        <div key={area.nome} className="mse-equipe__area">
          <span className="mse-equipe__nome-area">{area.nome}</span>
          <ul className="mse-equipe__pessoas">
            {area.pessoas.map((p, i) => {
              const f = funcaoDe(p.detalhes, area.nome);
              const eu = p.id === idUsuario;
              return (
                <li key={`${p.id}-${i}`} className={eu ? "mse-pessoa mse-pessoa--eu" : "mse-pessoa"}>
                  <span className="mse-pessoa__avatar" aria-hidden>{iniciais(p.nome)}</span>
                  <span>
                    {eu ? "Você" : p.nome}
                    {f && <span className="mse-pessoa__funcao"> · {f}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Visão de quem serve: o próximo serviço em destaque e os seguintes, mês a mês */
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

  const [proximo, ...seguintes] = itens || [];

  // Seguintes agrupados por mês ("novembro de 2026")
  const grupos = useMemo(() => {
    const m = new Map<string, MinhaEscala[]>();
    for (const it of seguintes) {
      const chave = new Date(it.inicio).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      m.set(chave, [...(m.get(chave) || []), it]);
    }
    return [...m.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens]);

  if (erro) {
    return (
      <div className="mse-vazio" role="alert">
        <Icone nome="alerta" tamanho={28} />
        <p className="mse-vazio__titulo">Não foi possível carregar suas escalas agora</p>
        <button type="button" className="sc-btn sc-btn--contorno" onClick={() => window.location.reload()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!itens) {
    return (
      <div className="mse" aria-busy="true" aria-label="Carregando suas escalas">
        <div className="mse-esqueleto mse-esqueleto--grande" />
        <div className="mse-esqueleto" />
        <div className="mse-esqueleto" />
      </div>
    );
  }

  if (!proximo) {
    return (
      <div className="mse-vazio">
        <span className="mse-vazio__icone" aria-hidden><Icone nome="calendario" tamanho={30} /></span>
        <p className="mse-vazio__titulo">Você não está escalado nos próximos meses</p>
        <p className="mse-vazio__texto">
          Quando a liderança do seu ministério escalar você e publicar a escala, ela aparece aqui, com dia,
          horário, função e quem serve junto.
        </p>
        <button type="button" className="sc-btn sc-btn--primario" onClick={onVerCalendario}>
          Ver o calendário da Casa
        </button>
      </div>
    );
  }

  const hoje = toIsoDate(new Date());
  const ini = new Date(proximo.inicio);
  const fim = proximo.fim ? new Date(proximo.fim) : null;
  const funcao = funcaoDe(proximo.detalhes, proximo.area);
  const ehHoje = toIsoDate(ini) === hoje;

  return (
    <div className="mse">
      {/* ---------- Próximo serviço ---------- */}
      <section className={`mse-proximo${ehHoje ? " mse-proximo--hoje" : ""}`} aria-labelledby="mse-proximo-titulo">
        <div className="mse-proximo__data" aria-hidden>
          <span className="mse-proximo__quando">{quandoFalta(ini)}</span>
          <span className="mse-proximo__dia">{ini.getDate()}</span>
          <span className="mse-proximo__mes">{MESES_CURTOS[ini.getMonth()]} · {DIAS_CURTOS[ini.getDay()]}</span>
        </div>
        <div className="mse-proximo__corpo">
          <p className="mse-proximo__rotulo">Seu próximo serviço</p>
          <h2 id="mse-proximo-titulo" className="mse-proximo__evento">{proximo.evento.nome}</h2>
          <ul className="mse-proximo__info">
            <li><Icone nome="calendario" tamanho={16} /> {ini.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</li>
            <li><Icone nome="historico" tamanho={16} /> {hora(ini)}{fim ? ` às ${hora(fim)}` : ""}</li>
            <li><Icone nome="equipe" tamanho={16} /> {proximo.area}{funcao ? ` · ${funcao}` : ""}</li>
          </ul>
          {proximo.evento.status === "rascunho" && (
            <p className="mse-aviso"><Icone nome="alerta" tamanho={15} /> Escala ainda em rascunho: pode mudar até ser publicada.</p>
          )}
          <button type="button" className="sc-btn sc-btn--destaque mse-proximo__botao" onClick={() => onAbrirEvento(proximo.evento.id)}>
            Ver detalhes do evento
          </button>
        </div>
        {proximo.equipe.length > 0 && (
          <div className="mse-proximo__equipe">
            <p className="mse-proximo__rotulo">Quem serve com você</p>
            <Equipe it={proximo} idUsuario={idUsuario} />
          </div>
        )}
      </section>

      {/* ---------- Depois ---------- */}
      {seguintes.length > 0 && (
        <section className="mse-depois" aria-labelledby="mse-depois-titulo">
          <h2 id="mse-depois-titulo" className="mse-titulo-secao">
            Depois <span>{plural(seguintes.length, "escala")}</span>
          </h2>
          {grupos.map(([mes, lista]) => (
            <div key={mes} className="mse-mes">
              <h3 className="mse-mes__titulo">{mes}</h3>
              <ul className="mse-lista">
                {lista.map((it) => {
                  const d = new Date(it.inicio);
                  const f = it.fim ? new Date(it.fim) : null;
                  const fn = funcaoDe(it.detalhes, it.area);
                  const total = it.equipe.reduce((n, a) => n + a.pessoas.length, 0);
                  return (
                    <li key={it.id} className="mse-item">
                      <div className="mse-item__data" aria-hidden>
                        <span className="mse-item__semana">{DIAS_CURTOS[d.getDay()]}</span>
                        <span className="mse-item__dia">{d.getDate()}</span>
                      </div>
                      <div className="mse-item__corpo">
                        <span className="mse-item__evento">
                          {it.evento.nome}
                          {it.evento.status === "rascunho" && <span className="mse-selo">Rascunho</span>}
                        </span>
                        <span className="mse-item__meta">
                          {hora(d)}{f ? `–${hora(f)}` : ""} · {quandoFalta(d)}
                        </span>
                        <span className="mse-item__funcao">
                          <strong>{it.area}</strong>{fn ? ` · ${fn}` : ""}
                        </span>
                        {total > 1 && (
                          <details className="mse-item__equipe">
                            <summary>Equipe do dia · {plural(total, "pessoa")}</summary>
                            <Equipe it={it} idUsuario={idUsuario} />
                          </details>
                        )}
                      </div>
                      <button
                        type="button"
                        className="sc-btn sc-btn--contorno mse-item__abrir"
                        onClick={() => onAbrirEvento(it.evento.id)}
                        aria-label={`Ver detalhes de ${it.evento.nome}`}
                      >
                        Detalhes
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default MinhasEscalas;
