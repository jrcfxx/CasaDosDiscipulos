import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../style/EscalaMapa.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import BotoesExportar from "../components/ui/BotoesExportar";
import { exportarPdf } from "../utils/exportarPdf";
import escalaService, {
  EscalaEvento,
  EscalaEventoCompleto,
} from "../services/escalaService";
import { DetalhesResumo } from "../components/AtribuicaoDetalhesForm";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const hora = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const diaSemana = (d: Date, formato: "long" | "short") =>
  d.toLocaleDateString("pt-BR", { weekday: formato }).replace(".", "");

function iniciais(nome?: string) {
  const partes = (nome || "?").trim().split(/\s+/);
  const ini = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : partes[0].slice(0, 2);
  return ini.toUpperCase();
}

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------- Ícones (traço simples, herdam a cor do texto) ---------- */
const Svg: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconeMusica = () => <Svg><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></Svg>;
const IconeSom = () => <Svg><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></Svg>;
const IconeMidia = () => <Svg><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></Svg>;
const IconeRecepcao = () => <Svg><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /></Svg>;
const IconeKids = () => <Svg><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></Svg>;
const IconeOracao = () => <Svg><path d="M12 2v20M5 9h14" /></Svg>;
const IconeEquipe = () => <Svg><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></Svg>;
const IconeRelogio = () => <Svg size={16}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
const IconeSeta = ({ dir }: { dir: "esq" | "dir" }) => (
  <Svg size={20}>{dir === "esq" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}</Svg>
);

/** Ícone e tom de cada ministério (só cores da marca) */
function estiloMinisterio(nome: string): { Icone: React.FC; tom: string } {
  const n = sem(nome);
  if (/louvor|music|banda|vocal/.test(n)) return { Icone: IconeMusica, tom: "gold" };
  if (/som|audio/.test(n)) return { Icone: IconeSom, tom: "cyan" };
  if (/midia|projec|transmiss|foto|video|camera/.test(n)) return { Icone: IconeMidia, tom: "cyan" };
  if (/recep|volunt|acolh|diacon|portaria/.test(n)) return { Icone: IconeRecepcao, tom: "teal" };
  if (/kids|infant|crianc|teen/.test(n)) return { Icone: IconeKids, tom: "gold" };
  if (/interce|oracao|ministra/.test(n)) return { Icone: IconeOracao, tom: "teal" };
  return { Icone: IconeEquipe, tom: "petroleo" };
}

