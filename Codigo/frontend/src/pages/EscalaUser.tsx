import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../style/EscalaUser.css";
import "../style/EscalaNova.css";
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
import { EscalaVisaoSemana, EscalaVisaoAnoPainel, EscalaVisaoMesCalendario } from "../components/escala/EscalaVisoes";
import EscalaAgenda from "../components/escala/EscalaAgenda";
import MinhasEscalas from "../components/escala/MinhasEscalas";
import MenuAcoes from "../components/escala/MenuAcoes";
import FocusTrap from "../components/ui/FocusTrap";
import EscalaGradeDnd from "../components/escala/EscalaGradeDnd";
import EscalaQuadroUnificado from "../components/escala/EscalaQuadroUnificado";
import ModalConflitos from "../components/escala/ModalConflitos";
import ModalBuscaPessoa from "../components/escala/ModalBuscaPessoa";
import ModalHistorico from "../components/escala/ModalHistorico";
import EscalaTemplatesModal from "../components/escala/EscalaTemplatesModal";
import { useEscalaUndo } from "../hooks/useEscalaUndo";
import { getErrorMessage } from "../utils/errorUtils";
import { resumirAvisosCopia } from "../utils/avisosEscala";
import {
  toIsoDate,
  inicioSemana,
  referenciaDe,
  dataDoMes,
  somarDias,
  deIso,
  tituloSemana,
  tituloDia,
  rotuloStatus,
  plural,
} from "../utils/escalaDatas";
import { mapaParalelismoDeMinisterios } from "../utils/ministerioParalelismo";
import type { Ministerio } from "../services/ministerioService";
import ModalEvento, { type FormEvento } from "../components/escala/ModalEvento";
import { useAcao } from "../hooks/useAcao";
import BotaoCarregando from "../components/ui/BotaoCarregando";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Máximo de semanas carregadas de uma vez na visão Semana */
const MAX_SEMANAS = 12;

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "8 nov – 5 dez 2026" */
function tituloIntervalo(ini: string, fim: string) {
  const a = new Date(`${ini}T12:00:00`);
  const b = new Date(`${fim}T12:00:00`);
  const anoA = a.getFullYear() !== b.getFullYear() ? ` ${a.getFullYear()}` : "";
  return `${a.getDate()} ${MESES_CURTOS[a.getMonth()]}${anoA} – ${b.getDate()} ${MESES_CURTOS[b.getMonth()]} ${b.getFullYear()}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
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

/** Ministérios escolhidos no "Meus ministérios" (por pessoa, neste navegador) */
function lerFiltroSalvo(chave: string): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(v) ? v.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
  } catch {
    return [];
  }
}

/**
 * Escala. modo "meus": cronograma só dos ministérios que a pessoa lidera (ela escolhe um ou mais),
 * para se organizar sem a escala da igreja inteira.
 */
const EscalaUser: React.FC<{ modo?: "geral" | "meus" }> = ({ modo = "geral" }) => {
  const modoMeus = modo === "meus";
  // Progresso das ações (spinner + sem envio duplo)
  const acaoEvento = useAcao();
  const acaoPublicar = useAcao();
  const acaoCopiar = useAcao();
  const acaoAtribuicao = useAcao();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isLiderMinisterio, user } = useAuth();
  const podeEditar = isAdmin || isLiderMinisterio;

  // Visão lembrada neste navegador; no celular começa pela Agenda (lista), no computador pelo Mês
  const [visao, setVisaoEstado] = useState<EscalaVisaoTipo>(() => {
    try {
      const v = localStorage.getItem("escala_visao");
      if (v === "agenda" || v === "semana" || v === "mes") return v;
    } catch {
      /* sem armazenamento */
    }
    return typeof window !== "undefined" && window.innerWidth < 720 ? "agenda" : "mes";
  });
  const setVisao = useCallback((v: EscalaVisaoTipo) => {
    setVisaoEstado(v);
    if (v === "agenda" || v === "semana" || v === "mes") {
      try {
        localStorage.setItem("escala_visao", v);
      } catch {
        /* sem armazenamento */
      }
    }
  }, []);
  // Abas: "Minhas escalas" (padrão para quem só serve) e "Calendário" (padrão para a liderança)
  const [searchParams] = useSearchParams();
  const verParam = searchParams.get("ver");
  const aba: "minhas" | "calendario" = modoMeus
    ? "calendario"
    : verParam === "minhas" || verParam === "calendario"
      ? verParam
      : podeEditar
        ? "calendario"
        : "minhas";
  const mostrarCalendario = aba === "calendario";
  const [showRelatorio, setShowRelatorio] = useState(false);
  // Esc fecha o painel do relatório (fora do focus-trap: o onDeactivate dele dispara no remount do StrictMode)
  useEffect(() => {
    if (!showRelatorio) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setShowRelatorio(false);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [showRelatorio]);
  const [visaoAno, setVisaoAno] = useState<VisaoAno | null>(null);
  const [visaoDiaUnificada, setVisaoDiaUnificada] = useState<VisualizacaoDia | null>(null);
  const [visaoSemanas, setVisaoSemanas] = useState<VisualizacaoSemana[] | null>(null);
  // Visão Semana: intervalo de semanas (padrão 4), escolhido por data
  const [qtdSemanas, setQtdSemanas] = useState(4);
  const [semanaOrigemCopia, setSemanaOrigemCopia] = useState<string | null>(null);
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

  // ----- "Meus ministérios" -----
  const [ministeriosCarregados, setMinisteriosCarregados] = useState(false);
  const ministeriosLiderados = useMemo(
    () =>
      ministerios
        .filter((m) => m.ativo)
        .filter((m) => isAdmin || (m.lideres || []).some((l) => l.id_usuario === user?.id_usuario)),
    [ministerios, isAdmin, user?.id_usuario]
  );
  const chaveFiltro = `escala_meus_ministerios_${user?.id_usuario ?? 0}`;
  const [filtroSalvo, setFiltroSalvo] = useState<number[]>(() => lerFiltroSalvo(chaveFiltro));
  // Só vale o que a pessoa ainda lidera; nada escolhido = todos os que lidera
  const idsFiltro = useMemo(() => {
    if (!modoMeus) return undefined;
    const meus = ministeriosLiderados.map((m) => m.id_ministerio);
    const validos = filtroSalvo.filter((id) => meus.includes(id));
    return validos.length ? validos : meus;
  }, [modoMeus, ministeriosLiderados, filtroSalvo]);
  const filtroKey = (idsFiltro || []).join(",");

  const alternarMinisterio = (id: number) => {
    const atuais = idsFiltro || [];
    const proximo = atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id];
    if (!proximo.length) return; // pelo menos um ministério fica selecionado
    setFiltroSalvo(proximo);
    try {
      localStorage.setItem(chaveFiltro, JSON.stringify(proximo));
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  };
  const selecionarTodosMeus = () => {
    setFiltroSalvo([]);
    try {
      localStorage.removeItem(chaveFiltro);
    } catch {
      /* ignore */
    }
  };

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
  }, [visao, ano, mes, dataDia, dataSemana, qtdSemanas]);

  const fetchEventos = useCallback(async () => {
    // "Meus ministérios": não mostra a igreja inteira enquanto os ministérios carregam
    if (modoMeus && !ministeriosCarregados) return;
    // Na aba "Minhas escalas" o calendário não é carregado
    if (!mostrarCalendario) {
      setLoading(false);
      return;
    }
    const filtro = idsFiltro;
    // Sem nenhum ministério liderado: não busca (sem filtro viria a escala inteira)
    if (modoMeus && !filtro?.length) {
      setLoading(false);
      return;
    }
    try {
      if (!conteudoCarregadoRef.current) setLoading(true);
      if (visao === "mes") {
        const data = await escalaService.getVisualizacaoMes(ano, mes, "compacto", filtro);
        setVisaoMesUnificada(data);
        setVisaoAno(null);
      } else if (visao === "agenda") {
        const data = await escalaService.getVisualizacaoMes(ano, mes, "completo", filtro);
        setVisaoMesUnificada(data);
        setVisaoAno(null);
      } else if (visao === "dia") {
        const data = await escalaService.getVisualizacaoDia(dataDia, filtro);
        setVisaoDiaUnificada(data);
      } else if (visao === "semana") {
        const inicios = Array.from({ length: qtdSemanas }, (_, i) => somarDias(dataSemana, 7 * i));
        const data = await Promise.all(inicios.map((d) => escalaService.getVisualizacaoSemana(d, filtro)));
        setVisaoSemanas(data);
      } else if (visao === "ano") {
        const data = await escalaService.getVisaoAno(ano, filtro);
        setVisaoAno(data);
      }
      conteudoCarregadoRef.current = true;
    } catch {
      showToast("Erro ao carregar eventos", "error");
    } finally {
      setLoading(false);
    }
    // filtroKey: refaz a busca quando a seleção de ministérios muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes, visao, dataDia, dataSemana, qtdSemanas, showToast, modoMeus, ministeriosCarregados, filtroKey, mostrarCalendario]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  useEffect(() => {
    if (podeEditar) {
      ministerioService
        .getAll()
        .then(setMinisterios)
        .catch(() => setMinisterios([]))
        .finally(() => setMinisteriosCarregados(true));
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

  // Remover pede confirmação: em escala publicada a pessoa é avisada na hora
  const [aRemover, setARemover] = useState<{ att: EscalaAtribuicao; nome: string; publicada: boolean } | null>(null);

  const handleRemoverAtribuicao = (a: EscalaAtribuicao, nome?: string) => {
    setARemover({
      att: a,
      nome: nome || a.usuario_nome || "esta pessoa",
      publicada: eventoSelecionado?.status === "publicada",
    });
  };

  const executarRemocao = async (a: EscalaAtribuicao) => {
    try {
      await escalaService.removeAtribuicao(a.id_escala_atribuicao);
      showToast("Removido da escala", "success");
      marcarAlteracao();
      fetchEventos();
      if (eventoSelecionado) {
        const ev = await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento);
        setEventoSelecionado(ev);
      }
    } catch (err) {
      showToast(getErrorMessage(err, "Não foi possível remover da escala"), "error");
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
      const avisos = resumirAvisosCopia(result.warnings);
      showToast(`Dia copiado para ${dest}.${avisos ? ` ${avisos}` : ""}`, avisos ? "info" : "success");
      setInputDialog(null);
      fetchEventos();
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao copiar o dia"), "error");
    }
  };

  const handleCopiarSemana = (dataInicio: string) => {
    if (!isAdmin) return;
    setSemanaOrigemCopia(dataInicio);
    setInputDialog({ kind: "copiar-semana", defaultValue: somarDias(dataInicio, 7) });
  };

  const executarCopiarSemana = async (dest: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dest)) {
      showToast("Informe a data no formato AAAA-MM-DD", "error");
      return;
    }
    try {
      const result = await escalaService.copiarSemana({
        data_inicio_origem: semanaOrigemCopia || dataSemana,
        data_inicio_destino: dest,
      });
      const avisos = resumirAvisosCopia(result.warnings);
      showToast(`Semana copiada.${avisos ? ` ${avisos}` : ""}`, avisos ? "info" : "success");
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
    if (visaoSemanas) coletar(visaoSemanas.flatMap((s) => s.dias.flatMap((d) => d.eventos)));
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
      const avisos = resumirAvisosCopia(result.warnings);
      showToast(`Evento copiado para +7 dias (como rascunho).${avisos ? ` ${avisos}` : ""}`, avisos ? "info" : "success");
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

  const abrirBuscaPessoa = async () => {
    try {
      const list = await usuarioService.getAll();
      setUsuariosBusca(list.map((u) => ({ id_usuario: u.id_usuario, nome: u.nome })));
    } catch {
      setUsuariosBusca(pessoasDaVisaoAtual());
    }
    setShowBuscaPessoa(true);
  };

  const estatisticasAtuais =
    visao === "semana"
      ? visaoSemanas?.length === 1
        ? visaoSemanas[0].estatisticas
        : undefined
      : visao === "dia"
        ? visaoDiaUnificada?.estatisticas
        : visao === "ano"
          ? undefined
          : visaoMesUnificada?.estatisticas;
  const tituloRelatorio =
    visao === "semana"
      ? `Semana de ${tituloSemana(dataSemana)}`
      : visao === "dia"
        ? tituloDia(dataDia)
        : `${MESES[mes - 1]} ${ano}`;

  const navLabel =
    visao === "dia"
      ? tituloDia(dataDia)
      : visao === "semana"
        ? qtdSemanas === 1
          ? tituloSemana(dataSemana)
          : tituloIntervalo(dataSemana, somarDias(dataSemana, 7 * qtdSemanas - 1))
        : visao === "ano"
          ? String(ano)
          : `${MESES[mes - 1]} ${ano}`;

  /**
   * Vai para uma data e mantém TODAS as visões no mesmo período
   * (antes cada visão guardava a sua data: avançar a semana e trocar para Mês voltava ao mês antigo).
   */
  const irPara = useCallback((data: string) => {
    const ref = referenciaDe(data);
    setAno(ref.ano);
    setMes(ref.mes);
    setDataDia(ref.dataDia);
    setDataSemana(ref.dataSemana);
  }, []);

  const navegar = (passo: 1 | -1) => {
    if (visao === "mes" || visao === "agenda") {
      const alvo = new Date(ano, mes - 1 + passo, 1);
      irPara(dataDoMes(alvo.getFullYear(), alvo.getMonth() + 1));
    } else if (visao === "dia") {
      irPara(somarDias(dataDia, passo));
    } else if (visao === "semana") {
      irPara(somarDias(dataSemana, 7 * qtdSemanas * passo));
    } else {
      irPara(dataDoMes(ano + passo, mes));
    }
  };
  const navegarAnterior = () => navegar(-1);
  const navegarProximo = () => navegar(1);

  /** Abre um dia específico na visão Dia (a partir do mês ou da semana) */
  const abrirDia = (data: string) => {
    irPara(data);
    setVisao("dia");
  };

  return (
    <div className="page-with-fixed-header escala-page">
      <Header />
      <main id="main-content" className="container escala-user" tabIndex={-1}>
        <header className="esc-topo">
          <div className="esc-topo__titulo">
            <h1 className="page-title">{modoMeus ? "Meus ministérios" : "Escala"}</h1>
            <p className="esc-topo__sub">
              {modoMeus
                ? "Só os ministérios que você lidera, para organizar a sua equipe."
                : aba === "minhas"
                  ? "Quando, onde e com quem você vai servir."
                  : "Todos os eventos e equipes da igreja."}
            </p>
          </div>
          <nav className="esc-abas" aria-label="Seções da escala">
            <Link
              to="/usuario/escala?ver=minhas"
              className={`esc-aba${!modoMeus && aba === "minhas" ? " ativo" : ""}`}
              aria-current={!modoMeus && aba === "minhas" ? "page" : undefined}
            >
              Minhas escalas
            </Link>
            <Link
              to="/usuario/escala?ver=calendario"
              className={`esc-aba${!modoMeus && aba === "calendario" ? " ativo" : ""}`}
              aria-current={!modoMeus && aba === "calendario" ? "page" : undefined}
            >
              Calendário
            </Link>
            {podeEditar && (
              <Link
                to="/usuario/escala/meus-ministerios"
                className={`esc-aba${modoMeus ? " ativo" : ""}`}
                aria-current={modoMeus ? "page" : undefined}
              >
                Meus ministérios
              </Link>
            )}
          </nav>
        </header>

        {aba === "minhas" && (
          <MinhasEscalas
            idUsuario={user?.id_usuario}
            onAbrirEvento={abrirEvento}
            onVerCalendario={() => navigate("/usuario/escala?ver=calendario")}
          />
        )}

        {mostrarCalendario && (
          <>
            <div className="esc-ferramentas">
              <div className="esc-periodo">
                <button type="button" className="esc-icone" onClick={navegarAnterior} aria-label="Período anterior">
                  ‹
                </button>
                <h2 className="esc-periodo__titulo" aria-live="polite">
                  {navLabel}
                </h2>
                <button type="button" className="esc-icone" onClick={navegarProximo} aria-label="Próximo período">
                  ›
                </button>
                <button
                  type="button"
                  className="esc-btn esc-btn--fantasma esc-hoje"
                  onClick={() => irPara(toIsoDate(new Date()))}
                >
                  Hoje
                </button>
              </div>

              <EscalaVisaoSeletor visao={visao} onChange={setVisao} />

              <div className="esc-acoes">
                <MenuAcoes
                  itens={[
                    ...(podeEditar && estatisticasAtuais
                      ? [{ rotulo: "Relatório do período", onSelecionar: () => setShowRelatorio(true) }]
                      : []),
                    { rotulo: "Buscar pessoa", onSelecionar: abrirBuscaPessoa },
                    { rotulo: "Visão do ano", onSelecionar: () => setVisao("ano") },
                    { rotulo: "Mapa da escala", onSelecionar: () => navigate("/usuario/escala/mapa") },
                    ...(isAdmin
                      ? [{ rotulo: "Templates de evento", onSelecionar: () => abrirTemplates(false), separar: true }]
                      : []),
                  ]}
                />
                {isAdmin && (
                  <button
                    type="button"
                    className="esc-btn esc-btn--primario"
                    onClick={() => abrirModalEvento()}
                    aria-label="Novo evento"
                  >
                    + <span className="esc-so-largo">Novo </span>evento
                  </button>
                )}
              </div>
            </div>

            {visao === "semana" && (
              <div className="esc-intervalo" role="group" aria-label="Intervalo de semanas">
                <label>
                  De
                  <input
                    type="date"
                    value={dataSemana}
                    onChange={(e) => e.target.value && irPara(inicioSemana(e.target.value))}
                  />
                </label>
                <label>
                  Até
                  <input
                    type="date"
                    value={somarDias(dataSemana, 7 * qtdSemanas - 1)}
                    min={dataSemana}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const dias = (deIso(inicioSemana(e.target.value)).getTime() - deIso(dataSemana).getTime()) / 86400000;
                      setQtdSemanas(Math.min(MAX_SEMANAS, Math.max(1, Math.round(dias / 7) + 1)));
                    }}
                  />
                </label>
                <div className="esc-intervalo__atalhos" aria-label="Atalhos">
                  {[1, 4, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`esc-btn esc-btn--fantasma${qtdSemanas === n ? " ativo" : ""}`}
                      aria-pressed={qtdSemanas === n}
                      onClick={() => setQtdSemanas(n)}
                    >
                      {n === 1 ? "1 semana" : `${n} semanas`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {modoMeus && (
              <section className="filtro-ministerios" aria-label="Ministérios do cronograma">
                {ministeriosCarregados && ministeriosLiderados.length === 0 ? (
                  <p className="filtro-ministerios__vazio">
                    Você ainda não lidera nenhum ministério. Peça à administração para vincular você como líder.
                  </p>
                ) : (
                  <>
                    <span className="filtro-ministerios__rotulo">Mostrando:</span>
                    <div className="filtro-ministerios__lista">
                      {ministeriosLiderados.map((m) => {
                        const ativo = (idsFiltro || []).includes(m.id_ministerio);
                        return (
                          <button
                            key={m.id_ministerio}
                            type="button"
                            className={`filtro-ministerio${ativo ? " ativo" : ""}`}
                            aria-pressed={ativo}
                            onClick={() => alternarMinisterio(m.id_ministerio)}
                            title={
                              ativo && (idsFiltro || []).length === 1
                                ? "Pelo menos um ministério fica selecionado"
                                : undefined
                            }
                          >
                            {ativo ? "✓ " : ""}
                            {m.nome}
                          </button>
                        );
                      })}
                      {ministeriosLiderados.length > 1 &&
                        (idsFiltro || []).length < ministeriosLiderados.length && (
                          <button type="button" className="filtro-ministerio-todos" onClick={selecionarTodosMeus}>
                            Selecionar todos
                          </button>
                        )}
                    </div>
                  </>
                )}
              </section>
            )}

            {loading ? (
              <div className="esc-carregando" aria-busy="true" aria-label="Carregando a escala">
                <span />
                <span />
                <span />
              </div>
            ) : (
              <div className="escala-layout">
                {visao === "mes" && visaoMesUnificada && (
                  <EscalaVisaoMesCalendario
                    visao={visaoMesUnificada}
                    onAbrirDia={abrirDia}
                    onAbrirEvento={abrirEvento}
                  />
                )}

                {visao === "agenda" && visaoMesUnificada && (
                  <EscalaAgenda
                    visao={visaoMesUnificada}
                    onAbrirDia={abrirDia}
                    onAbrirEvento={abrirEvento}
                    podeEditar={podeEditar}
                  />
                )}

                {visao === "dia" && visaoDiaUnificada && (
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
                      handleRemoverAtribuicao(
                        {
                          id_escala_atribuicao: m.membroEscalaId,
                          id_escala_area: m.id_escala_area,
                          id_usuario: m.usuario.id,
                        },
                        m.usuario.nome
                      )
                    }
                  />
                )}

                {visao === "semana" && visaoSemanas && (
                  <EscalaVisaoSemana
                    semanas={visaoSemanas}
                    onAbrirEvento={abrirEvento}
                    onAbrirDia={abrirDia}
                    podeEditar={podeEditar}
                    paralelismoMapa={paralelismoMapa}
                    onMover={handleMoverUnificado}
                    onEscalar={abrirSlotParaEscalar}
                    onCopiarSemana={isAdmin ? handleCopiarSemana : undefined}
                    onAviso={(msg) => showToast(msg, "info")}
                  />
                )}

                {visao === "ano" && visaoAno && (
                  <EscalaVisaoAnoPainel
                    visao={visaoAno}
                    onSelecionarMes={(m) => {
                      irPara(dataDoMes(ano, m));
                      setVisao("mes");
                    }}
                    onAbrirEvento={abrirEvento}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showRelatorio && estatisticasAtuais && (
        <div className="esc-gaveta-raiz">
          <button
            type="button"
            className="esc-gaveta-fundo"
            aria-label="Fechar relatório"
            tabIndex={-1}
            onClick={() => setShowRelatorio(false)}
          />
          <FocusTrap
            focusTrapOptions={{
              allowOutsideClick: true,
              escapeDeactivates: false,
              fallbackFocus: ".esc-gaveta",
            }}
          >
            <aside className="esc-gaveta" role="dialog" aria-modal="true" aria-label="Relatório da escala" tabIndex={-1}>
              <EscalaRelatorio
                titulo={tituloRelatorio}
                subtitulo={modoMeus ? "Só os ministérios selecionados" : "Visão geral para liderança e secretaria"}
                estatisticas={estatisticasAtuais}
                onFechar={() => setShowRelatorio(false)}
                onAbrirEvento={(id) => {
                  setShowRelatorio(false);
                  abrirEvento(id);
                }}
              />
            </aside>
          </FocusTrap>
        </div>
      )}

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
                    {rotuloStatus(eventoSelecionado.status)}
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

            <p className="esc-modal-meta">
              {plural(
                eventoSelecionado.areas?.reduce((acc, ar) => acc + (ar.atribuicoes?.length ?? 0), 0) ?? 0,
                "pessoa escalada",
                "pessoas escaladas"
              )}{" "}
              · {plural(eventoSelecionado.areas?.length ?? 0, "área")}
            </p>

            <div className="escala-dashboard-titulo-secao">
              <span>Equipe</span>
              {podeEditar && <small>Arraste uma pessoa para trocar de área</small>}
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
              <footer className="esc-modal-rodape">
                {isAdmin ? (
                  <MenuAcoes
                    rotulo="Mais ações"
                    alinhar="esquerda"
                    acima
                    itens={[
                      { rotulo: "Histórico de alterações", onSelecionar: abrirHistorico },
                      {
                        rotulo: "Copiar para a semana seguinte",
                        onSelecionar: () => acaoCopiar.executar(handleCopiarEvento),
                        desativado: acaoCopiar.executando,
                      },
                      { rotulo: "Salvar como template", onSelecionar: () => abrirTemplates(true) },
                      {
                        rotulo: "Desfazer última alteração",
                        onSelecionar: () => desfazer(eventoSelecionado.id_escala_evento),
                        desativado: !podeDesfazer,
                      },
                      {
                        rotulo: "Excluir evento",
                        perigo: true,
                        separar: true,
                        onSelecionar: () => {
                          setEventoToExcluir(eventoSelecionado.id_escala_evento);
                          setShowConfirmExcluir(true);
                        },
                      },
                    ]}
                  />
                ) : (
                  <button type="button" className="esc-btn esc-btn--fantasma" onClick={abrirHistorico}>
                    Histórico
                  </button>
                )}
                {isAdmin && (
                  <div className="esc-modal-rodape__direita">
                    <button
                      type="button"
                      className="esc-btn"
                      onClick={() => {
                        fecharEvento();
                        abrirModalEvento(eventoSelecionado);
                      }}
                    >
                      Editar evento
                    </button>
                    {eventoSelecionado.status === "rascunho" && (
                      <BotaoCarregando
                        type="button"
                        className="esc-btn esc-btn--primario"
                        onClick={() => acaoPublicar.executar(handlePublicar)}
                        carregando={acaoPublicar.executando}
                        textoCarregando="Publicando…"
                      >
                        Publicar
                      </BotaoCarregando>
                    )}
                  </div>
                )}
              </footer>
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
        open={!!aRemover}
        title={`Remover ${aRemover?.nome ?? ""} da escala?`}
        message={
          aRemover?.publicada
            ? "A escala já está publicada: a pessoa será avisada da remoção."
            : "A escala ainda é rascunho: ninguém será avisado."
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        textoCarregando="Removendo…"
        onConfirm={async () => {
          if (aRemover) await executarRemocao(aRemover.att);
          setARemover(null);
        }}
        onCancel={() => setARemover(null)}
      />

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
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toastVariant}
          // Mensagens longas (ex.: quem não foi copiado e por quê) ficam mais tempo na tela
          duration={Math.min(12000, Math.max(3000, toast.length * 60))}
        />
      )}

      <Footer />
    </div>
  );
};

export default EscalaUser;
