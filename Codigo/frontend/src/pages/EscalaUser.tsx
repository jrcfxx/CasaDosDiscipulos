import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../style/EscalaUser.css";
import "../style/EscalaNova.css";
import MolduraEscala from "../components/escala/MolduraEscala";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import escalaService, {
  EscalaEvento,
  EscalaEventoCompleto,
  EscalaArea,
  EscalaAtribuicao,
  EscalaConflito,
  EscalaHistoricoItem,
  VisualizacaoMes,
  SlotInstrumento,
  MoverMembroPayload,
  EventoUnificado,
  UsuarioParaEscalar,
  VisualizacaoPeriodo,
  EstatisticasEscala,
  SlotMembro,
} from "../services/escalaService";
import ministerioService from "../services/ministerioService";
import usuarioService from "../services/usuarioService";
import AtribuicaoDetalhesForm from "../components/AtribuicaoDetalhesForm";
import EscalaRelatorio from "../components/escala/EscalaRelatorio";
import EscalaAgenda from "../components/escala/EscalaAgenda";
import MinhasEscalas from "../components/escala/MinhasEscalas";
import MenuAcoes from "../components/escala/MenuAcoes";
import FiltroMinisterios from "../components/escala/FiltroMinisterios";
import FocusTrap from "../components/ui/FocusTrap";
import BotoesExportar from "../components/ui/BotoesExportar";
import { exportarEscala } from "../utils/exportacoes";
import { exportarPdf } from "../utils/exportarPdf";
import EscalaGradeDnd from "../components/escala/EscalaGradeDnd";
import EscalaPlanilha from "../components/escala/EscalaPlanilha";
import ModalConflitos from "../components/escala/ModalConflitos";
import ModalBuscaPessoa from "../components/escala/ModalBuscaPessoa";
import ModalHistorico from "../components/escala/ModalHistorico";
import { useEscalaUndo } from "../hooks/useEscalaUndo";
import { getErrorMessage } from "../utils/errorUtils";
import { toIsoDate, referenciaDe, dataDoMes, rotuloStatus, plural } from "../utils/escalaDatas";
import type { Ministerio } from "../services/ministerioService";
import ModalEvento, { type FormEvento } from "../components/escala/ModalEvento";
import { useAcao } from "../hooks/useAcao";
import BotaoCarregando from "../components/ui/BotaoCarregando";
import Icone from "../components/ui/Icone";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Máximo de meses na Planilha */
const MAX_MESES = 6;

