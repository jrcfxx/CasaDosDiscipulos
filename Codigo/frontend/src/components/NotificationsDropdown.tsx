import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import notificacaoService, { Notificacao } from "../services/notificacaoService";
import escalaService, { EscalaEventoCompleto } from "../services/escalaService";
import "../style/NotificationsDropdown.css";

function formatarData(s: string) {
  const d = new Date(s);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  if (minutos < 1) return "Agora";
  if (minutos < 60) return `${minutos} min atrás`;
  if (horas < 24) return `${horas}h atrás`;
  if (dias < 7) return `${dias}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface NotificationsDropdownProps {
  onClose?: () => void;
  onRefresh?: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onClose, onRefresh }) => {
  const navigate = useNavigate();
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detalheNotif, setDetalheNotif] = useState<Notificacao | null>(null);
  const [eventoDetalhe, setEventoDetalhe] = useState<EscalaEventoCompleto | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    try {
      const [list, cnt] = await Promise.all([
        notificacaoService.getList({ limit: 20 }),
        notificacaoService.getCountNaoLidas(),
      ]);
      setNotificacoes(list);
      setCount(cnt);
      onRefreshRef.current?.();
    } catch {
      setNotificacoes([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleClickNotif = async (n: Notificacao) => {
    setDetalheNotif(n);
    if (!n.id_escala_evento) {
      if (!n.lido) {
        try {
          await notificacaoService.marcarLido(n.id_notificacao);
          setNotificacoes((prev) =>
            prev.map((x) => (x.id_notificacao === n.id_notificacao ? { ...x, lido: true } : x))
          );
          setCount((c) => Math.max(0, c - 1));
          onRefreshRef.current?.();
        } catch {
          /* ignore */
        }
      }
      setLoadingDetalhe(false);
      return;
    }
    setLoadingDetalhe(true);
    setEventoDetalhe(null);
    try {
      const ev = await escalaService.getEventoCompleto(n.id_escala_evento);
      setEventoDetalhe(ev);
      if (!n.lido) {
        await notificacaoService.marcarLido(n.id_notificacao);
        setNotificacoes((prev) =>
          prev.map((x) => (x.id_notificacao === n.id_notificacao ? { ...x, lido: true } : x))
        );
        setCount((c) => Math.max(0, c - 1));
        onRefreshRef.current?.();
      }
    } catch {
      setEventoDetalhe(null);
    } finally {
      setLoadingDetalhe(false);
    }
  };

  const handleMarcarTodasLidas = async () => {
    try {
      await notificacaoService.marcarTodasLidas();
      setNotificacoes((prev) => prev.map((x) => ({ ...x, lido: true })));
      setCount(0);
      onRefreshRef.current?.();
    } catch {
      /* ignore */
    }
  };

  const handleIrParaEscala = () => {
    if (eventoDetalhe) {
      setDetalheNotif(null);
      setEventoDetalhe(null);
      onClose?.();
      navigate("/usuario/escala", { state: { abrirEventoId: eventoDetalhe.id_escala_evento } });
    }
  };

  const ehNotifFalaAi = (n: Notificacao) =>
    n.tipo === "fala_ai_devocional" || n.tipo === "fala_ai_palavra";

  const handleIrParaFalaAi = () => {
    setDetalheNotif(null);
    setEventoDetalhe(null);
    onClose?.();
    navigate("/usuario/fala-ai");
  };

  const fecharDetalhe = () => {
    setDetalheNotif(null);
    setEventoDetalhe(null);
  };

  return (
    <div className="notif-dropdown" ref={containerRef}>
      <div className="notif-dropdown-header">
        <h3 className="notif-dropdown-title">Notificações</h3>
        {count > 0 && (
          <button
            type="button"
            className="notif-dropdown-marcar-todas"
            onClick={handleMarcarTodasLidas}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="notif-dropdown-list">
        {loading ? (
          <div className="notif-dropdown-empty">
            <div className="notif-loading-spinner" />
            <p>Carregando...</p>
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="notif-dropdown-empty">
            <span className="notif-empty-icon">🔔</span>
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          notificacoes.map((n) => (
            <button
              key={n.id_notificacao}
              type="button"
              className={`notif-item ${!n.lido ? "notif-item--unread" : ""}`}
              onClick={() => handleClickNotif(n)}
            >
              <span className={`notif-item-dot ${!n.lido ? "notif-item-dot--unread" : ""}`} />
              <div className="notif-item-content">
                <span className="notif-item-titulo">{n.titulo}</span>
                {n.mensagem && <span className="notif-item-msg">{n.mensagem}</span>}
                <span className="notif-item-time">{formatarData(n.data_criacao)}</span>
              </div>
              {n.tipo === "escalado" && <span className="notif-item-badge">✓</span>}
            </button>
          ))
        )}
      </div>

      {detalheNotif && (
        <div
          className="notif-modal-overlay"
          role="dialog"
          aria-modal
          aria-labelledby="notif-modal-title"
        >
          <div className="notif-modal">
            <div className="notif-modal-header">
              <h3 id="notif-modal-title">{detalheNotif.titulo}</h3>
              <button type="button" className="notif-modal-close" onClick={fecharDetalhe} aria-label="Fechar">
                ×
              </button>
            </div>
            {loadingDetalhe ? (
              <div className="notif-modal-body notif-modal-loading">
                <div className="notif-loading-spinner" />
              </div>
            ) : !detalheNotif.id_escala_evento ? (
              <div className="notif-modal-body">
                {detalheNotif.mensagem && (
                  <p className="notif-modal-simple-msg">{detalheNotif.mensagem}</p>
                )}
                <div className="notif-modal-footer">
                  <button type="button" className="notif-modal-btn-secondary" onClick={fecharDetalhe}>
                    Fechar
                  </button>
                  {ehNotifFalaAi(detalheNotif) && (
                    <button type="button" className="notif-modal-btn-primary" onClick={handleIrParaFalaAi}>
                      Ir para Fala Aí
                    </button>
                  )}
                </div>
              </div>
            ) : eventoDetalhe ? (
              <>
                <div className="notif-modal-body">
                  <div className="notif-evento-card">
                    <div className="notif-evento-data">
                      {new Date(eventoDetalhe.data_hora).toLocaleString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {eventoDetalhe.descricao && (
                      <p className="notif-evento-desc">{eventoDetalhe.descricao}</p>
                    )}
                    {detalheNotif.area_nome && (
                      <div className="notif-evento-area">
                        <span className="notif-evento-area-label">Sua atribuição:</span>
                        <span className="notif-evento-area-nome">{detalheNotif.area_nome}</span>
                      </div>
                    )}
                    <div className="notif-evento-ministerios">
                      <span className="notif-evento-ministerios-label">Ministérios:</span>
                      <div className="notif-evento-ministerios-chips">
                        {(eventoDetalhe.areas || []).map((ar) => (
                          <span key={ar.id_escala_area} className="notif-chip">
                            {ar.nome}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="notif-modal-footer">
                  <button type="button" className="notif-modal-btn-secondary" onClick={fecharDetalhe}>
                    Fechar
                  </button>
                  <button type="button" className="notif-modal-btn-primary" onClick={handleIrParaEscala}>
                    Ver na Escala
                  </button>
                </div>
              </>
            ) : (
              <div className="notif-modal-body">
                <p className="notif-modal-erro">Evento não encontrado ou foi removido.</p>
                <div className="notif-modal-footer">
                  <button type="button" className="notif-modal-btn-secondary" onClick={fecharDetalhe}>
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;

/** Botão do sino com badge - para usar no Header */
export function NotificationsBell({
  onClick,
  refreshTrigger = 0,
}: {
  onClick: () => void;
  refreshTrigger?: number;
}) {
  const [num, setNum] = useState(0);
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const c = await notificacaoService.getCountNaoLidas();
        setNum(c);
      } catch {
        setNum(0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);
  return (
    <button
      type="button"
      className="header-notif-btn"
      onClick={onClick}
      title="Notificações"
      aria-label={`Notificações${num > 0 ? `, ${num} não lidas` : ""}`}
    >
      <svg
        className="header-notif-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      {num > 0 && (
        <span className="header-notif-badge">
          {num > 99 ? "99+" : num}
        </span>
      )}
    </button>
  );
}
