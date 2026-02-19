import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../style/EscalaMapa.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import escalaService, {
  EscalaEvento,
  EscalaEventoCompleto,
} from "../services/escalaService";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatarDataHora(s: string) {
  const d = new Date(s);
  return d.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMinisterioIcon(nome: string) {
  switch (nome) {
    case "Louvor": return "🎵";
    case "Som": return "🔊";
    case "Recepção": return "🤝";
    default: return "📋";
  }
}

function getMinisterioCor(nome: string) {
  switch (nome) {
    case "Louvor": return "ministerio-louvor";
    case "Som": return "ministerio-som";
    case "Recepção": return "ministerio-recepcao";
    default: return "ministerio-generico";
  }
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
      setEventos(data);
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

  const totalPessoas = eventoSelecionado?.areas?.reduce(
    (acc, ar) => acc + (ar.atribuicoes?.length ?? 0),
    0
  ) ?? 0;

  return (
    <div className="page-with-fixed-header escala-mapa-page">
      <Header />

      <main className="escala-mapa-main">
        <div className="escala-mapa-hero">
          <div className="escala-mapa-hero-content">
            <h1 className="escala-mapa-titulo">Mapa da Escala</h1>
            <p className="escala-mapa-subtitulo">
              Visualize a escala completa de cada evento — igreja em ação
            </p>
          </div>
          <Link to="/usuario/escala" className="escala-mapa-voltar">
            ← Calendário
          </Link>
        </div>

        <div className="escala-mapa-seletor">
          <div className="seletor-periodo">
            <label className="seletor-label">Período</label>
            <div className="seletor-mes-ano">
              <select
                className="seletor-mes"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                disabled={loading}
              >
                {MESES.map((nome, i) => (
                  <option key={nome} value={i + 1}>{nome}</option>
                ))}
              </select>
              <select
                className="seletor-ano-select"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                disabled={loading}
              >
                {Array.from({ length: 7 }, (_, i) => ano - 3 + i).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="seletor-evento">
            <label htmlFor="evento-select" className="seletor-label">
              Evento
            </label>
            <select
              id="evento-select"
              className="seletor-eventos"
              value={eventoIdSelect}
              onChange={(e) => setEventoIdSelect(e.target.value ? Number(e.target.value) : "")}
              disabled={loading}
            >
              <option value="">-- Escolha um evento --</option>
              {eventos.map((ev) => {
                const d = new Date(ev.data_hora);
                const dataStr = d.toLocaleDateString("pt-BR");
                const horaStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <option key={ev.id_escala_evento} value={ev.id_escala_evento}>
                    {ev.titulo} — {dataStr} às {horaStr}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="escala-mapa-loading">
            <div className="loading-spinner" />
            <p>Carregando eventos...</p>
          </div>
        ) : loadingEvento && eventoIdSelect ? (
          <div className="escala-mapa-loading">
            <div className="loading-spinner" />
            <p>Carregando escala...</p>
          </div>
        ) : !eventoIdSelect ? (
          <div className="escala-mapa-empty">
            <div className="empty-illustration">📍</div>
            <h2>
              {eventos.length === 0
                ? `Nenhum evento em ${MESES[mes - 1]} de ${ano}`
                : "Selecione um evento"}
            </h2>
            <p>
              {eventos.length === 0
                ? "Altere o mês ou ano acima para ver outros eventos."
                : "Escolha um evento no menu acima para visualizar o mapa da escala."}
            </p>
          </div>
        ) : eventoSelecionado ? (
          <div className="escala-mapa-conteudo">
            <div className="evento-hero-card">
              <div className="evento-hero-info">
                <h2 className="evento-hero-titulo">{eventoSelecionado.titulo}</h2>
                <p className="evento-hero-data">
                  {formatarDataHora(eventoSelecionado.data_hora)}
                </p>
                {eventoSelecionado.descricao && (
                  <p className="evento-hero-desc">{eventoSelecionado.descricao}</p>
                )}
              </div>
              <div className="evento-hero-stats">
                <div className="stat-item">
                  <span className="stat-valor">{totalPessoas}</span>
                  <span className="stat-label">Pessoas</span>
                </div>
                <div className="stat-item">
                  <span className="stat-valor">{eventoSelecionado.areas?.length ?? 0}</span>
                  <span className="stat-label">Ministérios</span>
                </div>
              </div>
            </div>

            <div className="mapa-ministerios">
              <h3 className="mapa-titulo-secao">Ministérios e equipe</h3>
              <div className="mapa-grid">
                {eventoSelecionado.areas?.map((ar, idx) => {
                  const total = ar.atribuicoes?.length ?? 0;
                  const corClasse = getMinisterioCor(ar.nome);
                  return (
                    <article
                      key={ar.id_escala_area}
                      className={`mapa-ministerio-card ${corClasse}`}
                    >
                      <div className="mapa-card-header">
                        <span className="mapa-card-icon">{getMinisterioIcon(ar.nome)}</span>
                        <h4 className="mapa-card-nome">{ar.nome}</h4>
                        <span className="mapa-card-count">
                          {total} {total === 1 ? "pessoa" : "pessoas"}
                        </span>
                      </div>
                      <div className="mapa-card-pessoas">
                        {(ar.atribuicoes || []).length > 0 ? (
                          (ar.atribuicoes || []).map((att) => (
                            <div key={att.id_escala_atribuicao} className="mapa-pessoa">
                              <span className="mapa-avatar">
                                {(att.usuario_nome || "?")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                              <span className="mapa-nome">{att.usuario_nome}</span>
                            </div>
                          ))
                        ) : (
                          <p className="mapa-vazio">Aguardando escalação</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toastVariant}
        />
      )}

      <Footer />
    </div>
  );
};

export default EscalaMapa;
