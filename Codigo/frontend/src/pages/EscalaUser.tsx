import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../style/EscalaUser.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import InputModal from "../components/ui/InputModal";
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
  UsuarioParaEscalar,
} from "../services/escalaService";
import ministerioService from "../services/ministerioService";
import usuarioService from "../services/usuarioService";
import AtribuicaoDetalhesForm from "../components/AtribuicaoDetalhesForm";
import EscalaVisaoSeletor, { EscalaVisaoTipo } from "../components/escala/EscalaVisaoSeletor";
import EscalaRelatorio from "../components/escala/EscalaRelatorio";
import { EscalaVisaoSemana, EscalaVisaoAnoPainel, EscalaVisaoMesUnificada, EscalaVisaoMesCalendario } from "../components/escala/EscalaVisoes";
import EscalaGradeDnd from "../components/escala/EscalaGradeDnd";
import EscalaQuadroUnificado from "../components/escala/EscalaQuadroUnificado";
import ModalConflitos from "../components/escala/ModalConflitos";
import ModalBuscaPessoa from "../components/escala/ModalBuscaPessoa";
import ModalHistorico from "../components/escala/ModalHistorico";
import EscalaTemplatesModal from "../components/escala/EscalaTemplatesModal";
import { useEscalaUndo } from "../hooks/useEscalaUndo";
import { getErrorMessage } from "../utils/errorUtils";
import { mapaParalelismoDeMinisterios } from "../utils/ministerioParalelismo";
import type { Ministerio } from "../services/ministerioService";
import ModalEvento, { type FormEvento } from "../components/escala/ModalEvento";
import { useAcao } from "../hooks/useAcao";
import BotaoCarregando from "../components/ui/BotaoCarregando";

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
  // Progresso das ações (spinner + sem envio duplo)
  const acaoEvento = useAcao();
  const acaoPublicar = useAcao();
  const acaoCopiar = useAcao();
  const acaoAtribuicao = useAcao();
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
  const [usuarios, setUsuarios] = useState<UsuarioParaEscalar[]>([]);
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
  const [inputDialog, setInputDialog] = useState<
    | { kind: "copiar-dia"; defaultValue: string }
    | { kind: "copiar-semana"; defaultValue: string }
    | null
  >(null);
  const [templatesStartComEvento, setTemplatesStartComEvento] = useState(false);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [formEvento, setFormEvento] = useState<FormEvento>({
    titulo: "",
    data_hora: "",
    data_hora_fim: "",
    descricao: "",
    ativo: true,
    id_ministerios: [],
  });
  const [editandoEventoId, setEditandoEventoId] = useState<number | null>(null);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);
  const [formDetalhes, setFormDetalhes] = useState<Record<string, string>>({});
  const [atribuicaoEditando, setAtribuicaoEditando] = useState<EscalaAtribuicao | null>(null);
  const [conflitos, setConflitos] = useState<EscalaConflito[] | null>(null);
  // Ação a repetir quando o líder confirma uma exceção ("adicionar/mover mesmo assim")
  const [acaoConfirmar, setAcaoConfirmar] = useState<(() => Promise<void>) | null>(null);
  const [templates, setTemplates] = useState<EscalaTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [historico, setHistorico] = useState<EscalaHistoricoItem[]>([]);

  const showToast = useCallback((msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  }, []);

  const paralelismoMapa = useMemo(
    () => mapaParalelismoDeMinisterios(ministerios),
    [ministerios]
  );

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
        const data = await escalaService.getVisualizacaoMes(ano, mes, "compacto");
        setVisaoMesUnificada(data);
        setVisaoAno(null);
      } else if (visao === "mes_detalhado") {
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
        const atualizado = await escalaService.updateEvento(editandoEventoId, payload);
        const avisos = (atualizado as { avisos?: { mensagem: string }[] }).avisos || [];
        if (avisos.length) {
          showToast(
            `Evento atualizado. Atenção: ${avisos.map((a) => a.mensagem).join(" ")}`,
            "info"
          );
        } else {
          showToast("Evento atualizado", "success");
        }
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

  /** Mostra os conflitos; se forem confirmáveis, guarda a ação para "continuar mesmo assim" */
  const abrirConflitos = (
    lista: EscalaConflito[],
    repetirConfirmando: (() => Promise<void>) | null
  ) => {
    setConflitos(lista);
    setAcaoConfirmar(() => repetirConfirmando);
  };

  const fecharConflitos = () => {
    setConflitos(null);
    setAcaoConfirmar(null);
  };

  const dadosDoErro = (err: unknown) =>
    (err as { response?: { data?: { conflitos?: EscalaConflito[]; confirmavel?: boolean } } })
      ?.response?.data;

  const adicionarAtribuicao = async (confirmar: boolean) => {
    const idEvento = areaParaAtribuir?.id_escala_evento || eventoSelecionado?.id_escala_evento;
    if (!areaParaAtribuir || !usuarioSelecionado || !idEvento) return;
    const detalhesObj: Record<string, string | null> = {};
    Object.entries(formDetalhes).forEach(([k, v]) => {
      detalhesObj[k] = v?.trim() || null;
    });
    const repetir = () => adicionarAtribuicao(true);
    try {
      if (!confirmar) {
        const validacao = await escalaService.validarAtribuicao(idEvento, {
          id_escala_area: areaParaAtribuir.id_escala_area,
          id_usuario: usuarioSelecionado,
          detalhes: detalhesObj,
        });
        if (!validacao.sucesso) {
          abrirConflitos(validacao.conflitos, validacao.confirmavel ? repetir : null);
          return;
        }
      }
      await escalaService.addAtribuicao(
        areaParaAtribuir.id_escala_area,
        usuarioSelecionado,
        detalhesObj,
        confirmar
      );
      fecharConflitos();
      showToast("Pessoa escalada com sucesso", "success");
      marcarAlteracao();
      fecharModalAtribuicao();
      fetchEventos();
      if (eventoSelecionado?.id_escala_evento === idEvento) {
        const ev = await escalaService.getEventoCompleto(idEvento);
        setEventoSelecionado(ev);
      }
    } catch (err) {
      const data = dadosDoErro(err);
      if (data?.conflitos?.length) {
        abrirConflitos(data.conflitos, data.confirmavel && !confirmar ? repetir : null);
        return;
      }
      showToast(
        getErrorMessage(err, "Não foi possível escalar. Verifique conflitos de horário."),
        "error"
      );
    }
  };

  const handleAdicionarAtribuicao = () => adicionarAtribuicao(false);

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

  const salvarDetalhes = async (confirmar: boolean) => {
    if (!atribuicaoEditando) return;
    try {
      const detalhesObj: Record<string, string | null> = {};
      Object.entries(formDetalhes).forEach(([k, v]) => {
        detalhesObj[k] = v?.trim() || null;
      });
      await escalaService.updateAtribuicao(
        atribuicaoEditando.id_escala_atribuicao,
        detalhesObj,
        confirmar
      );
      fecharConflitos();
      showToast("Informações atualizadas", "success");
      marcarAlteracao();
      fecharModalEditarDetalhes();
      fetchEventos();
      if (eventoSelecionado) {
        const ev = await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento);
        setEventoSelecionado(ev);
      }
    } catch (err) {
      const data = dadosDoErro(err);
      if (data?.conflitos?.length) {
        abrirConflitos(
          data.conflitos,
          data.confirmavel && !confirmar ? () => salvarDetalhes(true) : null
        );
        return;
      }
      showToast(getErrorMessage(err, "Erro ao atualizar"), "error");
    }
  };

  const handleSalvarDetalhes = () => salvarDetalhes(false);

  const executarMoverUnificado = async (payload: MoverMembroPayload) => {
    const result = await escalaService.moverMembro(payload);
    showToast(result.mensagem || "Pessoa movida", "success");
    marcarAlteracao();
    fecharConflitos();
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
    const forcar = async () => {
      try {
        await executarMoverUnificado({ ...payload, forcarMovimento: true });
      } catch (err) {
        fecharConflitos();
        showToast(getErrorMessage(err, "Não foi possível mover"), "error");
      }
    };
    try {
      const validacao = await escalaService.validarMoverMembro(payload);
      if (!validacao.podeProsseguir) {
        abrirConflitos(validacao.conflitos, validacao.confirmavel ? forcar : null);
        return;
      }
      await executarMoverUnificado(payload);
    } catch (err) {
      const data = dadosDoErro(err);
      if (data?.conflitos?.length) {
        abrirConflitos(data.conflitos, data.confirmavel ? forcar : null);
        return;
      }
      showToast(getErrorMessage(err, "Não foi possível mover — conflito na escala"), "error");
    }
  };

  const handleCopiarDia = () => {
    if (!isAdmin) return;
    setInputDialog({ kind: "copiar-dia", defaultValue: dataDia });
  };

  const executarCopiarDia = async (dest: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dest)) {
      showToast("Informe a data no formato AAAA-MM-DD", "error");
      return;
    }
    try {
      const result = await escalaService.copiarDia(dataDia, dest);
      const avisos = result.warnings?.length ? ` (${result.warnings.length} aviso(s))` : "";
      showToast(`Dia copiado para ${dest}${avisos}`, "success");
      setInputDialog(null);
      fetchEventos();
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao copiar o dia"), "error");
    }
  };

  const handleCopiarSemana = () => {
    if (!isAdmin) return;
    setInputDialog({ kind: "copiar-semana", defaultValue: dataSemana });
  };

  const executarCopiarSemana = async (dest: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dest)) {
      showToast("Informe a data no formato AAAA-MM-DD", "error");
      return;
    }
    try {
      const result = await escalaService.copiarSemana({
        data_inicio_origem: dataSemana,
        data_inicio_destino: dest,
      });
      const avisos = result.warnings?.length ? ` (${result.warnings.length} aviso(s))` : "";
      showToast(`Semana copiada${avisos}`, "success");
      setInputDialog(null);
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

  const abrirTemplates = (comEvento = false) => {
    if (!isAdmin) return;
    setTemplatesStartComEvento(Boolean(comEvento && eventoSelecionado));
    setShowTemplates(true);
  };

  const fecharTemplates = () => {
    setShowTemplates(false);
    setTemplatesStartComEvento(false);
  };

  const refreshTemplates = async () => {
    try {
      setTemplates(await escalaService.listarTemplates());
    } catch {
      setTemplates([]);
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
    if (visao === "mes" || visao === "mes_detalhado") {
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
    if (visao === "mes" || visao === "mes_detalhado") {
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
          <h1 className="page-title">Escala</h1>
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
                <button type="button" className="btn-mapa" onClick={() => abrirTemplates(false)}>
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
              <>
                <EscalaVisaoMesCalendario
                  visao={visaoMesUnificada}
                  onAbrirDia={(data) => {
                    setDataDia(data);
                    setVisao("dia");
                  }}
                  onAbrirEvento={abrirEvento}
                />
                {podeEditar && (
                  <EscalaRelatorio
                    titulo={`Relatório — ${MESES[mes - 1]} ${ano}`}
                    subtitulo="Visão geral para liderança e secretaria"
                    estatisticas={visaoMesUnificada.estatisticas}
                    onAbrirEvento={abrirEvento}
                  />
                )}
              </>
            )}

            {visao === "mes_detalhado" && visaoMesUnificada && (
              <>
                <EscalaVisaoMesUnificada
                  visao={visaoMesUnificada}
                  onAbrirDia={(data) => {
                    setDataDia(data);
                    setVisao("dia");
                  }}
                  onAbrirEvento={abrirEvento}
                  podeEditar={podeEditar}
                  paralelismoMapa={paralelismoMapa}
                  onMover={handleMoverUnificado}
                  onEscalar={abrirSlotParaEscalar}
                />
                {podeEditar && (
                  <EscalaRelatorio
                    titulo={`Relatório detalhado — ${MESES[mes - 1]} ${ano}`}
                    subtitulo="Indicadores, equilíbrio da equipe e pendências"
                    estatisticas={visaoMesUnificada.estatisticas}
                    onAbrirEvento={abrirEvento}
                  />
                )}
              </>
            )}

            {visao === "dia" && visaoDiaUnificada && (
              <>
              <EscalaQuadroUnificado
                visao={visaoDiaUnificada}
                podeEditar={podeEditar}
                paralelismoMapa={paralelismoMapa}
                onMover={handleMoverUnificado}
                onEscalar={abrirSlotParaEscalar}
                onAbrirEvento={abrirEvento}
                onCopiarDia={isAdmin ? handleCopiarDia : undefined}
                onTemplates={isAdmin ? () => abrirTemplates(false) : undefined}
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
              {podeEditar && (
                <EscalaRelatorio
                  titulo={`Relatório do dia`}
                  subtitulo={new Date(`${dataDia}T12:00:00`).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                  estatisticas={visaoDiaUnificada.estatisticas}
                  onAbrirEvento={abrirEvento}
                />
              )}
              </>
            )}
            {visao === "semana" && visaoSemanaUnificada && (
              <>
              <EscalaVisaoSemana
                visao={visaoSemanaUnificada}
                onAbrirEvento={abrirEvento}
                onAbrirDia={(data) => {
                  setDataDia(data);
                  setVisao("dia");
                }}
                podeEditar={podeEditar}
                paralelismoMapa={paralelismoMapa}
                onMover={handleMoverUnificado}
                onEscalar={abrirSlotParaEscalar}
                onCopiarSemana={isAdmin ? handleCopiarSemana : undefined}
              />
              {podeEditar && (
                <EscalaRelatorio
                  titulo="Relatório da semana"
                  subtitulo={`De ${new Date(`${visaoSemanaUnificada.dataInicio}T12:00:00`).toLocaleDateString("pt-BR")} a ${new Date(`${visaoSemanaUnificada.dataFim}T12:00:00`).toLocaleDateString("pt-BR")}`}
                  estatisticas={visaoSemanaUnificada.estatisticas}
                  onAbrirEvento={abrirEvento}
                />
              )}
              </>
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
                <div className="escala-dashboard-actions-main">
                  <button type="button" className="btn-editar-evento" onClick={abrirHistorico}>
                    Histórico
                  </button>
                  {isAdmin && (
                    <>
                      <BotaoCarregando type="button" className="btn-editar-evento" onClick={() => acaoPublicar.executar(handlePublicar)} carregando={acaoPublicar.executando} textoCarregando="Publicando…">
                        Publicar
                      </BotaoCarregando>
                      <BotaoCarregando type="button" className="btn-editar-evento" onClick={() => acaoCopiar.executar(handleCopiarEvento)} carregando={acaoCopiar.executando} textoCarregando="Copiando…">
                        Copiar (+7 dias)
                      </BotaoCarregando>
                      <button type="button" className="btn-editar-evento" onClick={() => abrirTemplates(true)}>
                        Salvar como template
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
                    </>
                  )}
                </div>
                {isAdmin && (
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
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showModalEvento && (
        <ModalEvento
          formEvento={formEvento}
          setFormEvento={setFormEvento}
          ministerios={ministerios}
          editandoEventoId={editandoEventoId}
          onFechar={fecharModalEvento}
          onSalvar={(e) => {
            e.preventDefault();
            acaoEvento.executar(() => handleSalvarEvento(e));
          }}
          salvando={acaoEvento.executando}
        />
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
                    {u.ja_escalado
                      ? ` — já escalado(a)${
                          u.areas_no_evento?.length ? ` em ${u.areas_no_evento.join(", ")}` : ""
                        }`
                      : ""}
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
              <BotaoCarregando
                type="button"
                className="btn-salvar"
                onClick={() => acaoAtribuicao.executar(handleAdicionarAtribuicao)}
                disabled={!usuarioSelecionado}
                carregando={acaoAtribuicao.executando}
                textoCarregando="Adicionando…"
              >
                Adicionar
              </BotaoCarregando>
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
              <BotaoCarregando type="button" className="btn-salvar" onClick={() => acaoAtribuicao.executar(handleSalvarDetalhes)} carregando={acaoAtribuicao.executando}>
                Salvar
              </BotaoCarregando>
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

      <EscalaTemplatesModal
        open={showTemplates}
        templates={templates}
        ministerios={ministerios}
        usuarios={usuarios}
        eventoAberto={eventoSelecionado}
        startComEvento={templatesStartComEvento}
        onClose={fecharTemplates}
        onToast={showToast}
        onChanged={refreshTemplates}
        onAplicado={(id) => {
          fetchEventos();
          abrirEvento(id);
        }}
      />

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
          onClose={fecharConflitos}
          permitirForcar={podeEditar && !!acaoConfirmar}
          onConfirmarMesmoAssim={() => {
            if (acaoConfirmar) acaoAtribuicao.executar(acaoConfirmar);
          }}
          processando={acaoAtribuicao.executando}
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
        textoCarregando="Excluindo…"
        onCancel={() => {
          setShowConfirmExcluir(false);
          setEventoToExcluir(null);
        }}
      />

      <InputModal
        open={inputDialog?.kind === "copiar-dia"}
        title="Copiar dia"
        label="Data de destino"
        inputType="date"
        defaultValue={inputDialog?.kind === "copiar-dia" ? inputDialog.defaultValue : ""}
        hint="Os eventos deste dia serão copiados para a data escolhida."
        confirmLabel="Copiar"
        onConfirm={(v) => executarCopiarDia(v)}
        textoCarregando="Copiando…"
        onCancel={() => setInputDialog(null)}
      />

      <InputModal
        open={inputDialog?.kind === "copiar-semana"}
        title="Copiar semana"
        label="Início da semana de destino"
        inputType="date"
        defaultValue={inputDialog?.kind === "copiar-semana" ? inputDialog.defaultValue : ""}
        hint="Informe o primeiro dia (domingo ou início) da semana destino."
        confirmLabel="Copiar"
        onConfirm={(v) => executarCopiarSemana(v)}
        textoCarregando="Copiando…"
        onCancel={() => setInputDialog(null)}
      />

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} variant={toastVariant} />
      )}

      <Footer />
    </div>
  );
};

export default EscalaUser;