type Visao = "planilha" | "agenda";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Último dia do mês (1–12), com virada de ano */
function fimDoMes(ano: number, mes: number) {
  const d = new Date(ano, mes, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatarDataHora(s: string, fim?: string | null) {
  const str = new Date(s).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!fim) return str;
  return `${str} – ${new Date(fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function lerLocal(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravarLocal(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
}

/** Filtro de ministérios guardado por pessoa: "todos" ou a lista de ids escolhidos */
function lerFiltroSalvo(chave: string): number[] | "todos" | null {
  const bruto = lerLocal(chave);
  if (bruto === "todos") return "todos";
  try {
    const v = JSON.parse(bruto || "null");
    return Array.isArray(v) ? v.map(Number).filter((n) => Number.isInteger(n) && n > 0) : null;
  } catch {
    return null;
  }
}

/**
 * Escala, em duas abas:
 *  - "Minhas escalas": quando, onde e com quem a pessoa serve;
 *  - "Escala da Casa": a Agenda dos cultos com a equipe de cada um (todos) e, para a liderança,
 *    a Planilha para montar a escala. Quem lidera ministérios abre já filtrado nos seus.
 */
const EscalaUser: React.FC = () => {
  const acaoEvento = useAcao();
  const acaoPublicar = useAcao();
  const acaoAtribuicao = useAcao();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isLiderMinisterio, user } = useAuth();
  const podeEditar = isAdmin || isLiderMinisterio;

  // ----- Abas e visão -----
  const [searchParams] = useSearchParams();
  const verParam = searchParams.get("ver");
  const aba: "minhas" | "calendario" =
    verParam === "minhas" || verParam === "calendario" ? verParam : podeEditar ? "calendario" : "minhas";
  const mostrarCalendario = aba === "calendario";

  // Quem só serve vê a Agenda; a liderança escolhe entre Planilha (montar) e Agenda (conferir)
  const [visaoEscolhida, setVisaoEscolhida] = useState<Visao>(() =>
    lerLocal("escala_visao_v3") === "agenda" ? "agenda" : "planilha"
  );
  const visao: Visao = podeEditar ? visaoEscolhida : "agenda";
  const setVisao = (v: Visao) => {
    setVisaoEscolhida(v);
    gravarLocal("escala_visao_v3", v);
  };

  // ----- Período -----
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [qtdMeses, setQtdMeses] = useState(() => {
    const n = Number(lerLocal("escala_planilha_meses"));
    return n >= 1 && n <= MAX_MESES ? n : 2;
  });
  const mudarQtdMeses = (n: number) => {
    const v = Math.min(MAX_MESES, Math.max(1, n));
    setQtdMeses(v);
    gravarLocal("escala_planilha_meses", String(v));
  };
  const irPara = useCallback((data: string) => {
    const ref = referenciaDe(data);
    setAno(ref.ano);
    setMes(ref.mes);
  }, []);

  // ----- Dados -----
  const [planilha, setPlanilha] = useState<VisualizacaoPeriodo | null>(null);
  const [agenda, setAgenda] = useState<VisualizacaoMes | null>(null);
  const [planilhaEvento, setPlanilhaEventoEstado] = useState(() => lerLocal("escala_planilha_evento") || "");
  const setPlanilhaEvento = (t: string) => {
    setPlanilhaEventoEstado(t);
    gravarLocal("escala_planilha_evento", t);
  };
  const [loading, setLoading] = useState(true);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [ministeriosCarregados, setMinisteriosCarregados] = useState(false);

  // ----- Estado dos painéis e modais -----
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [relatorio, setRelatorio] = useState<EstatisticasEscala | null>(null);
  const [showBuscaPessoa, setShowBuscaPessoa] = useState(false);
  const [usuariosBusca, setUsuariosBusca] = useState<{ id_usuario: number; nome: string }[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<EscalaEventoCompleto | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioParaEscalar[]>([]);
  const [showModalEvento, setShowModalEvento] = useState(false);
  const [showModalAtribuicao, setShowModalAtribuicao] = useState(false);
  const [areaParaAtribuir, setAreaParaAtribuir] = useState<EscalaArea | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");
  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false);
  const [eventoToExcluir, setEventoToExcluir] = useState<number | null>(null);
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
  const [showHistorico, setShowHistorico] = useState(false);
  const [historico, setHistorico] = useState<EscalaHistoricoItem[]>([]);
  // Remover pede confirmação: em escala publicada a pessoa é avisada na hora
  const [aRemover, setARemover] = useState<{ atts: EscalaAtribuicao[]; nome: string; publicada: boolean } | null>(null);

  const showToast = useCallback((msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  }, []);

  // Esc fecha o painel do relatório (fora do focus-trap: o onDeactivate dele dispara no remount do StrictMode)
  useEffect(() => {
    if (!showRelatorio) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setShowRelatorio(false);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [showRelatorio]);

  // ----- Filtro de ministérios (antes a aba "Meus ministérios") -----
  // Administração: todos os ministérios, começa em "Todos". Líder: os que lidera, começa só neles.
  const ministeriosFiltraveis = useMemo(
    () =>
      ministerios
        .filter((m) => m.ativo)
        .filter((m) => isAdmin || (m.lideres || []).some((l) => l.id_usuario === user?.id_usuario)),
    [ministerios, isAdmin, user?.id_usuario]
  );
  const chaveFiltro = `escala_filtro_ministerios_${user?.id_usuario ?? 0}`;
  const [filtroSalvo, setFiltroSalvo] = useState<number[] | "todos" | null>(() => lerFiltroSalvo(chaveFiltro));
  /** undefined = escala inteira; lista = só esses ministérios */
  const idsFiltro = useMemo(() => {
    if (!podeEditar) return undefined;
    const meus = ministeriosFiltraveis.map((m) => m.id_ministerio);
    if (filtroSalvo === "todos" || !meus.length) return undefined;
    const validos = (filtroSalvo || []).filter((id) => meus.includes(id));
    if (validos.length) return validos;
    return isAdmin ? undefined : meus; // padrão: admin vê tudo, líder vê os seus
  }, [podeEditar, ministeriosFiltraveis, filtroSalvo, isAdmin]);
  const filtroKey = (idsFiltro || []).join(",");

  const salvarFiltro = (v: number[] | "todos") => {
    setFiltroSalvo(v);
    gravarLocal(chaveFiltro, v === "todos" ? "todos" : JSON.stringify(v));
  };
  const alternarMinisterio = (id: number) => {
    const atuais = idsFiltro || [];
    const proximo = atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id];
    salvarFiltro(proximo.length ? proximo : "todos");
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
  }, [visao, ano, mes, qtdMeses]);

  const fetchEventos = useCallback(async () => {
    if (!mostrarCalendario) {
      setLoading(false);
      return;
    }
    // A liderança espera os ministérios para não mostrar a escala inteira por um instante
    if (podeEditar && !ministeriosCarregados) return;
    try {
      if (!conteudoCarregadoRef.current) setLoading(true);
      if (visao === "planilha") {
        setPlanilha(
          await escalaService.getVisualizacaoPeriodo(`${ano}-${pad(mes)}-01`, fimDoMes(ano, mes + qtdMeses - 1), idsFiltro)
        );
      } else {
        setAgenda(await escalaService.getVisualizacaoMes(ano, mes, "completo", idsFiltro));
      }
      conteudoCarregadoRef.current = true;
    } catch {
      showToast("Erro ao carregar eventos", "error");
    } finally {
      setLoading(false);
    }
    // filtroKey: refaz a busca quando a seleção de ministérios muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes, visao, qtdMeses, showToast, podeEditar, ministeriosCarregados, filtroKey, mostrarCalendario]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  useEffect(() => {
    if (!podeEditar) return;
    ministerioService
      .getAll()
      .then(setMinisterios)
      .catch(() => setMinisterios([]))
      .finally(() => setMinisteriosCarregados(true));
  }, [podeEditar]);

  const carregarUsuariosParaEscalar = useCallback(async (idEvento: number, nomeArea?: string) => {
    try {
      setUsuarios((await escalaService.getUsuariosParaEscalar(idEvento, nomeArea)) || []);
    } catch {
      setUsuarios([]);
    }
  }, []);

  // ----- Evento: criar, editar, excluir, abrir -----
  const abrirModalEvento = (evento?: EscalaEvento) => {
    if (!isAdmin) return;
    const fmtDateTime = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (evento) {
      setEditandoEventoId(evento.id_escala_evento);
      const dh = new Date(evento.data_hora);
      const dhFim = evento.data_hora_fim ? new Date(evento.data_hora_fim) : new Date(dh.getTime() + 2 * 60 * 60 * 1000);
      const idsMin =
        (evento as EscalaEvento & { ministerios?: { id_ministerio: number }[] }).ministerios?.map((m) => m.id_ministerio) ?? [];
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
      const n = new Date();
      const fimDate = new Date(n);
      fimDate.setHours(21, 0, 0, 0);
      setFormEvento({
        titulo: "",
        data_hora: `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T19:00`,
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

  const handleSalvarEvento = async () => {
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
        data_hora_fim: formEvento.data_hora_fim?.trim() ? formEvento.data_hora_fim.slice(0, 16).replace("T", " ") + ":00" : null,
        descricao: formEvento.descricao.trim() || undefined,
        ativo: Boolean(formEvento.ativo),
        areas,
        id_ministerios: formEvento.id_ministerios,
      };
      if (editandoEventoId) {
        const atualizado = await escalaService.updateEvento(editandoEventoId, payload);
        const avisos = (atualizado as { avisos?: { mensagem: string }[] }).avisos || [];
        showToast(
          avisos.length ? `Evento atualizado. Atenção: ${avisos.map((a) => a.mensagem).join(" ")}` : "Evento atualizado",
          avisos.length ? "info" : "success"
        );
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
        setEventoSelecionado(await escalaService.getEventoCompleto(id));
      } catch {
        showToast("Erro ao carregar evento", "error");
      }
    },
    [showToast]
  );

  /** Recarrega o evento aberto (depois de escalar, mover, remover) */
  const atualizarEventoAberto = async (idEvento?: number) => {
    const id = idEvento ?? eventoSelecionado?.id_escala_evento;
    if (id && eventoSelecionado?.id_escala_evento === id) setEventoSelecionado(await escalaService.getEventoCompleto(id));
  };

  const abrirEventoId = (location.state as { abrirEventoId?: number })?.abrirEventoId;
  const abriuEventoRef = useRef(false);
  useEffect(() => {
    if (abrirEventoId && !abriuEventoRef.current) {
      abriuEventoRef.current = true;
      abrirEvento(abrirEventoId);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [abrirEventoId, abrirEvento, navigate, location.pathname, location.search]);

  const fecharEvento = () => setEventoSelecionado(null);

  const handlePublicar = async () => {
    if (!eventoSelecionado || !isAdmin) return;
    try {
      await escalaService.publicarEvento(eventoSelecionado.id_escala_evento);
      showToast("Escala publicada", "success");
      setEventoSelecionado(await escalaService.getEventoCompleto(eventoSelecionado.id_escala_evento));
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao publicar"), "error");
    }
  };

  const abrirHistorico = async () => {
    if (!eventoSelecionado) return;
    try {
      setHistorico(await escalaService.getHistorico(eventoSelecionado.id_escala_evento));
      setShowHistorico(true);
    } catch (err) {
      showToast(getErrorMessage(err, "Erro ao carregar histórico"), "error");
    }
  };

  // ----- Pessoas: escalar, editar, remover, mover -----
  const abrirModalAtribuicao = (area: EscalaArea) => {
    setAreaParaAtribuir(area);
    setUsuarioSelecionado(null);
    setFormDetalhes({});
    if (eventoSelecionado) carregarUsuariosParaEscalar(eventoSelecionado.id_escala_evento, area.nome);
    setShowModalAtribuicao(true);
  };

  const fecharModalAtribuicao = () => {
    setShowModalAtribuicao(false);
    setAreaParaAtribuir(null);
    setFormDetalhes({});
  };

  const abrirModalEditarDetalhes = (att: EscalaAtribuicao, areaNome: string) => {
    const strDetalhes: Record<string, string> = {};
    Object.entries(att.detalhes || {}).forEach(([k, v]) => {
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

  /** Mostra os conflitos; se forem confirmáveis, guarda a ação para "continuar mesmo assim" */
  const abrirConflitos = (lista: EscalaConflito[], repetirConfirmando: (() => Promise<void>) | null) => {
    setConflitos(lista);
    setAcaoConfirmar(() => repetirConfirmando);
  };

  const fecharConflitos = () => {
    setConflitos(null);
    setAcaoConfirmar(null);
  };

  const dadosDoErro = (err: unknown) =>
    (err as { response?: { data?: { conflitos?: EscalaConflito[]; confirmavel?: boolean } } })?.response?.data;

  const detalhesLimpos = () => {
    const obj: Record<string, string | null> = {};
    Object.entries(formDetalhes).forEach(([k, v]) => {
      obj[k] = v?.trim() || null;
    });
    return obj;
  };

  const adicionarAtribuicao = async (confirmar: boolean) => {
    const idEvento = areaParaAtribuir?.id_escala_evento || eventoSelecionado?.id_escala_evento;
    if (!areaParaAtribuir || !usuarioSelecionado || !idEvento) return;
    const detalhesObj = detalhesLimpos();
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
      await escalaService.addAtribuicao(areaParaAtribuir.id_escala_area, usuarioSelecionado, detalhesObj, confirmar);
      fecharConflitos();
      showToast("Pessoa escalada com sucesso", "success");
      marcarAlteracao();
      fecharModalAtribuicao();
      fetchEventos();
      await atualizarEventoAberto(idEvento);
    } catch (err) {
      const data = dadosDoErro(err);
      if (data?.conflitos?.length) {
        abrirConflitos(data.conflitos, data.confirmavel && !confirmar ? repetir : null);
        return;
      }
      showToast(getErrorMessage(err, "Não foi possível escalar. Verifique conflitos de horário."), "error");
    }
  };

  const handleRemoverAtribuicao = (a: EscalaAtribuicao, nome?: string) => {
    setARemover({
      atts: [a],
      nome: nome || a.usuario_nome || "esta pessoa",
      publicada: eventoSelecionado?.status === "publicada",
    });
  };

  const executarRemocao = async (lista: EscalaAtribuicao[]) => {
    try {
      for (const a of lista) await escalaService.removeAtribuicao(a.id_escala_atribuicao);
      showToast(lista.length > 1 ? `${lista.length} pessoas removidas da escala` : "Removido da escala", "success");
      marcarAlteracao();
      await fetchEventos();
      await atualizarEventoAberto();
    } catch (err) {
      showToast(getErrorMessage(err, "Não foi possível remover da escala"), "error");
    }
  };

  const salvarDetalhes = async (confirmar: boolean) => {
    if (!atribuicaoEditando) return;
    try {
      await escalaService.updateAtribuicao(atribuicaoEditando.id_escala_atribuicao, detalhesLimpos(), confirmar);
      fecharConflitos();
      showToast("Informações atualizadas", "success");
      marcarAlteracao();
      fecharModalEditarDetalhes();
      fetchEventos();
      await atualizarEventoAberto();
    } catch (err) {
      const data = dadosDoErro(err);
      if (data?.conflitos?.length) {
        abrirConflitos(data.conflitos, data.confirmavel && !confirmar ? () => salvarDetalhes(true) : null);
        return;
      }
      showToast(getErrorMessage(err, "Erro ao atualizar"), "error");
    }
  };

  const executarMover = async (payload: MoverMembroPayload) => {
    const result = await escalaService.moverMembro(payload);
    showToast(result.mensagem || "Pessoa movida", "success");
    marcarAlteracao();
    fecharConflitos();
    await fetchEventos();
    await atualizarEventoAberto();
  };

  const handleMoverUnificado = async (payload: MoverMembroPayload) => {
    const forcar = async () => {
      try {
        await executarMover({ ...payload, forcarMovimento: true });
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
      await executarMover(payload);
    } catch (err) {
      const data = dadosDoErro(err);
      if (data?.conflitos?.length) {
        abrirConflitos(data.conflitos, data.confirmavel ? forcar : null);
        return;
      }
      showToast(getErrorMessage(err, "Não foi possível mover — conflito na escala"), "error");
    }
  };

  /** Arrastar uma pessoa para outra área dentro do evento aberto */
  const handleMover = async (idAtribuicao: number, idAreaDestino: number) => {
    if (!eventoSelecionado) return;
    const att = eventoSelecionado.areas?.flatMap((a) => a.atribuicoes || []).find((a) => a.id_escala_atribuicao === idAtribuicao);
    const detalhes = (att?.detalhes || {}) as Record<string, string | number | null>;
    await handleMoverUnificado({
      membroEscalaOrigemId: idAtribuicao,
      escalaDestinoId: eventoSelecionado.id_escala_evento,
      instrumentoDestino: String(detalhes.instrumento || detalhes.funcao || "_geral"),
      id_escala_area: idAreaDestino,
    });
  };

  // ----- Planilha -----
  const carregarCandidatos = useCallback(
    (idEvento: number, nomeArea: string) => escalaService.getUsuariosParaEscalar(idEvento, nomeArea),
    []
  );

  /** Escala direto de uma célula da planilha (mesmas validações e exceções do modal) */
  const escalarNaCelula = async (idEvento: number, slot: SlotInstrumento, idUsuario: number, confirmar = false): Promise<boolean> => {
    const detalhes: Record<string, string | null> = {};
    if (slot.chaveDetalhe && slot.tipo !== "_geral") detalhes[slot.chaveDetalhe] = slot.tipo;
    const repetir = async () => {
      await escalarNaCelula(idEvento, slot, idUsuario, true);
    };
    try {
      if (!confirmar) {
        const v = await escalaService.validarAtribuicao(idEvento, { id_escala_area: slot.id_escala_area, id_usuario: idUsuario, detalhes });
        if (!v.sucesso) {
          abrirConflitos(v.conflitos, v.confirmavel ? repetir : null);
          return false;
        }
      }
      await escalaService.addAtribuicao(slot.id_escala_area, idUsuario, detalhes, confirmar);
      fecharConflitos();
      marcarAlteracao();
      await fetchEventos();
      return true;
    } catch (err) {
      const data = dadosDoErro(err);
      if (data?.conflitos?.length) {
        abrirConflitos(data.conflitos, data.confirmavel && !confirmar ? repetir : null);
        return false;
      }
      showToast(getErrorMessage(err, "Não foi possível escalar."), "error");
      return false;
    }
  };

  /** Tirar da planilha: rascunho sai na hora; publicada pede confirmação (a pessoa é avisada) */
  const removerDaCelula = async (ev: EventoUnificado, membros: SlotMembro[]) => {
    const atts: EscalaAtribuicao[] = membros.map((m) => ({
      id_escala_atribuicao: m.membroEscalaId,
      id_escala_area: m.id_escala_area,
      id_usuario: m.usuario.id,
      usuario_nome: m.usuario.nome,
    }));
    if (ev.status === "publicada") {
      setARemover({ atts, nome: membros.length === 1 ? membros[0].usuario.nome : `${membros.length} pessoas`, publicada: true });
      return;
    }
    await executarRemocao(atts);
  };

  // ----- Período na tela, exportação, relatório e busca -----
  const fimPlanilha = new Date(ano, mes - 1 + qtdMeses - 1, 1);
  const navLabel =
    visao === "planilha" && qtdMeses > 1
      ? `${MESES_CURTOS[mes - 1]}${fimPlanilha.getFullYear() !== ano ? ` ${ano}` : ""} – ${MESES_CURTOS[fimPlanilha.getMonth()]} ${fimPlanilha.getFullYear()}`
      : `${MESES[mes - 1]} ${ano}`;
  const periodoAtual = (): [string, string] =>
    visao === "planilha" ? [`${ano}-${pad(mes)}-01`, fimDoMes(ano, mes + qtdMeses - 1)] : [`${ano}-${pad(mes)}-01`, fimDoMes(ano, mes)];
  const eventosNaTela: EventoUnificado[] =
    visao === "planilha" ? planilha?.eventos || [] : (agenda?.dias || []).flatMap((d) => d.eventos);
  const estatisticasAtuais = visao === "planilha" ? planilha?.estatisticas : agenda?.estatisticas;

  const navegar = (passo: 1 | -1) => {
    const alvo = new Date(ano, mes - 1 + passo * (visao === "planilha" ? qtdMeses : 1), 1);
    irPara(dataDoMes(alvo.getFullYear(), alvo.getMonth() + 1));
  };

  /** Excel do período que está na tela, com quem serve em cada área */
  const exportarExcelEscala = async () => {
    try {
      showToast("Gerando a planilha…", "info");
      await exportarEscala(navLabel, eventosNaTela, estatisticasAtuais);
      showToast("Planilha baixada.", "success");
    } catch {
      showToast("Não foi possível gerar a planilha.", "error");
    }
  };

  const exportarPdfEscala = async () => {
    try {
      showToast("Gerando o PDF…", "info");
      await exportarPdf(`Escala – ${navLabel}`, { paisagem: visao === "planilha" });
      showToast("PDF baixado.", "success");
    } catch {
      showToast("Não foi possível gerar o PDF.", "error");
    }
  };

  const abrirBuscaPessoa = async () => {
    try {
      const list = await usuarioService.getAll();
      setUsuariosBusca(list.map((u) => ({ id_usuario: u.id_usuario, nome: u.nome })));
    } catch {
      // Sem a lista geral: usa quem aparece na tela
      const mapa = new Map<number, string>();
      for (const ev of eventosNaTela)
        for (const slot of Object.values(ev.instrumentos || {})) for (const m of slot.membros) mapa.set(m.usuario.id, m.usuario.nome);
      setUsuariosBusca([...mapa.entries()].map(([id_usuario, nome]) => ({ id_usuario, nome })));
    }
    setShowBuscaPessoa(true);
  };

  const abrirRelatorio = async () => {
    setRelatorio(null);
    setShowRelatorio(true);
    try {
      const [ini, fim] = periodoAtual();
      setRelatorio((await escalaService.getVisualizacaoPeriodo(ini, fim, idsFiltro)).estatisticas);
    } catch (err) {
      setShowRelatorio(false);
      showToast(getErrorMessage(err, "Não foi possível gerar o relatório."), "error");
    }
  };

  // Esc fecha o modal de cima (escalar/editar pessoa e depois o evento). Ouvimos na captura para
  // saber, antes dos outros, se há algo empilhado por cima (confirmação, conflitos, menu aberto).
  const algumModalEscalaAberto = !!eventoSelecionado || showModalAtribuicao || !!atribuicaoEditando;
  useEffect(() => {
    if (!algumModalEscalaAberto) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"]:not([data-modal-escala]), [role="menu"]')) return;
      if (atribuicaoEditando) fecharModalEditarDetalhes();
      else if (showModalAtribuicao) fecharModalAtribuicao();
      else fecharEvento();
    };
    document.addEventListener("keydown", tecla, true);
    return () => document.removeEventListener("keydown", tecla, true);
  });

  const numerosTopo =
    mostrarCalendario && estatisticasAtuais
      ? [
          { valor: estatisticasAtuais.totalEventos, rotulo: estatisticasAtuais.totalEventos === 1 ? "evento" : "eventos" },
          { valor: estatisticasAtuais.pessoasUnicas, rotulo: estatisticasAtuais.pessoasUnicas === 1 ? "pessoa servindo" : "pessoas servindo" },
          ...(podeEditar && typeof estatisticasAtuais.vagasDisponiveis === "number"
            ? [{ valor: estatisticasAtuais.vagasDisponiveis, rotulo: estatisticasAtuais.vagasDisponiveis === 1 ? "vaga aberta" : "vagas abertas" }]
            : []),
        ]
      : [];

  const filtrando = !!idsFiltro;

  return (
    <MolduraEscala
      aba={aba}
      descricao={
        aba === "minhas"
          ? "Quando, onde e com quem você vai servir."
          : podeEditar
            ? "Monte a escala na Planilha e confira cada culto na Agenda."
            : "Os próximos cultos da Casa e quem serve em cada um."
      }
      numeros={numerosTopo}
      acao={isAdmin && mostrarCalendario ? { rotulo: "Novo evento", onClick: () => abrirModalEvento() } : undefined}
    >
      {aba === "minhas" && (
        <>
          <BotoesExportar tema="escuro" className="minhas-exportar" onPdf={() => exportarPdf(`Minhas escalas – ${user?.nome ?? ""}`)} />
          <MinhasEscalas
            idUsuario={user?.id_usuario}
            onAbrirEvento={abrirEvento}
            onVerCalendario={() => navigate("/usuario/escala?ver=calendario")}
          />
        </>
      )}

      {mostrarCalendario && (
        <>
          <div className="esc-ferramentas">
            <div className="esc-periodo">
              <button type="button" className="esc-icone" onClick={() => navegar(-1)} aria-label="Período anterior">
                <Icone nome="anterior" tamanho={20} />
              </button>
              <h2 className="esc-periodo__titulo" aria-live="polite">
                {navLabel}
              </h2>
              <button type="button" className="esc-icone" onClick={() => navegar(1)} aria-label="Próximo período">
                <Icone nome="proximo" tamanho={20} />
              </button>
              <button type="button" className="esc-btn esc-btn--fantasma esc-hoje" onClick={() => irPara(toIsoDate(new Date()))}>
                Hoje
              </button>
              {visao === "planilha" && (
                <label className="esc-meses">
                  <span className="sr-only">Quantos meses mostrar</span>
                  <select value={qtdMeses} onChange={(e) => mudarQtdMeses(Number(e.target.value))}>
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? "1 mês" : `${n} meses`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {podeEditar && (
              <div className="esc-segmentado" role="tablist" aria-label="Visualização">
                {(
                  [
                    ["planilha", "Planilha"],
                    ["agenda", "Agenda"],
                  ] as [Visao, string][]
                ).map(([id, nome]) => (
                  <button key={id} type="button" role="tab" aria-selected={visao === id} className={visao === id ? "ativo" : ""} onClick={() => setVisao(id)}>
                    {nome}
                  </button>
                ))}
              </div>
            )}

            <div className="esc-acoes">
              {podeEditar && ministeriosFiltraveis.length > 0 && (
                <FiltroMinisterios
                  opcoes={ministeriosFiltraveis.map((m) => ({ id: m.id_ministerio, nome: m.nome }))}
                  selecionados={idsFiltro || []}
                  onAlternar={alternarMinisterio}
                  onTodos={() => salvarFiltro("todos")}
                />
              )}
              {podeEditar && (
                <button type="button" className="esc-btn esc-btn--fantasma" onClick={abrirRelatorio}>
                  Relatório
                </button>
              )}
              <MenuAcoes
                itens={[
                  { rotulo: "Buscar pessoa", onSelecionar: abrirBuscaPessoa },
                  { rotulo: "Exportar Excel", onSelecionar: exportarExcelEscala, separar: true },
                  { rotulo: "Exportar PDF", onSelecionar: exportarPdfEscala },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div className="esc-carregando" aria-busy="true" aria-label="Carregando a escala">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <div className="escala-layout">
              {visao === "planilha" && planilha && (
                <EscalaPlanilha
                  eventos={planilha.eventos}
                  podeEditar={podeEditar}
                  areasVisiveis={ministeriosFiltraveis.filter((m) => idsFiltro?.includes(m.id_ministerio)).map((m) => m.nome)}
                  filtroEvento={planilhaEvento}
                  onFiltroEvento={setPlanilhaEvento}
                  carregarCandidatos={carregarCandidatos}
                  onAdicionar={escalarNaCelula}
                  onRemover={removerDaCelula}
                  onMover={handleMoverUnificado}
                  onAbrirEvento={abrirEvento}
                  onAviso={showToast}
                />
              )}
              {visao === "agenda" && agenda && <EscalaAgenda visao={agenda} onAbrirEvento={abrirEvento} podeEditar={podeEditar} />}
            </div>
          )}
        </>
      )}

      {/* Em portal: fica acima do cabeçalho fixo (dentro da página ele ficava por baixo) */}
      {showRelatorio && createPortal(
        <div className="esc-gaveta-raiz sc-tema-escuro es">
          <button type="button" className="esc-gaveta-fundo" aria-label="Fechar relatório" tabIndex={-1} onClick={() => setShowRelatorio(false)} />
          <FocusTrap focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false, fallbackFocus: ".esc-gaveta" }}>
            <div className="esc-gaveta" role="dialog" aria-modal="true" aria-label="Relatório da escala" tabIndex={-1}>
              {!relatorio && (
                <div className="esc-carregando" aria-busy="true" aria-label="Gerando o relatório">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              <EscalaRelatorio
                titulo={navLabel}
                subtitulo={filtrando ? "Só os ministérios selecionados" : "Visão geral para liderança e secretaria"}
                estatisticas={relatorio}
                onFechar={() => setShowRelatorio(false)}
                onAbrirEvento={(id) => {
                  setShowRelatorio(false);
                  abrirEvento(id);
                }}
              />
            </div>
          </FocusTrap>
        </div>,
        document.body
      )}

      {eventoSelecionado && (
        <div className="modal-overlay modal-escala-overlay">
          <div className="modal-escala-dashboard" role="dialog" aria-modal="true" aria-label={eventoSelecionado.titulo} data-modal-escala="">
            <div className="escala-dashboard-header">
              <div className="escala-dashboard-titulo">
                <h2>{eventoSelecionado.titulo}</h2>
                <span className="escala-dashboard-data">{formatarDataHora(eventoSelecionado.data_hora, eventoSelecionado.data_hora_fim)}</span>
                {eventoSelecionado.status && podeEditar && (
                  <span className={`status-badge status-${eventoSelecionado.status}`}>{rotuloStatus(eventoSelecionado.status)}</span>
                )}
              </div>
              <button type="button" className="btn-fechar-dashboard" onClick={fecharEvento} aria-label="Fechar">
                <Icone nome="fechar" tamanho={18} />
              </button>
            </div>

            {eventoSelecionado.descricao && <p className="escala-dashboard-desc">{eventoSelecionado.descricao}</p>}

            <p className="esc-modal-meta">
              {plural(
                new Set((eventoSelecionado.areas || []).flatMap((ar) => (ar.atribuicoes || []).map((at) => at.id_usuario))).size,
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
            acaoEvento.executar(handleSalvarEvento);
          }}
          salvando={acaoEvento.executando}
        />
      )}

      {showModalAtribuicao && areaParaAtribuir && !atribuicaoEditando && (
        <div className="modal-overlay modal-evento-overlay">
          <div
            className="modal-content modal-atribuicao modal-atribuicao-completo"
            role="dialog"
            aria-modal="true"
            aria-label={`Escalar em ${areaParaAtribuir.nome}`}
            data-modal-escala=""
          >
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
                    {u.ja_escalado ? ` — já escalado(a)${u.areas_no_evento?.length ? ` em ${u.areas_no_evento.join(", ")}` : ""}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <span>Informações da escala</span>
              <AtribuicaoDetalhesForm nomeArea={areaParaAtribuir.nome} value={formDetalhes} onChange={setFormDetalhes} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={fecharModalAtribuicao}>
                Cancelar
              </button>
              <BotaoCarregando
                type="button"
                className="btn-salvar"
                onClick={() => acaoAtribuicao.executar(() => adicionarAtribuicao(false))}
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
          <div
            className="modal-content modal-atribuicao modal-atribuicao-editar"
            role="dialog"
            aria-modal="true"
            aria-label={`Editar informações de ${atribuicaoEditando.usuario_nome}`}
            data-modal-escala=""
          >
            <h2>Editar informações — {atribuicaoEditando.usuario_nome}</h2>
            <p className="modal-atribuicao-contexto">Em {areaParaAtribuir.nome}</p>
            <AtribuicaoDetalhesForm nomeArea={areaParaAtribuir.nome} value={formDetalhes} onChange={setFormDetalhes} />
            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={fecharModalEditarDetalhes}>
                Cancelar
              </button>
              <BotaoCarregando
                type="button"
                className="btn-salvar"
                onClick={() => acaoAtribuicao.executar(() => salvarDetalhes(false))}
                carregando={acaoAtribuicao.executando}
              >
                Salvar
              </BotaoCarregando>
            </div>
          </div>
        </div>
      )}

      {showBuscaPessoa && (
        <ModalBuscaPessoa
          usuarios={usuariosBusca}
          dataInicio={periodoAtual()[0]}
          dataFim={periodoAtual()[1]}
          onClose={() => setShowBuscaPessoa(false)}
          onAbrirEvento={(id) => {
            setShowBuscaPessoa(false);
            abrirEvento(id);
          }}
        />
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
          aRemover?.publicada ? "A escala já está publicada: a pessoa será avisada da remoção." : "A escala ainda é rascunho: ninguém será avisado."
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        textoCarregando="Removendo…"
        onConfirm={async () => {
          if (aRemover) await executarRemocao(aRemover.atts);
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

      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toastVariant}
          // Mensagens longas ficam mais tempo na tela
          duration={Math.min(12000, Math.max(3000, toast.length * 60))}
        />
      )}
    </MolduraEscala>
  );
};

export default EscalaUser;
