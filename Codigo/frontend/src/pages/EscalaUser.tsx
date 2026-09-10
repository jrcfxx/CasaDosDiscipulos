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
  EscalaConflito,
  EscalaTemplate,
  EscalaHistoricoItem,
  VisaoAno,
  VisualizacaoDia,
  VisualizacaoSemana,
  VisualizacaoMes,
  SlotInstrumento,
  MoverMembroPayload,
} from "../services/escalaService";
import ministerioService from "../services/ministerioService";
import usuarioService from "../services/usuarioService";
import AtribuicaoDetalhesForm from "../components/AtribuicaoDetalhesForm";
import EscalaVisaoSeletor, { EscalaVisaoTipo } from "../components/escala/EscalaVisaoSeletor";
import { EscalaVisaoSemana, EscalaVisaoAnoPainel, EscalaVisaoMesUnificada } from "../components/escala/EscalaVisoes";
import EscalaGradeDnd from "../components/escala/EscalaGradeDnd";
import EscalaQuadroUnificado from "../components/escala/EscalaQuadroUnificado";
import ModalConflitos from "../components/escala/ModalConflitos";
import ModalBuscaPessoa from "../components/escala/ModalBuscaPessoa";
import ModalHistorico from "../components/escala/ModalHistorico";
import { useEscalaUndo } from "../hooks/useEscalaUndo";
import { getErrorMessage } from "../utils/errorUtils";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function inicioSemana(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  return toIsoDate(x);
}

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
    const strFim = new Date(fim).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${str} – ${strFim}`;
  }
  return str;
}

const EscalaUser: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isLiderMinisterio } = useAuth();
  const podeEditar = isAdmin || isLiderMinisterio;

  const [visao, setVisao] = useState<EscalaVisaoTipo>("mes");
  const [visaoAno, setVisaoAno] = useState<VisaoAno | null>(null);
  const [visaoDiaUnificada, setVisaoDiaUnificada] = useState<VisualizacaoDia | null>(null);
  const [visaoSemanaUnificada, setVisaoSemanaUnificada] = useState<VisualizacaoSemana | null>(null);
  const [visaoMesUnificada, setVisaoMesUnificada] = useState<VisualizacaoMes | null>(null);
  const [showBuscaPessoa, setShowBuscaPessoa] = useState(false);
  const [usuariosBusca, setUsuariosBusca] = useState<{ id_usuario: number; nome: string }[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<EscalaEventoCompleto | null>(null);
  const [usuarios, setUsuarios] = useState<{ id_usuario: number; nome: string }[]>([]);
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [dataDia, setDataDia] = useState(() => toIsoDate(new Date()));
  const [dataSemana, setDataSemana] = useState(() => inicioSemana(new Date()));
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
  const [conflitos, setConflitos] = useState<EscalaConflito[] | null>(null);
  const [moverPendente, setMoverPendente] = useState<MoverMembroPayload | null>(null);
  const [templates, setTemplates] = useState<EscalaTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [historico, setHistorico] = useState<EscalaHistoricoItem[]>([]);

  const showToast = useCallback((msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  }, []);

  const { podeDesfazer, marcarAlteracao, desfazer } = useEscalaUndo(
    (ev) => {
      setEventoSelecionado(ev);
      showToast("Alteração desfeita", "success");
    },
    (msg) => showToast(msg, "error")
  );

  const conteudoCarregadoRef = useRef(false);

  useEffect(() => {
    conteudoCarregadoRef.current = false;
  }, [visao, ano, mes, dataDia, dataSemana]);

  const fetchEventos = useCallback(async () => {
    try {
      if (!conteudoCarregadoRef.current) setLoading(true);
      if (visao === "mes") {
        const data = await escalaService.getVisualizacaoMes(ano, mes, "completo");
        setVisaoMesUnificada(data);
        setVisaoAno(null);
      } else if (visao === "dia") {
        const data = await escalaService.getVisualizacaoDia(dataDia);
        setVisaoDiaUnificada(data);
      } else if (visao === "semana") {
        const data = await escalaService.getVisualizacaoSemana(dataSemana);
        setVisaoSemanaUnificada(data);
      } else if (visao === "ano") {
        const data = await escalaService.getVisaoAno(ano);
        setVisaoAno(data);
      }
      conteudoCarregadoRef.current = true;
    } catch {
      showToast("Erro ao carregar eventos", "error");
    } finally {
      setLoading(false);
    }
  }, [ano, mes, visao, dataDia, dataSemana, showToast]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  useEffect(() => {
    if (podeEditar) {
      ministerioService.getAll().then(setMinisterios).catch(() => setMinisterios([]));
      escalaService.listarTemplates().then(setTemplates).catch(() => setTemplates([]));
    }
  }, [podeEditar]);

  const carregarUsuariosParaEscalar = useCallback(async (idEvento: number, nomeArea?: string) => {
    try {
      const list = await escalaService.getUsuariosParaEscalar(idEvento, nomeArea);
      setUsuarios(list || []);
    } catch {
      setUsuarios([]);
    }
  }, []);

  const abrirModalEvento = (evento?: EscalaEvento, dataAlvo?: Date) => {
    if (!isAdmin) return;
    const fmtDateTime = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (evento) {
      setEditandoEventoId(evento.id_escala_evento);
      const dh = new Date(evento.data_hora);
      const dhFim = evento.data_hora_fim
        ? new Date(evento.data_hora_fim)
        : new Date(dh.getTime() + 2 * 60 * 60 * 1000);
      const idsMin =
        (evento as EscalaEvento & { ministerios?: { id_ministerio: number }[] }).ministerios?.map(
          (m) => m.id_ministerio
        ) ?? [];
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
    const areas = ministerios
      .filter((m) => formEvento.id_ministerios.includes(m.id_ministerio))
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((m) => m.nome);
    try {
      const payload = {
        titulo: formEvento.titulo.trim(),
        data_hora: formEvento.data_hora.slice(0, 16).replace("T", " ") + ":00",
        data_hora_fim: formEvento.data_hora_fim?.trim()
          ? formEvento.data_hora_fim.slice(0, 16).replace("T", " ") + ":00"
          : null,
        descricao: formEvento.descricao.trim() || undefined,
        ativo: Boolean(formEvento.ativo),
        areas,
        id_ministerios: formEvento.id_ministerios,
      };
      if (editandoEventoId) {
        await escalaService.updateEvento(editandoEventoId, payload);
        showToast("Evento atualizado", "success");
      } else {
        await escalaService.createEvento(payload);
        showToast("Evento criado", "success");
      }
      fecharModalEvento();
      fetchEventos();
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao salvar evento"), "error");
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
      showToast(getErrorMessage(err, "Erro ao excluir"), "error");
    }
    setShowConfirmExcluir(false);
    setEventoToExcluir(null);
  };

  const abrirEvento = useCallback(
    async (id: number) => {
      try {
        const ev = await escalaService.getEventoCompleto(id);
        setEventoSelecionado(ev);
      } catch {
        showToast("Erro ao carregar evento", "error");
      }
    },
    [showToast]
  );

  const abrirEventoId = (location.state as { abrirEventoId?: number })?.abrirEventoId;
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
    setAreaParaAtribuir({
      id_escala_area: att.id_escala_area,
      id_escala_evento: 0,
      nome: areaNome,
      ordem: 0,
    });
  };

  const fecharModalEditarDetalhes = () => {
    setAtribuicaoEditando(null);
    setFormDetalhes({});
    setAreaParaAtribuir(null);
  };

  const handleAdicionarAtribuicao = async () => {
    const idEvento = areaParaAtribuir?.id_escala_evento || eventoSelecionado?.id_escala_evento;
    if (!areaParaAtribuir || !usuarioSelecionado || !idEvento) return;
    const detalhesObj: Record<string, string | null> = {};
    Object.entries(formDetalhes).forEach(([k, v]) => {
      detalhesObj[k] = v?.trim() || null;
    });
    try {
      const validacao = await escalaService.validarAtribuicao(idEvento, {
        id_escala_area: areaParaAtribuir.id_escala_area,
        id_usuario: usuarioSelecionado,
        detalhes: detalhesObj,
      });
      if (!validacao.sucesso) {
        setConflitos(validacao.conflitos);
        return;
      }
      await escalaService.addAtribuicao(
        areaParaAtribuir.id_escala_area,
        usuarioSelecionado,
        detalhesObj
      );
      showToast("Pessoa escalada com sucesso", "success");
      marcarAlteracao();
      fecharModalAtribuicao();
      fetchEventos();
      if (eventoSelecionado?.id_escala_evento === idEvento) {
        const ev = await escalaService.getEventoCompleto(idEvento);
        setEventoSelecionado(ev);
      }
    } catch (err) {
      const data = (err as { response?: { data?: { conflitos?: EscalaConflito[] } } })?.response
        ?.data;
      if (data?.conflitos?.length) {
        setConflitos(data.conflitos);
        return;
      }
      showToast(
        getErrorMessage(err, "Não foi possível escalar. Verifique conflitos de horário."),
        "error"
      );
    }
  };

  const handleRemoverAtribuicao = async (a: EscalaAtribuicao) => {
    try {
      await escalaService.removeAtribuicao(a.id_escala_atribuicao);
      showToast("Removido da escala", "success");
      marcarAlteracao();
      fetchEventos();
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
      marcarAlteracao();
      fecharModalEditarDetalhes();
      fetchEventos();
      if (eventoSelecionado) {
        const ev = await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento);
        setEventoSelecionado(ev);
      }
    } catch {
      showToast("Erro ao atualizar", "error");
    }
  };

  const executarMoverUnificado = async (payload: MoverMembroPayload) => {
    const result = await escalaService.moverMembro(payload);
    showToast(result.mensagem || "Pessoa movida", "success");
    marcarAlteracao();
    setConflitos(null);
    setMoverPendente(null);
    fetchEventos();
    if (eventoSelecionado) {
      const ev = await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento);
      setEventoSelecionado(ev);
    }
  };

  const handleMover = async (idAtribuicao: number, idAreaDestino: number) => {
    if (!eventoSelecionado) return;
    const att = eventoSelecionado.areas
      ?.flatMap((a) => a.atribuicoes || [])
      .find((a) => a.id_escala_atribuicao === idAtribuicao);
    const detalhes = (att?.detalhes || {}) as Record<string, string | number | null>;
    const instrumentoDestino = String(
      detalhes.instrumento || detalhes.funcao || "_geral"
    );
    await handleMoverUnificado({
      membroEscalaOrigemId: idAtribuicao,
      escalaDestinoId: eventoSelecionado.id_escala_evento,
      instrumentoDestino,
      id_escala_area: idAreaDestino,
    });
  };

  const handleMoverUnificado = async (payload: MoverMembroPayload) => {
    try {
      const validacao = await escalaService.validarMoverMembro(payload);
      if (!validacao.podeProsseguir) {
        setMoverPendente(payload);
        setConflitos(validacao.conflitos);
        return;
      }
      await executarMoverUnificado(payload);
    } catch (err) {
      const data = (err as { response?: { data?: { conflitos?: EscalaConflito[] } } })?.response
        ?.data;
      if (data?.conflitos?.length) {
        setMoverPendente(payload);
        setConflitos(data.conflitos);
        return;
      }
      showToast(getErrorMessage(err, "Não foi possível mover — conflito na escala"), "error");
    }
  };

  const handleForcarMovimento = async () => {
    if (!moverPendente) {
      setConflitos(null);
      return;
    }
    try {
      await executarMoverUnificado({ ...moverPendente, forcarMovimento: true });
    } catch (err) {
      showToast(getErrorMessage(err, "Não foi possível forçar o movimento"), "error");
    }
  };

  const handleCopiarDia = async () => {
    if (!isAdmin) return;
    const dest = window.prompt("Copiar este dia para (AAAA-MM-DD):", dataDia);
    if (!dest || !/^\d{4}-\d{2}-\d{2}$/.test(dest)) return;
    try {
      const result = await escalaService.copiarDia(dataDia, dest);
      const avisos = result.warnings?.length ? ` (${result.warnings.length} aviso(s))` : "";
      showToast(`Dia copiado para ${dest}${avisos}`, "success");
      fetchEventos();
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao copiar o dia"), "error");
    }
  };

  const handleCopiarSemana = async () => {
    if (!isAdmin) return;
    const dest = window.prompt(
      "Copiar esta semana para a semana que começa em (AAAA-MM-DD):",
      dataSemana
    );
    if (!dest || !/^\d{4}-\d{2}-\d{2}$/.test(dest)) return;
    try {
      const result = await escalaService.copiarSemana({
        data_inicio_origem: dataSemana,
        data_inicio_destino: dest,
      });
      const avisos = result.warnings?.length ? ` (${result.warnings.length} aviso(s))` : "";
      showToast(`Semana copiada${avisos}`, "success");
      fetchEventos();
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao copiar a semana"), "error");
    }
  };

  const abrirHistorico = async () => {
    if (!eventoSelecionado) return;
    try {
      const list = await escalaService.getHistorico(eventoSelecionado.id_escala_evento);
      setHistorico(list);
      setShowHistorico(true);
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao carregar histórico"), "error");
    }
  };

  const pessoasDaVisaoAtual = (): { id_usuario: number; nome: string }[] => {
    const map = new Map<number, string>();
    const coletar = (eventosUni: { instrumentos?: Record<string, { membros: { usuario: { id: number; nome: string } }[] }> }[]) => {
      for (const ev of eventosUni) {
        for (const slot of Object.values(ev.instrumentos || {})) {
          for (const m of slot.membros) {
            map.set(m.usuario.id, m.usuario.nome);
          }
        }
      }
    };
    if (visaoDiaUnificada) coletar(visaoDiaUnificada.eventos);
    if (visaoSemanaUnificada) coletar(visaoSemanaUnificada.dias.flatMap((d) => d.eventos));
    return [...map.entries()].map(([id_usuario, nome]) => ({ id_usuario, nome }));
  };

  const abrirSlotParaEscalar = async (eventoId: number, slot: SlotInstrumento) => {
    setAreaParaAtribuir({
      id_escala_area: slot.id_escala_area,
      id_escala_evento: eventoId,
      nome: slot.areaNome,
      ordem: 0,
    });
    setUsuarioSelecionado(null);
    const detalhes: Record<string, string> = {};
    if (slot.chaveDetalhe && slot.tipo !== "_geral") detalhes[slot.chaveDetalhe] = slot.tipo;
    setFormDetalhes(detalhes);
    await carregarUsuariosParaEscalar(eventoId, slot.areaNome);
    setShowModalAtribuicao(true);
  };

  const handleCopiarEvento = async () => {
    if (!eventoSelecionado || !isAdmin) return;
    const d = new Date(eventoSelecionado.data_hora);
    d.setDate(d.getDate() + 7);
    const data_hora = `${toIsoDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    let data_hora_fim: string | null = null;
    if (eventoSelecionado.data_hora_fim) {
      const f = new Date(eventoSelecionado.data_hora_fim);
      f.setDate(f.getDate() + 7);
      data_hora_fim = `${toIsoDate(f)} ${pad(f.getHours())}:${pad(f.getMinutes())}:00`;
    }
    try {
      const result = await escalaService.copiarEvento(eventoSelecionado.id_escala_evento, {
        data_hora,
        data_hora_fim,
      });
      const avisos = result.warnings?.length
        ? ` (${result.warnings.length} aviso(s) de conflito)`
        : "";
      showToast(`Evento copiado para +7 dias${avisos}`, "success");
      fetchEventos();
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao copiar"), "error");
    }
  };

  const handlePublicar = async () => {
    if (!eventoSelecionado || !isAdmin) return;
    try {
      await escalaService.publicarEvento(eventoSelecionado.id_escala_evento);
      showToast("Escala publicada", "success");
      const ev = await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento);
      setEventoSelecionado(ev);
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao publicar"), "error");
    }
  };

  const handleSalvarTemplate = async () => {
    if (!eventoSelecionado || !isAdmin) return;
    const nome = window.prompt("Nome do template:", `Template — ${eventoSelecionado.titulo}`);
    if (!nome?.trim()) return;
    try {
      await escalaService.criarTemplate({
        nome: nome.trim(),
        id_escala_evento: eventoSelecionado.id_escala_evento,
      });
      showToast("Template salvo", "success");
      setTemplates(await escalaService.listarTemplates());
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao salvar template"), "error");
    }
  };

  const handleAplicarTemplate = async (id: number) => {
    if (!isAdmin) return;
    const agora = new Date();
    agora.setDate(agora.getDate() + ((7 - agora.getDay()) % 7 || 7));
    agora.setHours(19, 0, 0, 0);
    const data_hora = `${toIsoDate(agora)} 19:00:00`;
    try {
      const result = await escalaService.aplicarTemplate(id, { data_hora });
      showToast(
        result.warnings?.length
          ? `Template aplicado com ${result.warnings.length} aviso(s)`
          : "Template aplicado",
        "success"
      );
      setShowTemplates(false);
      fetchEventos();
      if (result.dados?.id_escala_evento) abrirEvento(result.dados.id_escala_evento);
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao aplicar template"), "error");
    }
  };

  const navLabel =
    visao === "dia"
      ? new Date(`${dataDia}T12:00:00`).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : visao === "semana"
        ? `Semana de ${new Date(`${dataSemana}T12:00:00`).toLocaleDateString("pt-BR")}`
        : visao === "ano"
          ? String(ano)
          : `${MESES[mes - 1]} ${ano}`;

  const navegarAnterior = () => {
    if (visao === "mes") {
      if (mes === 1) {
        setMes(12);
        setAno((a) => a - 1);
      } else setMes((m) => m - 1);
    } else if (visao === "dia") {
      const d = new Date(`${dataDia}T12:00:00`);
      d.setDate(d.getDate() - 1);
      setDataDia(toIsoDate(d));
    } else if (visao === "semana") {
      const d = new Date(`${dataSemana}T12:00:00`);
      d.setDate(d.getDate() - 7);
      setDataSemana(toIsoDate(d));
    } else {
      setAno((a) => a - 1);
    }
  };

  const navegarProximo = () => {
    if (visao === "mes") {
      if (mes === 12) {
        setMes(1);
        setAno((a) => a + 1);
      } else setMes((m) => m + 1);
    } else if (visao === "dia") {
      const d = new Date(`${dataDia}T12:00:00`);
      d.setDate(d.getDate() + 1);
      setDataDia(toIsoDate(d));
    } else if (visao === "semana") {
      const d = new Date(`${dataSemana}T12:00:00`);
      d.setDate(d.getDate() + 7);
      setDataSemana(toIsoDate(d));
    } else {
      setAno((a) => a + 1);
    }
  };

  return (
    <div className="page-with-fixed-header escala-page">
      <Header />
      <main id="main-content" className="container escala-user" tabIndex={-1}>
        <div className="escala-header">
          <h1 className="page-title">ESCALA</h1>
          <div className="escala-header-actions">
            <Link to="/usuario/escala/mapa" className="btn-mapa">
              Mapa
            </Link>
            <button
              type="button"
              className="btn-mapa"
              onClick={async () => {
                try {
                  const list = await usuarioService.getAll();
                  setUsuariosBusca(list.map((u) => ({ id_usuario: u.id_usuario, nome: u.nome })));
                } catch {
                  setUsuariosBusca(pessoasDaVisaoAtual());
                }
                setShowBuscaPessoa(true);
              }}
            >
              Buscar pessoa
            </button>
            {isAdmin && (
              <>
                <button type="button" className="btn-mapa" onClick={() => setShowTemplates(true)}>
                  Templates
                </button>
                <button className="btn-criar" onClick={() => abrirModalEvento()}>
                  + Novo Evento
                </button>
              </>
            )}
          </div>
        </div>

        <EscalaVisaoSeletor visao={visao} onChange={setVisao} />

        <div className="escala-calendario-nav">
          <button type="button" className="btn-nav" onClick={navegarAnterior}>
            ‹
          </button>
          <h2 className="escala-mes-ano">{navLabel}</h2>
          <button type="button" className="btn-nav" onClick={navegarProximo}>
            ›
          </button>
          <button
            type="button"
            className="btn-mapa"
            onClick={() => {
              const hoje = new Date();
              setAno(hoje.getFullYear());
              setMes(hoje.getMonth() + 1);
              setDataDia(toIsoDate(hoje));
              setDataSemana(inicioSemana(hoje));
            }}
          >
            Hoje
          </button>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <div className="escala-layout">
            {visao === "mes" && visaoMesUnificada && (
              <EscalaVisaoMesUnificada
                visao={visaoMesUnificada}
                onAbrirDia={(data) => {
                  setDataDia(data);
                  setVisao("dia");
                }}
                onAbrirEvento={abrirEvento}
                podeEditar={podeEditar}
                onMover={handleMoverUnificado}
                onEscalar={abrirSlotParaEscalar}
              />
            )}

            {visao === "dia" && visaoDiaUnificada && (
              <EscalaQuadroUnificado
                visao={visaoDiaUnificada}
                podeEditar={podeEditar}
                onMover={handleMoverUnificado}
                onEscalar={abrirSlotParaEscalar}
                onAbrirEvento={abrirEvento}
                onCopiarDia={isAdmin ? handleCopiarDia : undefined}
                onTemplates={isAdmin ? () => setShowTemplates(true) : undefined}
                onEditarMembro={(m, areaNome) =>
                  abrirModalEditarDetalhes(
                    {
                      id_escala_atribuicao: m.membroEscalaId,
                      id_escala_area: m.id_escala_area,
                      id_usuario: m.usuario.id,
                      usuario_nome: m.usuario.nome,
                      detalhes: (m.detalhes || {}) as EscalaAtribuicao["detalhes"],
                    },
                    areaNome
                  )
                }
                onRemoverMembro={(m) =>
                  handleRemoverAtribuicao({
                    id_escala_atribuicao: m.membroEscalaId,
                    id_escala_area: m.id_escala_area,
                    id_usuario: m.usuario.id,
                  })
                }
              />
            )}
            {visao === "semana" && visaoSemanaUnificada && (
              <EscalaVisaoSemana
                visao={visaoSemanaUnificada}
                onAbrirEvento={abrirEvento}
                onAbrirDia={(data) => {
                  setDataDia(data);
                  setVisao("dia");
                }}
                podeEditar={podeEditar}
                onMover={handleMoverUnificado}
                onEscalar={abrirSlotParaEscalar}
                onCopiarSemana={isAdmin ? handleCopiarSemana : undefined}
              />
            )}
            {visao === "ano" && visaoAno && (
              <EscalaVisaoAnoPainel
                visao={visaoAno}
                onSelecionarMes={(m) => {
                  setMes(m);
                  setVisao("mes");
                }}
                onAbrirEvento={abrirEvento}
              />
            )}
          </div>
        )}
      </main>

      {eventoSelecionado && (
        <div className="modal-overlay modal-escala-overlay">
          <div className="modal-escala-dashboard">
            <div className="escala-dashboard-header">
              <div className="escala-dashboard-titulo">
                <h2>{eventoSelecionado.titulo}</h2>
                <span className="escala-dashboard-data">
                  {formatarDataHora(eventoSelecionado.data_hora, eventoSelecionado.data_hora_fim)}
                </span>
                {eventoSelecionado.status && (
                  <span className={`status-badge status-${eventoSelecionado.status}`}>
                    {eventoSelecionado.status}
                  </span>
                )}
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
            </div>

            <div className="escala-dashboard-titulo-secao">
              <span>Escala do evento — arraste pessoas entre ministérios</span>
            </div>

            <EscalaGradeDnd
              evento={eventoSelecionado}
              podeEditar={podeEditar}
              onMover={handleMover}
              onEscalar={(areaId) => {
                const area = eventoSelecionado.areas?.find((a) => a.id_escala_area === areaId);
                if (area) abrirModalAtribuicao(area);
              }}
              onEditar={abrirModalEditarDetalhes}
              onRemover={handleRemoverAtribuicao}
            />

            {podeEditar && (
              <div className="escala-dashboard-actions">
                <button type="button" className="btn-editar-evento" onClick={abrirHistorico}>
                  Histórico
                </button>
                {isAdmin && (
                  <>
                    <button type="button" className="btn-editar-evento" onClick={handlePublicar}>
                      Publicar
                    </button>
                    <button type="button" className="btn-editar-evento" onClick={handleCopiarEvento}>
                      Copiar (+7 dias)
                    </button>
                    <button type="button" className="btn-editar-evento" onClick={handleSalvarTemplate}>
                      Salvar template
                    </button>
                    <button
                      type="button"
                      className="btn-editar-evento"
                      disabled={!podeDesfazer}
                      onClick={() => desfazer(eventoSelecionado.id_escala_evento)}
                    >
                      Desfazer
                    </button>
                    <button
                      type="button"
                      className="btn-editar-evento"
                      onClick={() => {
                        fecharEvento();
                        abrirModalEvento(eventoSelecionado);
                      }}
                    >
                      Editar evento
                    </button>
                    <button
                      type="button"
                      className="btn-excluir-evento"
                      onClick={() => {
                        setEventoToExcluir(eventoSelecionado.id_escala_evento);
                        setShowConfirmExcluir(true);
                      }}
                    >
                      Excluir evento
                    </button>
                  </>
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
                <div>
                  <h2 className="modal-evento-title">
                    {editandoEventoId ? "Editar Evento" : "Novo Evento"}
                  </h2>
                </div>
              </div>
              <button type="button" className="modal-evento-close" onClick={fecharModalEvento}>
                ×
              </button>
            </div>
            <form onSubmit={handleSalvarEvento} className="modal-evento-form">
              <div className="form-group">
                <label htmlFor="formEventoTitulo">Título *</label>
                <input
                  id="formEventoTitulo"
                  type="text"
                  value={formEvento.titulo}
                  onChange={(e) => setFormEvento({ ...formEvento, titulo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="formEventoDataInicio">Data e hora início *</label>
                <input
                  id="formEventoDataInicio"
                  type="datetime-local"
                  value={formEvento.data_hora}
                  onChange={(e) => setFormEvento({ ...formEvento, data_hora: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="formEventoDataFim">Data e hora término</label>
                <input
                  id="formEventoDataFim"
                  type="datetime-local"
                  value={formEvento.data_hora_fim}
                  onChange={(e) => setFormEvento({ ...formEvento, data_hora_fim: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="formEventoDescricao">Descrição</label>
                <textarea
                  id="formEventoDescricao"
                  value={formEvento.descricao}
                  onChange={(e) => setFormEvento({ ...formEvento, descricao: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <span>Ministérios presentes *</span>
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
              <label htmlFor="atribuicaoUsuarioSelect">Selecione a pessoa</label>
              <select
                id="atribuicaoUsuarioSelect"
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
              <span>Informações da escala</span>
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

      {showBuscaPessoa && (
        <ModalBuscaPessoa
          usuarios={usuariosBusca}
          dataInicio={`${ano}-${pad(mes)}-01`}
          dataFim={toIsoDate(new Date(ano, mes, 0))}
          onClose={() => setShowBuscaPessoa(false)}
          onAbrirEvento={(id) => {
            setShowBuscaPessoa(false);
            abrirEvento(id);
          }}
        />
      )}

      {showTemplates && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Templates de escala</h2>
            {templates.length === 0 ? (
              <p className="escala-vazio">Nenhum template salvo. Abra um evento e use &quot;Salvar template&quot;.</p>
            ) : (
              <ul className="lista-templates">
                {templates.map((t) => (
                  <li key={t.id_escala_template}>
                    <span>{t.nome}</span>
                    <button type="button" className="btn-salvar" onClick={() => handleAplicarTemplate(t.id_escala_template)}>
                      Aplicar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={() => setShowTemplates(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistorico && eventoSelecionado && (
        <ModalHistorico
          titulo={eventoSelecionado.titulo}
          itens={historico}
          onClose={() => setShowHistorico(false)}
          podeDesfazer={podeDesfazer && isAdmin}
          onDesfazer={
            isAdmin
              ? async () => {
                  await desfazer(eventoSelecionado.id_escala_evento);
                  setShowHistorico(false);
                  fetchEventos();
                }
              : undefined
          }
        />
      )}

      {conflitos && (
        <ModalConflitos
          conflitos={conflitos}
          onClose={() => {
            setConflitos(null);
            setMoverPendente(null);
          }}
          permitirForcar={podeEditar && !!moverPendente}
          onConfirmarMesmoAssim={handleForcarMovimento}
        />
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
        <Toast message={toast} onClose={() => setToast(null)} variant={toastVariant} />
      )}

      <Footer />
    </div>
  );
};

export default EscalaUser;