const EscalaMapa: React.FC = () => {
  const now = new Date();
  const [eventos, setEventos] = useState<EscalaEvento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<EscalaEventoCompleto | null>(null);
  const [eventoIdSelect, setEventoIdSelect] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [loadingEvento, setLoadingEvento] = useState(false);
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");

  const fetchEventos = useCallback(async () => {
    try {
      setLoading(true);
      setEventoIdSelect("");
      const data = await escalaService.getEventos({ ano, mes, ativo: true });
      const ordenados = [...data].sort(
        (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
      );
      setEventos(ordenados);
      // Já abre o próximo evento (ou o último do mês, se todos já passaram)
      const agora = Date.now();
      const proximo =
        ordenados.find((e) => new Date(e.data_hora_fim || e.data_hora).getTime() >= agora) ??
        ordenados[ordenados.length - 1];
      if (proximo) setEventoIdSelect(proximo.id_escala_evento);
    } catch {
      setToast("Erro ao carregar eventos");
      setToastVariant("error");
    } finally {
      setLoading(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  useEffect(() => {
    if (eventoIdSelect) {
      setLoadingEvento(true);
      escalaService
        .getEventoCompleto(Number(eventoIdSelect))
        .then(setEventoSelecionado)
        .catch(() => {
          setToast("Erro ao carregar evento");
          setToastVariant("error");
        })
        .finally(() => setLoadingEvento(false));
    } else {
      setEventoSelecionado(null);
    }
  }, [eventoIdSelect]);

  const mudarMes = (delta: number) => {
    const d = new Date(ano, mes - 1 + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth() + 1);
  };

  const areas = useMemo(
    () => [...(eventoSelecionado?.areas ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [eventoSelecionado]
  );
  const totalPessoas = useMemo(
    () => new Set(areas.flatMap((a) => (a.atribuicoes ?? []).map((t) => t.id_usuario))).size,
    [areas]
  );
  const semEquipe = areas.filter((a) => !a.atribuicoes?.length).length;

  const dataEvento = eventoSelecionado ? new Date(eventoSelecionado.data_hora) : null;
  const fimEvento = eventoSelecionado?.data_hora_fim ? new Date(eventoSelecionado.data_hora_fim) : null;

  return (
    <div className="page-with-fixed-header escala-mapa-page">
      <Header />

      <main id="main-content" className="escala-mapa-main" tabIndex={-1}>
        {/* Cabeçalho da página */}
        <header className="mapa-topo">
          <div>
            <Link to="/usuario/escala" className="mapa-voltar no-print">
              <IconeSeta dir="esq" /> Calendário da escala
            </Link>
            <h1 className="escala-mapa-titulo">Mapa da Escala</h1>
            <p className="escala-mapa-subtitulo">Quem serve em cada ministério, em cada culto.</p>
          </div>
          {eventoSelecionado && (
            <div className="mapa-topo-acoes">
              <BotoesExportar
                onPdf={() =>
                  exportarPdf(
                    `Mapa da escala – ${eventoSelecionado.titulo} – ${new Date(eventoSelecionado.data_hora).toLocaleDateString("pt-BR")}`
                  )
                }
              />
            </div>
          )}
        </header>

        {/* Navegação: mês + eventos do mês */}
        <section className="mapa-navegacao no-print" aria-label="Escolher evento">
          <div className="mapa-mes">
            <button type="button" className="mapa-mes-btn" onClick={() => mudarMes(-1)}
              disabled={loading} aria-label="Mês anterior">
              <IconeSeta dir="esq" />
            </button>
            <h2 className="mapa-mes-nome" aria-live="polite">
              {MESES[mes - 1]} <span>{ano}</span>
            </h2>
            <button type="button" className="mapa-mes-btn" onClick={() => mudarMes(1)}
              disabled={loading} aria-label="Próximo mês">
              <IconeSeta dir="dir" />
            </button>
          </div>

          {loading ? (
            <div className="mapa-eventos mapa-eventos--carregando" aria-hidden="true">
              {[0, 1, 2].map((i) => <div key={i} className="mapa-evento-chip mapa-skeleton" />)}
            </div>
          ) : eventos.length > 0 ? (
            <div className="mapa-eventos" role="radiogroup" aria-label="Eventos do mês">
              {eventos.map((ev) => {
                const d = new Date(ev.data_hora);
                const ativo = ev.id_escala_evento === eventoIdSelect;
                const passou = new Date(ev.data_hora_fim || ev.data_hora).getTime() < Date.now();
                return (
                  <button
                    key={ev.id_escala_evento}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    className={`mapa-evento-chip${ativo ? " is-ativo" : ""}${passou ? " is-passado" : ""}`}
                    onClick={() => setEventoIdSelect(ev.id_escala_evento)}
                  >
                    <span className="chip-data">
                      <span className="chip-dia">{String(d.getDate()).padStart(2, "0")}</span>
                      <span className="chip-semana">{diaSemana(d, "short")}</span>
                    </span>
                    <span className="chip-info">
                      <span className="chip-titulo">{ev.titulo}</span>
                      <span className="chip-hora">{hora(d)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mapa-sem-eventos">Nenhum evento em {MESES[mes - 1].toLowerCase()}. Use as setas para ver outros meses.</p>
          )}
        </section>

        {/* Conteúdo */}
        {loading || (loadingEvento && !eventoSelecionado) ? (
          <div className="escala-mapa-loading">
            <div className="loading-spinner" />
            <p>Carregando escala...</p>
          </div>
        ) : !eventoSelecionado || !dataEvento ? (
          eventos.length > 0 && (
            <div className="escala-mapa-empty">
              <div className="empty-icone"><IconeEquipe /></div>
              <h2>Escolha um evento</h2>
              <p>Toque em um dos eventos acima para ver quem está escalado.</p>
            </div>
          )
        ) : (
          <div className={`escala-mapa-conteudo${loadingEvento ? " is-atualizando" : ""}`}>
            {/* Destaque do evento */}
            <section className="mapa-evento-destaque">
              <div className="destaque-data" aria-hidden="true">
                <span className="destaque-mes">{MESES[dataEvento.getMonth()].slice(0, 3)}</span>
                <span className="destaque-dia">{dataEvento.getDate()}</span>
                <span className="destaque-semana">{diaSemana(dataEvento, "short")}</span>
              </div>
              <div className="destaque-info">
                <span className="destaque-rotulo">Escala do culto</span>
                <h2 className="destaque-titulo">{eventoSelecionado.titulo}</h2>
                <p className="destaque-quando">
                  <span className="destaque-dia-extenso">
                    {dataEvento.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                  <span className="destaque-hora">
                    <IconeRelogio />
                    {hora(dataEvento)}{fimEvento ? ` – ${hora(fimEvento)}` : ""}
                  </span>
                </p>
                {eventoSelecionado.descricao && (
                  <p className="destaque-desc">{eventoSelecionado.descricao}</p>
                )}
              </div>
              <dl className="destaque-numeros">
                <div>
                  <dt>Pessoas</dt>
                  <dd>{totalPessoas}</dd>
                </div>
                <div>
                  <dt>Ministérios</dt>
                  <dd>{areas.length}</dd>
                </div>
                {semEquipe > 0 && (
                  <div className="is-alerta">
                    <dt>Sem equipe</dt>
                    <dd>{semEquipe}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Ministérios */}
            {areas.length === 0 ? (
              <div className="escala-mapa-empty">
                <div className="empty-icone"><IconeEquipe /></div>
                <h2>Escala ainda não montada</h2>
                <p>Nenhum ministério foi adicionado a este evento.</p>
              </div>
            ) : (
              <div className="mapa-grid">
                {areas.map((ar) => {
                  const pessoas = ar.atribuicoes ?? [];
                  const { Icone, tom } = estiloMinisterio(ar.nome);
                  return (
                    <article key={ar.id_escala_area} className={`mapa-card tom-${tom}`}>
                      <header className="mapa-card-topo">
                        <span className="mapa-card-icone"><Icone /></span>
                        <h3 className="mapa-card-nome">{ar.nome}</h3>
                        <span className="mapa-card-total" aria-label={`${pessoas.length} ${pessoas.length === 1 ? "pessoa" : "pessoas"}`}>
                          {pessoas.length}
                        </span>
                      </header>
                      {pessoas.length > 0 ? (
                        <ul className="mapa-pessoas">
                          {pessoas.map((att) => (
                            <li key={att.id_escala_atribuicao} className="mapa-pessoa">
                              <span className="mapa-avatar" aria-hidden="true">{iniciais(att.usuario_nome)}</span>
                              <div className="mapa-pessoa-info">
                                <span className="mapa-nome">{att.usuario_nome}</span>
                                <DetalhesResumo detalhes={att.detalhes} nomeArea={ar.nome} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mapa-vazio">Aguardando escalação</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} variant={toastVariant} />
      )}

      <Footer />
    </div>
  );
};

export default EscalaMapa;
