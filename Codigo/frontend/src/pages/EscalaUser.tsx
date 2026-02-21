import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../style/EscalaUser.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import escalaService, {
  EscalaEvento,
  EscalaEventoCompleto,
  EscalaArea,
  EscalaAtribuicao,
} from "../services/escalaService";
import ministerioService from "../services/ministerioService";
import AtribuicaoDetalhesForm, { DetalhesResumo } from "../components/AtribuicaoDetalhesForm";
import axios from "axios";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatarDataHora(s: string, fim?: string | null) {
  const d = new Date(s);
  const str = d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (fim) {
    const df = new Date(fim);
    const strFim = df.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${str} – ${strFim}`;
  }
  return str;
}

function formatarData(s: string) {
  return new Date(s).toLocaleDateString("pt-BR");
}

const EscalaUser: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isLiderMinisterio } = useAuth();
  const podeEditar = isAdmin || isLiderMinisterio;
  const [eventos, setEventos] = useState<EscalaEvento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<EscalaEventoCompleto | null>(null);
  const [usuarios, setUsuarios] = useState<{ id_usuario: number; nome: string }[]>([]);
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [showModalEvento, setShowModalEvento] = useState(false);
  const [showModalAtribuicao, setShowModalAtribuicao] = useState(false);
  const [areaParaAtribuir, setAreaParaAtribuir] = useState<EscalaArea | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");
  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false);
  const [eventoToExcluir, setEventoToExcluir] = useState<number | null>(null);
  const [ministerios, setMinisterios] = useState<{ id_ministerio: number; nome: string; ordem?: number }[]>([]);
  const [formEvento, setFormEvento] = useState({
    titulo: "",
    data_hora: "",
    data_hora_fim: "",
    descricao: "",
    ativo: true,
    id_ministerios: [] as number[],
  });
  const [editandoEventoId, setEditandoEventoId] = useState<number | null>(null);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);
  const [formDetalhes, setFormDetalhes] = useState<Record<string, string>>({});
  const [atribuicaoEditando, setAtribuicaoEditando] = useState<EscalaAtribuicao | null>(null);

  const showToast = useCallback((msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  }, []);

  const fetchEventos = useCallback(async () => {
    try {
      const data = await escalaService.getEventos({ ano, mes, ativo: true });
      setEventos(data);
    } catch {
      showToast("Erro ao carregar eventos", "error");
    } finally {
      setLoading(false);
    }
  }, [ano, mes, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchEventos();
  }, [fetchEventos]);

  const abrirEventoId = (location.state as { abrirEventoId?: number })?.abrirEventoId;

  useEffect(() => {
    ministerioService.getAll().then(setMinisterios).catch(() => setMinisterios([]));
  }, []);

  const carregarUsuariosParaEscalar = useCallback(async (idEvento: number, nomeArea?: string) => {
    try {
      const list = await escalaService.getUsuariosParaEscalar(idEvento, nomeArea);
      setUsuarios(list || []);
    } catch {
      setUsuarios([]);
    }
  }, []);

  const abrirModalEvento = (evento?: EscalaEvento, dataAlvo?: Date) => {
    if (!evento && !isAdmin) return; // criar: apenas admin
    if (evento && !podeEditar) return; // editar: admin ou líder
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmtDateTime = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (evento) {
      setEditandoEventoId(evento.id_escala_evento);
      const dh = new Date(evento.data_hora);
      const dhFim = evento.data_hora_fim ? new Date(evento.data_hora_fim) : new Date(dh.getTime() + 2 * 60 * 60 * 1000);
      const idsMin = (evento as EscalaEvento & { ministerios?: { id_ministerio: number }[] }).ministerios?.map((m) => m.id_ministerio) ?? [];
      setFormEvento({
        titulo: evento.titulo,
        data_hora: fmtDateTime(dh),
        data_hora_fim: fmtDateTime(dhFim),
        descricao: evento.descricao || "",
        ativo: evento.ativo,
        id_ministerios: idsMin,
      });
    } else {
      setEditandoEventoId(null);
      const n = dataAlvo ?? new Date();
      const inicio = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T19:00`;
      const fimDate = new Date(n);
      fimDate.setHours(21, 0, 0, 0);
      setFormEvento({
        titulo: "",
        data_hora: inicio,
        data_hora_fim: fmtDateTime(fimDate),
        descricao: "",
        ativo: true,
        id_ministerios: [],
      });
    }
    setShowModalEvento(true);
  };

  const fecharModalEvento = () => {
    setShowModalEvento(false);
    setEditandoEventoId(null);
  };

  const handleSalvarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEvento.titulo.trim()) {
      showToast("Título é obrigatório", "error");
      return;
    }
    if (formEvento.id_ministerios.length === 0) {
      showToast("Selecione ao menos um ministério", "error");
      return;
    }
    // Áreas derivadas dos ministérios selecionados (ordem do cadastro)
    const areas = ministerios
      .filter((m) => formEvento.id_ministerios.includes(m.id_ministerio))
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((m) => m.nome);
    try {
      if (editandoEventoId) {
        await escalaService.updateEvento(editandoEventoId, {
          titulo: formEvento.titulo.trim(),
          data_hora: formEvento.data_hora.slice(0, 16).replace("T", " ") + ":00",
          data_hora_fim: formEvento.data_hora_fim?.trim() ? formEvento.data_hora_fim.slice(0, 16).replace("T", " ") + ":00" : null,
          descricao: formEvento.descricao.trim() || undefined,
          ativo: Boolean(formEvento.ativo),
          areas,
          id_ministerios: formEvento.id_ministerios,
        });
        showToast("Evento atualizado", "success");
      } else {
        await escalaService.createEvento({
          titulo: formEvento.titulo.trim(),
          data_hora: formEvento.data_hora.slice(0, 16).replace("T", " ") + ":00",
          data_hora_fim: formEvento.data_hora_fim?.trim() ? formEvento.data_hora_fim.slice(0, 16).replace("T", " ") + ":00" : null,
          descricao: formEvento.descricao.trim() || undefined,
          ativo: Boolean(formEvento.ativo),
          areas,
          id_ministerios: formEvento.id_ministerios,
        });
        showToast("Evento criado", "success");
      }
      fecharModalEvento();
      fetchEventos();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Erro ao salvar evento";
      showToast(msg, "error");
    }
  };

  const handleExcluirEvento = async () => {
    if (eventoToExcluir === null) return;
    try {
      await escalaService.deleteEvento(eventoToExcluir);
      showToast("Evento excluído", "success");
      setEventoSelecionado(null);
      fetchEventos();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Erro ao excluir";
      showToast(msg, "error");
    }
    setShowConfirmExcluir(false);
    setEventoToExcluir(null);
  };

  const abrirEvento = useCallback(async (id: number) => {
    try {
      const ev = await escalaService.getEventoCompleto(id);
      setEventoSelecionado(ev);
    } catch {
      showToast("Erro ao carregar evento", "error");
    }
  }, [showToast]);

  const abriuEventoRef = useRef(false);
  useEffect(() => {
    if (abrirEventoId && !abriuEventoRef.current) {
      abriuEventoRef.current = true;
      abrirEvento(abrirEventoId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [abrirEventoId, abrirEvento, navigate, location.pathname]);

  const fecharEvento = () => setEventoSelecionado(null);

  const abrirModalAtribuicao = (area: EscalaArea) => {
    setAreaParaAtribuir(area);
    setUsuarioSelecionado(null);
    setFormDetalhes({});
    if (eventoSelecionado) {
      carregarUsuariosParaEscalar(eventoSelecionado.id_escala_evento, area.nome);
    }
    setShowModalAtribuicao(true);
  };

  const fecharModalAtribuicao = () => {
    setShowModalAtribuicao(false);
    setAreaParaAtribuir(null);
    setFormDetalhes({});
  };

  const abrirModalEditarDetalhes = (att: EscalaAtribuicao, areaNome: string) => {
    const detalhes = att.detalhes || {};
    const strDetalhes: Record<string, string> = {};
    Object.entries(detalhes).forEach(([k, v]) => {
      strDetalhes[k] = v != null ? String(v) : "";
    });
    setAtribuicaoEditando(att);
    setFormDetalhes(strDetalhes);
    setAreaParaAtribuir({ id_escala_area: att.id_escala_area, id_escala_evento: 0, nome: areaNome, ordem: 0 });
  };

  const fecharModalEditarDetalhes = () => {
    setAtribuicaoEditando(null);
    setFormDetalhes({});
    setAreaParaAtribuir(null);
  };

  const handleAdicionarAtribuicao = async () => {
    if (!areaParaAtribuir || !usuarioSelecionado) return;
    try {
      const detalhesObj: Record<string, string | null> = {};
      Object.entries(formDetalhes).forEach(([k, v]) => {
        detalhesObj[k] = v?.trim() || null;
      });
      await escalaService.addAtribuicao(areaParaAtribuir.id_escala_area, usuarioSelecionado, detalhesObj);
      showToast("Pessoa escalada com sucesso", "success");
      fecharModalAtribuicao();
      if (eventoSelecionado) {
        const ev = await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento);
        setEventoSelecionado(ev);
      }
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Não foi possível escalar. A pessoa já está em outro ministério no mesmo horário.";
      showToast(msg, "error");
    }
  };

  const handleRemoverAtribuicao = async (a: EscalaAtribuicao) => {
    try {
      await escalaService.removeAtribuicao(a.id_escala_atribuicao);
      showToast("Removido da escala", "success");
      if (eventoSelecionado) {
        const ev = await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento);
        setEventoSelecionado(ev);
      }
    } catch {
      showToast("Erro ao remover", "error");
    }
  };

  const handleSalvarDetalhes = async () => {
    if (!atribuicaoEditando) return;
    try {
      const detalhesObj: Record<string, string | null> = {};
      Object.entries(formDetalhes).forEach(([k, v]) => {
        detalhesObj[k] = v?.trim() || null;
      });
      await escalaService.updateAtribuicao(atribuicaoEditando.id_escala_atribuicao, detalhesObj);
      showToast("Informações atualizadas", "success");
      fecharModalEditarDetalhes();
      if (eventoSelecionado) {
        const ev = await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento);
        setEventoSelecionado(ev);
      }
    } catch {
      showToast("Erro ao atualizar", "error");
    }
  };

  const diasNoMes = new Date(ano, mes, 0).getDate();
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const eventosPorDia = eventos.reduce<Record<string, EscalaEvento[]>>((acc, ev) => {
    const d = formatarData(ev.data_hora);
    if (!acc[d]) acc[d] = [];
    acc[d].push(ev);
    return acc;
  }, {});

  return (
    <div className="page-with-fixed-header escala-page">
      <Header />
      <main className="container escala-user">
        <div className="escala-header">
          <h1 className="page-title">ESCALA</h1>
          <div className="escala-header-actions">
            <Link to="/usuario/escala/mapa" className="btn-mapa">
              Mapa
            </Link>
            {isAdmin && (
              <button className="btn-criar" onClick={() => abrirModalEvento()}>
                + Novo Evento
              </button>
            )}
          </div>
        </div>

        <div className="escala-calendario-nav">
          <button
            type="button"
            className="btn-nav"
            onClick={() => {
              if (mes === 1) {
                setMes(12);
                setAno((a) => a - 1);
              } else setMes((m) => m - 1);
            }}
          >
            ‹
          </button>
          <h2 className="escala-mes-ano">
            {MESES[mes - 1]} {ano}
          </h2>
          <button
            type="button"
            className="btn-nav"
            onClick={() => {
              if (mes === 12) {
                setMes(1);
                setAno((a) => a + 1);
              } else setMes((m) => m + 1);
            }}
          >
            ›
          </button>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <div className="escala-layout">
            <section className="escala-calendario">
              <div className="calendario-dias-semana">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <span key={d} className="dia-semana">
                    {d}
                  </span>
                ))}
              </div>
              <div className="calendario-grid">
                {Array.from({ length: primeiroDia }, (_, i) => (
                  <div key={`empty-${i}`} className="calendario-celula vazio" />
                ))}
                {Array.from({ length: diasNoMes }, (_, i) => {
                  const dia = i + 1;
                  const d = new Date(ano, mes - 1, dia);
                  const key = d.toLocaleDateString("pt-BR");
                  const evs = eventosPorDia[key] || [];
                  return (
                    <div
                      key={dia}
                      className={`calendario-celula ${evs.length > 0 ? "tem-evento" : ""} ${isAdmin ? "clicavel" : ""}`}
                      onClick={() => isAdmin && abrirModalEvento(undefined, d)}
                    >
                      <span className="dia-numero">{dia}</span>
                      {evs.length > 0 && (
                        <div className="dia-eventos">
                          {evs.slice(0, 3).map((ev) => (
                            <button
                              key={ev.id_escala_evento}
                              type="button"
                              className="dia-evento-nome"
                              title={ev.titulo}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirEvento(ev.id_escala_evento);
                              }}
                            >
                              {ev.titulo}
                            </button>
                          ))}
                          {evs.length > 3 && (
                            <span className="dia-evento-mais">+{evs.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="escala-lista">
              <h3 className="escala-lista-titulo">Eventos do mês</h3>
              {eventos.length === 0 ? (
                <p className="escala-vazio">Nenhum evento neste período.</p>
              ) : (
                <ul className="escala-lista-eventos">
                  {eventos.map((ev) => (
                    <li
                      key={ev.id_escala_evento}
                      className="escala-item-evento"
                      onClick={() => abrirEvento(ev.id_escala_evento)}
                    >
                      <span className="ev-data">{formatarDataHora(ev.data_hora, ev.data_hora_fim)}</span>
                      <span className="ev-titulo">{ev.titulo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      {eventoSelecionado && (
        <div className="modal-overlay modal-escala-overlay">
          <div className="modal-escala-dashboard">
            <div className="escala-dashboard-header">
              <div className="escala-dashboard-titulo">
                <h2>{eventoSelecionado.titulo}</h2>
                <span className="escala-dashboard-data">{formatarDataHora(eventoSelecionado.data_hora, eventoSelecionado.data_hora_fim)}</span>
              </div>
              <button type="button" className="btn-fechar-dashboard" onClick={fecharEvento} title="Fechar">
                ×
              </button>
            </div>

            {eventoSelecionado.descricao && (
              <p className="escala-dashboard-desc">{eventoSelecionado.descricao}</p>
            )}

            <div className="escala-dashboard-resumo">
              <div className="resumo-card">
                <span className="resumo-numero">
                  {eventoSelecionado.areas?.reduce((acc, ar) => acc + (ar.atribuicoes?.length ?? 0), 0) ?? 0}
                </span>
                <span className="resumo-label">Pessoas escaladas</span>
              </div>
              <div className="resumo-card">
                <span className="resumo-numero">{eventoSelecionado.areas?.length ?? 0}</span>
                <span className="resumo-label">Ministérios</span>
              </div>
              <div className="resumo-card resumo-status">
                <span className="resumo-label">Status</span>
                <span className="resumo-badge">Em dia</span>
              </div>
            </div>

            <div className="escala-dashboard-titulo-secao">
              <span>Escala do evento — visão geral</span>
            </div>

            <div className="escala-dashboard-grid">
              {eventoSelecionado.areas?.map((ar, idx) => {
                const podeGerenciar = ar.podeGerenciar !== false;
                const total = ar.atribuicoes?.length ?? 0;
                const cores = ["area-louvor", "area-som", "area-recepcao", "area-generico"];
                const corClasse = cores[Math.min(idx, cores.length - 1)];
                return (
                  <div key={ar.id_escala_area} className={`escala-ministerio-card ${corClasse}`}>
                    <div className="ministerio-card-header">
                      <span className="ministerio-icon">
                        {ar.nome === "Louvor" ? "🎵" : ar.nome === "Som" ? "🔊" : ar.nome === "Recepção" || ar.nome === "Voluntários" ? "🤝" : "📋"}
                      </span>
                      <h3 className="ministerio-nome">{ar.nome}</h3>
                      <span className="ministerio-count">{total} {total === 1 ? "pessoa" : "pessoas"}</span>
                    </div>
                    <div className="ministerio-pessoas">
                      {(ar.atribuicoes || []).length > 0 ? (
                        (ar.atribuicoes || []).map((att) => (
                          <div key={att.id_escala_atribuicao} className="pessoa-chip">
                            <span className="pessoa-avatar">
                              {(att.usuario_nome || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                            <div className="pessoa-chip-content">
                              <span className="pessoa-nome">{att.usuario_nome}</span>
                              <DetalhesResumo detalhes={att.detalhes} nomeArea={ar.nome} />
                            </div>
                            {podeGerenciar && (
                              <div className="pessoa-chip-actions">
                                <button
                                  type="button"
                                  className="btn-editar-chip"
                                  onClick={() => abrirModalEditarDetalhes(att, ar.nome)}
                                  title="Editar informações"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  className="btn-remover-chip"
                                  onClick={() => handleRemoverAtribuicao(att)}
                                  title="Remover da escala"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="ministerio-vazio">Ninguém escalado</p>
                      )}
                    </div>
                    {podeGerenciar && (
                      <button
                        type="button"
                        className="btn-adicionar-ministerio"
                        onClick={() => abrirModalAtribuicao(ar)}
                      >
                        <span className="btn-add-icon">+</span> Adicionar pessoa
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {podeEditar && (
              <div className="escala-dashboard-actions">
                <button
                  type="button"
                  className="btn-editar-evento"
                  onClick={() => {
                    fecharEvento();
                    abrirModalEvento(eventoSelecionado);
                  }}
                >
                  ✏️ Editar evento
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn-excluir-evento"
                    onClick={() => {
                      setEventoToExcluir(eventoSelecionado.id_escala_evento);
                      setShowConfirmExcluir(true);
                    }}
                  >
                    🗑️ Excluir evento
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showModalEvento && (
        <div className="modal-evento-overlay">
          <div className="modal-escala-evento">
            <div className="modal-evento-header">
              <div className="modal-evento-header-content">
                <span className="modal-evento-icon" aria-hidden>📅</span>
                <div>
                  <h2 className="modal-evento-title">{editandoEventoId ? "Editar Evento" : "Novo Evento"}</h2>
                  <p className="modal-evento-subtitle">
                    {editandoEventoId ? "Atualize os dados do evento" : "Preencha os dados para criar um novo evento"}
                  </p>
                </div>
              </div>
              <button type="button" className="modal-evento-close" onClick={fecharModalEvento} title="Fechar" aria-label="Fechar">
                ×
              </button>
            </div>
            <form onSubmit={handleSalvarEvento} className="modal-evento-form">
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={formEvento.titulo}
                  onChange={(e) => setFormEvento({ ...formEvento, titulo: e.target.value })}
                  placeholder="Ex: Culto de Celebração"
                />
              </div>
              <div className="form-group">
                <label>Data e hora início *</label>
                <input
                  type="datetime-local"
                  value={formEvento.data_hora}
                  onChange={(e) => setFormEvento({ ...formEvento, data_hora: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Data e hora término</label>
                <input
                  type="datetime-local"
                  value={formEvento.data_hora_fim}
                  onChange={(e) => setFormEvento({ ...formEvento, data_hora_fim: e.target.value })}
                />
                <p className="form-hint">Opcional. Usado para verificar sobreposição de horários ao escalar.</p>
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={formEvento.descricao}
                  onChange={(e) => setFormEvento({ ...formEvento, descricao: e.target.value })}
                  rows={2}
                  placeholder="Opcional"
                />
              </div>
              <div className="form-group">
                <label>Ministérios presentes *</label>
                {editandoEventoId && (
                  <p className="form-hint">Alterar os ministérios removerá as atribuições existentes.</p>
                )}
                <div className="ministerios-checkboxes">
                  {ministerios.map((m) => (
                    <label key={m.id_ministerio} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={formEvento.id_ministerios.includes(m.id_ministerio)}
                        onChange={(e) => {
                          const prev = formEvento.id_ministerios;
                          const next = e.target.checked
                            ? [...prev, m.id_ministerio]
                            : prev.filter((id) => id !== m.id_ministerio);
                          setFormEvento({ ...formEvento, id_ministerios: next });
                        }}
                      />
                      <span>{m.nome}</span>
                    </label>
                  ))}
                  {ministerios.length === 0 && (
                    <p className="form-hint">Cadastre ministérios em Gerenciamento antes de criar eventos.</p>
                  )}
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formEvento.ativo}
                    onChange={(e) => setFormEvento({ ...formEvento, ativo: e.target.checked })}
                  />
                  Evento ativo
                </label>
              </div>
              <div className="modal-evento-actions">
                <button type="button" className="btn-evento-cancelar" onClick={fecharModalEvento}>
                  Cancelar
                </button>
                <button type="submit" className="btn-evento-salvar">
                  {editandoEventoId ? "Salvar alterações" : "Criar evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalAtribuicao && areaParaAtribuir && !atribuicaoEditando && (
        <div className="modal-overlay modal-evento-overlay">
          <div className="modal-content modal-atribuicao modal-atribuicao-completo">
            <h2>Escalar em {areaParaAtribuir.nome}</h2>
            <div className="form-group">
              <label>Selecione a pessoa</label>
              <select
                value={usuarioSelecionado ?? ""}
                onChange={(e) => setUsuarioSelecionado(Number(e.target.value) || null)}
              >
                <option value="">-- Selecione --</option>
                {usuarios.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Informações da escala</label>
              <AtribuicaoDetalhesForm
                nomeArea={areaParaAtribuir.nome}
                value={formDetalhes}
                onChange={setFormDetalhes}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={fecharModalAtribuicao}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-salvar"
                onClick={handleAdicionarAtribuicao}
                disabled={!usuarioSelecionado}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {atribuicaoEditando && areaParaAtribuir && (
        <div className="modal-overlay modal-evento-overlay">
          <div className="modal-content modal-atribuicao modal-atribuicao-editar">
            <h2>Editar informações — {atribuicaoEditando.usuario_nome}</h2>
            <p className="modal-atribuicao-contexto">Em {areaParaAtribuir.nome}</p>
            <AtribuicaoDetalhesForm
              nomeArea={areaParaAtribuir.nome}
              value={formDetalhes}
              onChange={setFormDetalhes}
            />
            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={fecharModalEditarDetalhes}>
                Cancelar
              </button>
              <button type="button" className="btn-salvar" onClick={handleSalvarDetalhes}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirmExcluir}
        title="Excluir evento?"
        message="Esta ação não pode ser desfeita. Todas as atribuições serão removidas."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleExcluirEvento}
        onCancel={() => {
          setShowConfirmExcluir(false);
          setEventoToExcluir(null);
        }}
      />

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

export default EscalaUser;
