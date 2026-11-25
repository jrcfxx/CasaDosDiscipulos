import type { ErroApi } from "../utils/errorUtils";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FocusTrapComponent from "../components/ui/FocusTrap";
import ConfirmModal from "../components/ui/ConfirmModal";
import PaginaSecretaria, {
  DetalheSecretaria,
  DetalheVazio,
  ItemSecretaria,
  ListaSecretaria,
  filtrarItens,
  type FiltroStatus,
} from "../components/secretaria/PaginaSecretaria";
import "../style/QuizzesSecretariaCelulasAdmin.css";
import "../style/editorCasa.css";

import ConstrutorPergunta, { TIPOS_CONSTRUIDOS } from "../components/quiz/ConstrutorPergunta";

import api from "../services/apiClient";
import { uploadCampo } from "../services/uploadService";

import TextField from "../components/fields/TextField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";
import TextareaField from "../components/fields/TextareaField";
import MultipleChoiceField from "../components/fields/MultipleChoiceField";
import TrueFalseField from "../components/fields/TrueFalseField";
import EssayField from "../components/fields/EssayField";
import CheckboxField from "../components/fields/CheckboxField";
import SelectField from "../components/fields/SelectField";

import usuarioService from "../services/usuarioService";
import moduloService from "../services/moduloService";
import { ASSETS_BASE } from "../config/api";
import type { Usuario } from "../services/usuarioService";
import { generateUid } from "../utils/generateUid";
import RankingCard, { type RankItem } from "../components/modulos/RankingCard";
import BotoesExportar from "../components/ui/BotoesExportar";
import { exportarRanking } from "../utils/exportacoes";
import DarPontosModal from "../components/ui/DarPontosModal";
import { isRecord, parseAlternativas, parseSelect, type Alternativa, type CampoDinamico, type CampoVinculado, type ValorCampo } from "../types/campoConteudo";
import { renderVideoPreview } from "../components/conteudo/renderVideoPreview";
import { getMedalIcon } from "../utils/moduloConteudoUtils";
import { useAcao } from "../hooks/useAcao";
import BotaoCarregando from "../components/ui/BotaoCarregando";
import Icone, { type NomeIcone } from "../components/ui/Icone";

/* TYPES */
type Quiz = {
  id: number;
  titulo: string;
  descricao?: string | null;
  ativo?: number;
  campos?: CampoVinculado[];
};

/** Quiz como vem de GET /quiz */
type QuizApi = {
  id_quiz?: number;
  id?: number;
  titulo: string;
  descricao?: string | null;
  ativo?: number;
  campos?: CampoVinculado[];
};

type QuizForm = {
  id: number | null;
  nome: string;
  descricao: string;
  ativo: number;
};

type AvailableField = {
  id_campo: number;
  tipo_campo: string;
};

type LocalField = {
  uid: number;
  id_campo: number;
  tipo: string;
  label: string;
  conteudo: ValorCampo;
};

/** Pontos de cada pergunta (fixo no servidor) */
const PONTOS_POR_PERGUNTA = 10;

/** Nome curto e ícone de cada tipo, para os cards e os botões de adicionar */
const INFO_TIPO: Record<string, { nome: string; icone: NomeIcone; resumo: string }> = {
  multipla_escolha: { nome: "Múltipla escolha", icone: "concluido", resumo: "Uma resposta certa" },
  checkbox: { nome: "Várias respostas", icone: "check", resumo: "Mais de uma certa" },
  select: { nome: "Lista de opções", icone: "abrir", resumo: "Escolhe numa lista" },
  verdadeiro_falso: { nome: "Verdadeiro ou falso", icone: "alvo", resumo: "Afirmação certa ou errada" },
  discursiva: { nome: "Resposta escrita", icone: "editar", resumo: "Sem correção automática" },
  texto: { nome: "Texto curto", icone: "arquivo", resumo: "Instrução ou versículo" },
  textarea: { nome: "Texto longo", icone: "livro", resumo: "Explicação ou leitura" },
  video: { nome: "Vídeo", icone: "projecao", resumo: "YouTube ou Vimeo" },
  link: { nome: "Link", icone: "proximo", resumo: "Página para consultar" },
  upload: { nome: "Arquivo", icone: "imagem", resumo: "PDF ou imagem" },
  numero: { nome: "Número", icone: "lista", resumo: "Valor para consulta" },
  data: { nome: "Data", icone: "calendario", resumo: "Data para consulta" },
};

/** Tipos que viram pergunta corrigida (valem pontos). Os demais só aparecem como conteúdo. */
const TIPOS_PERGUNTA = ["multipla_escolha", "verdadeiro_falso", "discursiva", "checkbox", "select"];

/** Explicação de cada tipo para o admin: o que o aluno vê e como preencher */
const AJUDA_TIPO: Record<string, { rotulo: string; dica: string }> = {
  multipla_escolha: {
    rotulo: "Escreva a pergunta",
    dica: "O aluno escolhe UMA alternativa. Crie pelo menos 2 alternativas e marque a bolinha ao lado da correta.",
  },
  checkbox: {
    rotulo: "Escreva a pergunta",
    dica: "O aluno pode marcar VÁRIAS alternativas. Crie pelo menos 2 e marque a caixinha de todas as corretas. Só pontua quem acertar exatamente todas.",
  },
  select: {
    rotulo: "Escreva a pergunta",
    dica: "O aluno escolhe uma opção numa lista suspensa. Adicione pelo menos 2 opções e marque qual é a correta.",
  },
  verdadeiro_falso: {
    rotulo: "Escreva a afirmação",
    dica: "Escreva uma afirmação (ex.: \"Jesus nasceu em Belém\"). Abaixo, escolha se ela é Verdadeira ou Falsa — essa é a resposta certa.",
  },
  discursiva: {
    rotulo: "Escreva a pergunta",
    dica: "O aluno responde escrevendo. Não há correção automática: qualquer resposta preenchida ganha os pontos.",
  },
  texto: { rotulo: "Título do trecho", dica: "Texto curto mostrado ao aluno (instrução, versículo). Não vale pontos." },
  textarea: { rotulo: "Título do trecho", dica: "Texto longo mostrado ao aluno (explicação, leitura). Não vale pontos." },
  numero: { rotulo: "Título", dica: "Um número mostrado ao aluno. Não vale pontos." },
  data: { rotulo: "Título", dica: "Uma data mostrada ao aluno. Não vale pontos." },
  link: { rotulo: "Título do link", dica: "Cole o endereço completo (começando com https://). O aluno verá o link. Não vale pontos." },
  upload: { rotulo: "Título do arquivo", dica: "Envie um arquivo ou imagem para o aluno ver/baixar. Não vale pontos." },
  video: { rotulo: "Título do vídeo", dica: "Cole o link do YouTube ou Vimeo. O aluno assiste antes de responder. Não vale pontos." },
};

/** Mensagem do primeiro problema que impede salvar, ou null se estiver tudo certo */
function problemaDoQuiz(nome: string, campos: LocalField[]): string | null {
  if (nome.trim().length < 3) return "O título do quiz precisa ter pelo menos 3 letras.";
  if (!campos.some((c) => TIPOS_PERGUNTA.includes(c.tipo))) {
    return "Adicione pelo menos uma pergunta (Múltipla Escolha, Verdadeiro/Falso, Checkbox, Seleção ou Discursiva).";
  }
  for (const [i, c] of campos.entries()) {
    if (!c.label.trim()) {
      return TIPOS_PERGUNTA.includes(c.tipo)
        ? `O ${i + 1}º item está sem a pergunta escrita.`
        : `O ${i + 1}º item está sem título.`;
    }
    const nomeCampo = `"${c.label || `Campo ${i + 1}`}"`;
    if (c.tipo === "multipla_escolha" || c.tipo === "checkbox") {
      const alts = parseAlternativas(c.conteudo).alternativas;
      if (alts.filter((a) => a.texto.trim()).length < 2) return `${nomeCampo}: escreva pelo menos 2 alternativas.`;
      if (alts.some((a) => !a.texto.trim())) return `${nomeCampo}: há uma alternativa em branco. Preencha ou remova.`;
      if (new Set(alts.map((a) => a.texto.trim().toLocaleLowerCase("pt-BR"))).size !== alts.length) {
        return `${nomeCampo}: há duas alternativas iguais.`;
      }
      const certas = alts.filter((a) => a.correta).length;
      if (certas === 0) return `${nomeCampo}: marque qual alternativa é a correta.`;
    } else if (c.tipo === "verdadeiro_falso") {
      if (!["true", "false"].includes(String(c.conteudo ?? "").toLowerCase())) {
        return `${nomeCampo}: marque se a afirmação é Verdadeira ou Falsa.`;
      }
    } else if (c.tipo === "select") {
      const sel = parseSelect(c.conteudo);
      if (sel.opcoes.filter((o) => o.trim()).length < 2) return `${nomeCampo}: adicione pelo menos 2 opções.`;
      if (sel.opcoes.some((o) => !o.trim())) return `${nomeCampo}: há uma opção em branco. Preencha ou remova.`;
      if (new Set(sel.opcoes.map((o) => o.trim().toLocaleLowerCase("pt-BR"))).size !== sel.opcoes.length) {
        return `${nomeCampo}: há duas opções iguais.`;
      }
      if (!sel.correta) return `${nomeCampo}: marque qual opção é a correta.`;
    } else if (c.tipo === "link" || c.tipo === "video") {
      const v = String(c.conteudo ?? "").trim();
      if (!v) return `${nomeCampo}: cole o link.`;
      if (!/^https?:\/\//i.test(v)) return `${nomeCampo}: o link precisa começar com https://`;
    } else if (c.tipo === "upload") {
      if (!c.conteudo) return `${nomeCampo}: escolha o arquivo ou remova o campo.`;
    }
  }
  return null;
}

/** Um item do quiz no editor: arrastado pela alça para mudar a ordem */
function ItemQuiz({
  item,
  numero,
  ehPergunta,
  onRenomear,
  onRemover,
  children,
}: {
  item: LocalField;
  numero: number;
  ehPergunta: boolean;
  onRenomear: (label: string) => void;
  onRemover: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const info = INFO_TIPO[item.tipo];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`ec-item ${ehPergunta ? "ec-item--pergunta" : "ec-item--apoio"}${isDragging ? " ec-item--arrastando" : ""}`}
    >
      <div className="ec-item__topo">
        <button
          type="button"
          className="ec-item__alca"
          aria-label={`Arrastar "${item.label}" para mudar a ordem`}
          title="Arraste para mudar a ordem"
          {...attributes}
          {...listeners}
        >
          <Icone nome="arrastar" tamanho={18} />
        </button>
        <span className="ec-item__numero" aria-hidden>
          {ehPergunta ? numero : "•"}
        </span>
        <span className={`ec-selo ${ehPergunta ? "ec-selo--pergunta" : "ec-selo--apoio"}`}>
          {info?.nome || item.tipo}
          {ehPergunta ? ` · ${PONTOS_POR_PERGUNTA} pts` : " · apoio"}
        </span>
        <button type="button" className="ec-item__remover" onClick={onRemover} aria-label={`Remover "${item.label}"`} title="Remover">
          <Icone nome="lixeira" tamanho={16} />
        </button>
      </div>
      <label className="ec-rotulo" htmlFor={`ec-enunciado-${item.uid}`}>
        {AJUDA_TIPO[item.tipo]?.rotulo || "Título"}
      </label>
      <input
        id={`ec-enunciado-${item.uid}`}
        className="ec-input ec-input--enunciado"
        value={item.label}
        maxLength={255}
        onChange={(e) => onRenomear(e.target.value)}
        placeholder={
          item.tipo === "verdadeiro_falso"
            ? "Ex.: Jesus nasceu em Belém"
            : ehPergunta
              ? "Ex.: Quem foi o primeiro rei de Israel?"
              : "Título do conteúdo"
        }
      />
      {AJUDA_TIPO[item.tipo] && !TIPOS_CONSTRUIDOS.includes(item.tipo) && (
        <p className="ec-ajuda-tipo">{AJUDA_TIPO[item.tipo].dica}</p>
      )}
      <div className="ec-item__corpo field-wrapper">{children}</div>
    </li>
  );
}

const initialFormState: QuizForm = {
  id: null,
  nome: "",
  descricao: "",
  ativo: 1,
};

export default function QuizzesSecretariaCelulasAdmin() {
  const acaoSalvar = useAcao();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([]);
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalDarPontosAberto, setModalDarPontosAberto] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<number | null>(null);
  const [currentForm, setCurrentForm] = useState<QuizForm>(initialFormState);

  const [fields, setFields] = useState<LocalField[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  /** Erro mostrado dentro do modal, junto ao botão Salvar (o toast ficava atrás do modal) */
  const [erroForm, setErroForm] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  /** Houve mudança no editor (pergunta antes de descartar) */
  const [alterado, setAlterado] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const [quizParaExcluir, setQuizParaExcluir] = useState<{ quiz: Quiz; respostas: number; alunos: number } | null>(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Componentes de alternativas exigem `options`; ela chega via additionalProps no render
  const fieldOptions = [
    { label: "Texto", tipo: "texto", component: TextField as CampoDinamico },
    { label: "Número", tipo: "numero", component: NumberField as CampoDinamico },
    { label: "Data", tipo: "data", component: DateField as CampoDinamico },
    { label: "Link", tipo: "link", component: LinkField as CampoDinamico },
    { label: "Upload", tipo: "upload", component: UploadField as CampoDinamico },
    { label: "Vídeo", tipo: "video", component: VideoField as CampoDinamico },
    { label: "Área de Texto", tipo: "textarea", component: TextareaField as CampoDinamico },
    {
      label: "Múltipla Escolha",
      tipo: "multipla_escolha",
      component: MultipleChoiceField as unknown as CampoDinamico,
    },
    {
      label: "Verdadeiro/Falso",
      tipo: "verdadeiro_falso",
      component: TrueFalseField as unknown as CampoDinamico,
    },
    { label: "Discursiva", tipo: "discursiva", component: EssayField as CampoDinamico },
    { label: "Checkbox", tipo: "checkbox", component: CheckboxField as unknown as CampoDinamico },
    { label: "Seleção", tipo: "select", component: SelectField as unknown as CampoDinamico },
  ];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string, ms = 3200) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), ms);
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchQuizzes(), fetchAvailableFields(), fetchRanking()]);
    setLoading(false);
  };

  const fetchQuizzes = async () => {
    try {
      const res = await api.get(`/quiz`);
      const mapped: Quiz[] = (res.data || []).map((q: QuizApi) => ({
        id: q.id_quiz ?? q.id ?? 0,
        titulo: q.titulo,
        descricao: q.descricao ?? "",
        ativo: q.ativo ?? 1,
        campos: q.campos ?? [],
      }));
      setQuizzes(mapped);
      if (mapped.length > 0 && !selectedQuiz) {
        setSelectedQuiz(mapped[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar quizzes:", err);
    }
  };

  const fetchAvailableFields = async () => {
    try {
      const res = await api.get(`/campo`, {
        params: { modalidade: "quiz" },
      });
      setAvailableFields(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar campos disponíveis:", err);
    }
  };

  const fetchRanking = async () => {
    try {
      const topUsuarios = await moduloService.getRanking(20);
      setRanking(topUsuarios as RankItem[]);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
  };

  const handleDarPontos = async (id_usuario: number, pontos: number, motivo: string) => {
    const usuario = await usuarioService.addPontuacaoManual(id_usuario, { pontos, motivo });
    showToast(`Pontuação atribuída! ${pontos} pts para ${usuario.nome}.`);
    await fetchRanking();
  };

  const handleToggle = async (id: number) => {
    const quiz = quizzes.find((q) => q.id === id);
    if (!quiz) return;
    const ativo = !quiz.ativo;
    try {
      // Só o status: reenviar as perguntas aqui recriava todos os campos do quiz
      await api.put(`/quiz/${id}`, { ativo });
      const atualizar = (q: Quiz) => (q.id === id ? { ...q, ativo: ativo ? 1 : 0 } : q);
      setQuizzes((lista) => lista.map(atualizar));
      setSelectedQuiz((sel) => (sel ? atualizar(sel) : sel));
      showToast(ativo ? "Quiz liberado para os alunos." : "Quiz escondido dos alunos.");
    } catch (error) {
      console.error("Erro ao alternar quiz:", error);
      showToast("Não foi possível alterar o quiz. Tente de novo.");
    }
  };

  /** Excluir: avisa antes quantas respostas de alunos vão junto */
  const pedirExclusao = async (quiz: Quiz) => {
    try {
      const { data } = await api.get(`/quiz/${quiz.id}/total-respostas`);
      setQuizParaExcluir({ quiz, respostas: Number(data?.respostas) || 0, alunos: Number(data?.alunos) || 0 });
    } catch {
      setQuizParaExcluir({ quiz, respostas: 0, alunos: 0 });
    }
  };

  const excluirQuiz = async () => {
    if (!quizParaExcluir) return;
    const id = quizParaExcluir.quiz.id;
    try {
      await api.delete(`/quiz/${id}`);
      setQuizzes((lista) => lista.filter((q) => q.id !== id));
      setSelectedQuiz((sel) => (sel?.id === id ? null : sel));
      showToast("Quiz excluído.");
    } catch (erro) {
      const err = erro as ErroApi;
      showToast(err?.response?.data?.error || "Não foi possível excluir o quiz.");
    } finally {
      setQuizParaExcluir(null);
    }
  };

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
  };

  const createLocalField = (
    id_campo: number,
    tipo: string,
    label = "",
    conteudo: ValorCampo = ""
  ): LocalField => {
    return {
      uid: generateUid(),
      id_campo,
      tipo,
      label,
      conteudo,
    };
  };

  /** Clicou num tipo: a pergunta entra no fim da lista já com o cursor no texto dela */
  const addField = (tipo: string) => {
    const campo = availableFields.find((c) => String(c.tipo_campo).toLowerCase() === tipo.toLowerCase());
    if (!campo) {
      showToast(`Esse tipo (${INFO_TIPO[tipo]?.nome || tipo}) não está disponível.`);
      return;
    }
    const novo = createLocalField(campo.id_campo, tipo, "", tipo === "numero" ? 0 : "");
    setErroForm(null);
    setAlterado(true);
    setFields((prev) => [...prev, novo]);
    setTimeout(() => {
      const input = document.getElementById(`ec-enunciado-${novo.uid}`) as HTMLInputElement | null;
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
    }, 80);
  };

  const aoSoltarItem = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const de = prev.findIndex((f) => f.uid === active.id);
      const para = prev.findIndex((f) => f.uid === over.id);
      return arrayMove(prev, de, para);
    });
    setAlterado(true);
  };

  const removeField = (uid: number) => {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
    setAlterado(true);
  };

  const atualizarItem = (uid: number, mudanca: Partial<LocalField>) => {
    setFields((prev) => prev.map((f) => (f.uid === uid ? { ...f, ...mudanca } : f)));
    setAlterado(true);
  };

  const openCreateModal = () => {
    setCurrentForm(initialFormState);
    setQuizToEdit(null);
    setFields([]);
    setErroForm(null);
    setAlterado(false);
    setShowFormModal(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const openEditModal = async (id: number) => {
    try {
      const res = await api.get(`/quiz/${id}`);
      const q = res.data;

      setCurrentForm({
        id: q.id_quiz ?? q.id ?? id,
        nome: q.titulo ?? "",
        descricao: q.descricao ?? "",
        ativo: q.ativo ?? 1,
      });

      const incomingFields = (q.campos ?? []).map((c: CampoVinculado, idx: number) => {
        const tipo =
          availableFields.find((field) => field.id_campo === c.id_campo)
            ?.tipo_campo ?? "texto";

        let conteudoLimpo = c.conteudo ?? "";

        // Para campos com estrutura JSON complexa (múltipla escolha, etc), manter conteúdo original
        if (
          tipo === "multipla_escolha" ||
          tipo === "checkbox" ||
          tipo === "select"
        ) {
          conteudoLimpo = c.conteudo ?? "";
        } else if (conteudoLimpo === c.label || !conteudoLimpo) {
          if (tipo === "numero") {
            conteudoLimpo = 0;
          } else {
            conteudoLimpo = "";
          }
        } else if (tipo === "data") {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(String(conteudoLimpo))) {
            conteudoLimpo = "";
          }
        }

        return createLocalField(
          c.id_campo,
          tipo,
          c.label ?? `Campo ${idx + 1}`,
          conteudoLimpo
        );
      });

      setFields(incomingFields);
      setAlterado(false);
      setErroForm(null);
      setQuizToEdit(q.id_quiz ?? q.id ?? id);
      setShowFormModal(true);
      setTimeout(() => nameRef.current?.focus(), 100);
    } catch (err) {
      console.error("Erro ao carregar quiz:", err);
      showToast("Erro ao carregar quiz para edição.");
    }
  };

  /** Fechar o editor: com mudanças não salvas, pergunta antes */
  const pedirFechar = () => {
    if (acaoSalvar.executando) return;
    if (alterado) setConfirmarDescarte(true);
    else closeFormModal();
  };

  const closeFormModal = () => {
    setConfirmarDescarte(false);
    setAlterado(false);
    setShowFormModal(false);
    setErroForm(null);
    setQuizToEdit(null);
    setCurrentForm(initialFormState);
    setFields([]);
  };

  const uploadFile = async (file: File): Promise<string> => uploadCampo(file);

  const saveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const problema = problemaDoQuiz(currentForm.nome, fields);
    if (problema) {
      setErroForm(problema);
      return;
    }
    setErroForm(null);

    try {
      // Processar uploads antes de montar o payload
      const processedFields = await Promise.all(
        fields.map(async (f) => {
          let conteudo = f.conteudo ?? "";

          // Se o conteúdo é um File (upload), fazer upload primeiro
          if (conteudo instanceof File) {
            try {
              conteudo = await uploadFile(conteudo);
            } catch (error) {
              console.error("Erro no upload:", error);
              throw new Error(`Não foi possível enviar o arquivo de "${f.label}". Tente de novo ou use um arquivo menor.`);
            }
          }

          return { ...f, conteudo };
        })
      );

      const camposPayload = processedFields.map((f, index) => ({
        id_campo: f.id_campo,
        label: (f.label ?? "").trim(),
        // O banco guarda texto: Verdadeiro/Falso vira "true"/"false"
        conteudo: typeof f.conteudo === "boolean" ? String(f.conteudo) : f.conteudo ?? "",
        ordem: index,
      }));

      const payload = {
        titulo: currentForm.nome.trim(),
        descricao: currentForm.descricao.trim() || null,
        ativo: Boolean(currentForm.ativo),
        campos: camposPayload,
      };

      if (quizToEdit) {
        await api.put(`/quiz/${quizToEdit}`, payload);
        await fetchQuizzes();

        // Atualizar o quiz selecionado se for o que foi editado
        if (selectedQuiz && selectedQuiz.id === quizToEdit) {
          const res = await api.get(`/quiz/${quizToEdit}`);
          const q = res.data;
          setSelectedQuiz({
            id: q.id_quiz ?? q.id ?? quizToEdit,
            titulo: q.titulo,
            descricao: q.descricao ?? "",
            ativo: q.ativo ?? 1,
            campos: q.campos ?? [],
          });
        }

        showToast("Quiz atualizado com sucesso!");
      } else {
        await api.post(`/quiz`, payload);
        await fetchQuizzes();
        showToast("Quiz criado! Agora vincule-o a um módulo em Módulos para os alunos responderem.", 5000);
      }
      closeFormModal();
    } catch (erro) {
      const err = erro as ErroApi;
      console.error("Erro ao salvar quiz:", err);

      let msg = err?.response
        ? "Erro ao salvar quiz. Tente novamente."
        : erro instanceof Error && erro.message.startsWith("Não foi possível")
          ? erro.message
          : "Sem conexão com o servidor. Verifique a internet e tente de novo.";
      if (
        err?.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        msg = err.response.data.errors.join(", ");
      } else if (err?.response?.data?.error) {
        msg = err.response.data.error;
      }

      setErroForm(msg);
    }
  };

  const getIniciais = (nome: string): string => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatarConteudoCampo = (conteudo: unknown): React.ReactNode => {
    if (!conteudo) return "Sem conteúdo";

    // Se for uma string, tenta parsear como JSON
    let parsed = conteudo;
    if (typeof conteudo === "string") {
      // Verifica se é um arquivo de upload (caminho que começa com /uploads/)
      if (conteudo.startsWith("/uploads/") || conteudo.includes("/uploads/")) {
        const fileName = conteudo.split("/").pop() || "arquivo";
        const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
        const isImage = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "bmp",
        ].includes(fileExtension);

        return (
          <div className="upload-preview-campo">
            {isImage ? (
              <div>
                <img
                  src={`${ASSETS_BASE}${conteudo}`}
                  alt={fileName}
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    borderRadius: "4px",
                  }}
                />
                <br />
              </div>
            ) : null}
            <a
              href={`${ASSETS_BASE}${conteudo}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#3b82f6",
                textDecoration: "underline",
                fontSize: "0.9rem",
              }}
            >
              <Icone nome="arquivo" tamanho={16} /> {fileName}
            </a>
          </div>
        );
      }

      // Verifica se é uma URL de vídeo
      const videoUrlRegex =
        /(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.ogg)/i;
      if (videoUrlRegex.test(conteudo)) {
        return renderVideoPreview(conteudo);
      }

      try {
        parsed = JSON.parse(conteudo);
      } catch {
        // Não é JSON, retorna a string original
        return conteudo;
      }
    }

    // Se não for um objeto após o parse, retorna como está
    if (!isRecord(parsed)) {
      return String(conteudo);
    }

    // Formata alternativas (múltipla escolha)
    if (parsed.alternativas && Array.isArray(parsed.alternativas)) {
      return (
        <div className="quiz-alternativas">
          <strong>Alternativas:</strong>
          <ul>
            {(parsed.alternativas as Alternativa[]).map((alt, idx: number) => (
              <li key={idx} className={alt.correta ? "correta" : ""}>
                {alt.texto}
                {alt.correta && <span className="badge-correta">Correta</span>}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Formata opções (verdadeiro/falso ou associação)
    if (parsed.opcoes && Array.isArray(parsed.opcoes)) {
      return (
        <div className="quiz-opcoes">
          <strong>Opções:</strong>
          <ul>
            {parsed.opcoes.map((opc: string, idx: number) => (
              <li key={idx}>{opc}</li>
            ))}
          </ul>
          {Boolean(parsed.correta) && (
            <div className="resposta-correta">
              <strong>Resposta correta:</strong> {String(parsed.correta)}
            </div>
          )}
        </div>
      );
    }

    // Para outros tipos de objetos JSON, exibe formatado
    return (
      <pre className="json-formatted">{JSON.stringify(parsed, null, 2)}</pre>
    );
  };


  const perguntasNoEditor = fields.filter((f) => TIPOS_PERGUNTA.includes(f.tipo)).length;
  const tipoDoCampo = (c: CampoVinculado) =>
    String(c.tipo_campo || availableFields.find((a) => a.id_campo === c.id_campo)?.tipo_campo || "");
  const perguntasDo = (q: Quiz | null) => (q?.campos || []).filter((c) => TIPOS_PERGUNTA.includes(tipoDoCampo(c))).length;
  const opcoesPergunta = fieldOptions.filter((o) => TIPOS_PERGUNTA.includes(o.tipo));
  const opcoesApoio = fieldOptions.filter((o) => !TIPOS_PERGUNTA.includes(o.tipo));

  const editor = showFormModal
    ? createPortal(
        <FocusTrapComponent
          active={showFormModal && !confirmarDescarte}
          focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false, returnFocusOnDeactivate: true }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className="ec-fundo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ec-editor-titulo"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !confirmarDescarte) pedirFechar();
            }}
          >
            <div className="ec-editor">
              <header className="ec-editor__topo">
                <div>
                  <p className="ec-editor__sobretitulo">Escola de Discípulos · Quiz</p>
                  <h2 id="ec-editor-titulo">{quizToEdit ? "Editar quiz" : "Novo quiz"}</h2>
                </div>
                <button type="button" className="ec-fechar" onClick={pedirFechar} aria-label="Fechar">
                  <Icone nome="fechar" tamanho={20} />
                </button>
              </header>

              <form
                className="ec-editor__form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  acaoSalvar.executar(() => saveForm());
                }}
              >
                <div className="ec-editor__rolagem">
                  <details className="ec-passos" open={!quizToEdit}>
                    <summary>
                      <Icone nome="livro" tamanho={16} /> Como funciona o quiz
                    </summary>
                    <ol>
                      <li>
                        <strong>Dê um título</strong>
                        <span>É o nome que o aluno vê no módulo.</span>
                      </li>
                      <li>
                        <strong>Adicione as perguntas</strong>
                        <span>
                          Cada pergunta vale {PONTOS_POR_PERGUNTA} pontos. Em cada uma, marque a resposta certa.
                        </span>
                      </li>
                      <li>
                        <strong>Organize</strong>
                        <span>Arraste pela alça <Icone nome="arrastar" tamanho={13} /> para mudar a ordem. O aluno vê nessa ordem.</span>
                      </li>
                      <li>
                        <strong>Vincule a um módulo</strong>
                        <span>Depois de salvar, escolha o quiz na tela de Módulos para os alunos responderem.</span>
                      </li>
                    </ol>
                  </details>

                  <section className="ec-secao" aria-labelledby="ec-secao-info">
                    <h3 id="ec-secao-info" className="ec-secao__titulo">
                      <span className="ec-secao__num">1</span> Informações
                    </h3>
                    <div className="ec-campo">
                      <label className="ec-rotulo" htmlFor="quizModalTitulo">
                        Título <span className="ec-obrigatorio">obrigatório</span>
                      </label>
                      <input
                        id="quizModalTitulo"
                        ref={nameRef}
                        className="ec-input"
                        value={currentForm.nome}
                        maxLength={255}
                        onChange={(e) => {
                          setCurrentForm({ ...currentForm, nome: e.target.value });
                          setAlterado(true);
                        }}
                        placeholder="Ex.: Quiz do Módulo 1 – Fundamentos da Fé"
                        aria-describedby="quizModalTituloDica"
                      />
                      <p id="quizModalTituloDica" className="ec-dica">
                        Nome que o aluno vê (mínimo 3 letras).
                      </p>
                    </div>
                    <div className="ec-campo">
                      <label className="ec-rotulo" htmlFor="quizModalDescricao">
                        Instruções para o aluno <span className="ec-opcional">opcional</span>
                      </label>
                      <textarea
                        id="quizModalDescricao"
                        className="ec-input ec-input--area"
                        value={currentForm.descricao}
                        maxLength={2000}
                        rows={3}
                        onChange={(e) => {
                          setCurrentForm({ ...currentForm, descricao: e.target.value });
                          setAlterado(true);
                        }}
                        placeholder="Ex.: Responda depois de assistir à aula 1."
                      />
                    </div>
                    <label className="ec-chave" htmlFor="quizModalAtivo">
                      <input
                        id="quizModalAtivo"
                        type="checkbox"
                        role="switch"
                        checked={Boolean(currentForm.ativo)}
                        onChange={(e) => {
                          setCurrentForm({ ...currentForm, ativo: e.target.checked ? 1 : 0 });
                          setAlterado(true);
                        }}
                      />
                      <span className="ec-chave__trilho" aria-hidden />
                      <span className="ec-chave__texto">
                        <strong>{currentForm.ativo ? "Liberado para os alunos" : "Escondido dos alunos"}</strong>
                        <small>
                          {currentForm.ativo
                            ? "Quem estiver no módulo vinculado já pode responder."
                            : "Fica salvo, mas ninguém vê. Use enquanto ainda está montando."}
                        </small>
                      </span>
                    </label>
                  </section>

                  <section className="ec-secao" aria-labelledby="ec-secao-perguntas">
                    <div className="ec-secao__cabecalho">
                      <h3 id="ec-secao-perguntas" className="ec-secao__titulo">
                        <span className="ec-secao__num">2</span> Perguntas e conteúdo
                      </h3>
                      <span className="ec-resumo">
                        {perguntasNoEditor} {perguntasNoEditor === 1 ? "pergunta" : "perguntas"} ·{" "}
                        <strong>{perguntasNoEditor * PONTOS_POR_PERGUNTA} pontos</strong>
                      </span>
                    </div>
                    <p className="ec-dica">
                      O aluno vê nesta ordem. Arraste pela alça <Icone nome="arrastar" tamanho={13} /> para reorganizar.
                      O conteúdo de apoio (texto, vídeo, link, arquivo) aparece entre as perguntas e não vale pontos.
                    </p>

                    {fields.length === 0 ? (
                      <div className="ec-vazio">
                        <Icone nome="lista" tamanho={30} />
                        <p>Nenhuma pergunta ainda. Escolha um tipo abaixo para começar.</p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensores}
                        collisionDetection={closestCenter}
                        onDragEnd={aoSoltarItem}
                        accessibility={{
                          screenReaderInstructions: {
                            draggable:
                              "Para mudar a ordem, aperte espaço ou Enter, use as setas e aperte espaço ou Enter de novo para soltar. Esc cancela.",
                          },
                          announcements: {
                            onDragStart: () => "Item pego.",
                            onDragOver: ({ over }) =>
                              over ? `Sobre a posição ${fields.findIndex((f) => f.uid === over.id) + 1}.` : undefined,
                            onDragEnd: ({ over }) =>
                              over ? `Solto na posição ${fields.findIndex((f) => f.uid === over.id) + 1}.` : undefined,
                            onDragCancel: () => "Cancelado. O item voltou ao lugar.",
                          },
                        }}
                      >
                        <SortableContext items={fields.map((f) => f.uid)} strategy={verticalListSortingStrategy}>
                          <ol className="ec-lista">
                            {fields.map((f) => {
                              const Component = fieldOptions.find((o) => o.tipo === f.tipo)?.component;
                              if (!Component) return null;
                              const ehPergunta = TIPOS_PERGUNTA.includes(f.tipo);
                              const numero = fields.slice(0, fields.indexOf(f) + 1).filter((x) => TIPOS_PERGUNTA.includes(x.tipo)).length;
                              const extras: Record<string, unknown> =
                                f.tipo === "select" || f.tipo === "multipla_escolha" || f.tipo === "checkbox" ? { options: [] } : {};
                              return (
                                <ItemQuiz
                                  key={f.uid}
                                  item={f}
                                  numero={numero}
                                  ehPergunta={ehPergunta}
                                  onRenomear={(label) => atualizarItem(f.uid, { label })}
                                  onRemover={() => removeField(f.uid)}
                                >
                                  {TIPOS_CONSTRUIDOS.includes(f.tipo) ? (
                                    <ConstrutorPergunta
                                      id={f.uid}
                                      tipo={f.tipo}
                                      valor={f.conteudo}
                                      onChange={(v) => atualizarItem(f.uid, { conteudo: v })}
                                    />
                                  ) : (
                                    <Component
                                      id={String(f.uid)}
                                      name={`campo_${f.uid}`}
                                      label=""
                                      value={f.conteudo}
                                      onChange={(v: ValorCampo) => atualizarItem(f.uid, { conteudo: v })}
                                      {...extras}
                                    />
                                  )}
                                </ItemQuiz>
                              );
                            })}
                          </ol>
                        </SortableContext>
                      </DndContext>
                    )}

                    <div className="ec-adicionar">
                      <p className="ec-adicionar__titulo">
                        Adicionar pergunta <span>vale {PONTOS_POR_PERGUNTA} pontos</span>
                      </p>
                      <div className="ec-adicionar__grade">
                        {opcoesPergunta.map((opt) => (
                          <button
                            key={opt.tipo}
                            type="button"
                            className="ec-tipo ec-tipo--pergunta"
                            title={AJUDA_TIPO[opt.tipo]?.dica}
                            onClick={() => addField(opt.tipo)}
                          >
                            <Icone nome={INFO_TIPO[opt.tipo]?.icone || "lista"} tamanho={18} />
                            <span>
                              <strong>{INFO_TIPO[opt.tipo]?.nome || opt.label}</strong>
                              <small>{INFO_TIPO[opt.tipo]?.resumo}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="ec-adicionar__titulo">
                        Adicionar conteúdo de apoio <span>não vale pontos</span>
                      </p>
                      <div className="ec-adicionar__grade">
                        {opcoesApoio.map((opt) => (
                          <button
                            key={opt.tipo}
                            type="button"
                            className="ec-tipo"
                            title={AJUDA_TIPO[opt.tipo]?.dica}
                            onClick={() => addField(opt.tipo)}
                          >
                            <Icone nome={INFO_TIPO[opt.tipo]?.icone || "arquivo"} tamanho={18} />
                            <span>
                              <strong>{INFO_TIPO[opt.tipo]?.nome || opt.label}</strong>
                              <small>{INFO_TIPO[opt.tipo]?.resumo}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                <footer className="ec-editor__rodape">
                  {erroForm ? (
                    <p className="ec-erro" role="alert">
                      <Icone nome="alerta" tamanho={16} /> {erroForm}
                    </p>
                  ) : (
                    <p className="ec-rodape-info">
                      {perguntasNoEditor > 0
                        ? `${perguntasNoEditor} ${perguntasNoEditor === 1 ? "pergunta" : "perguntas"} · ${perguntasNoEditor * PONTOS_POR_PERGUNTA} pontos no total`
                        : "Adicione pelo menos uma pergunta para salvar."}
                    </p>
                  )}
                  <div className="ec-editor__botoes">
                    <button type="button" className="ec-btn ec-btn--fantasma" onClick={pedirFechar} disabled={acaoSalvar.executando}>
                      Cancelar
                    </button>
                    <BotaoCarregando
                      type="submit"
                      className="ec-btn ec-btn--primario"
                      carregando={acaoSalvar.executando}
                      textoCarregando={quizToEdit ? "Salvando…" : "Criando…"}
                    >
                      {quizToEdit ? "Salvar alterações" : "Criar quiz"}
                    </BotaoCarregando>
                  </div>
                </footer>
              </form>
            </div>
          </div>
        </FocusTrapComponent>,
        document.body
      )
    : null;

  const quizzesVisiveis = filtrarItens(quizzes, busca, filtro, (q) => q.titulo, (q) => Boolean(q.ativo));
  const ativosQuiz = quizzes.filter((q) => q.ativo).length;

  return (
    <>
      <PaginaSecretaria
        area="Escola de Discípulos"
        titulo="Quizzes"
        icone="concluido"
        descricao="Perguntas que o discípulo responde para concluir um módulo e ganhar pontos. Monte o quiz aqui e depois escolha-o no módulo."
        acao={{ rotulo: "Novo quiz", onClick: openCreateModal }}
        numeros={[
          { valor: quizzes.length, rotulo: quizzes.length === 1 ? "quiz" : "quizzes" },
          { valor: ativosQuiz, rotulo: ativosQuiz === 1 ? "liberado" : "liberados" },
          { valor: quizzes.length - ativosQuiz, rotulo: "escondidos" },
        ]}
      >
        <div className="sc-corpo sc-corpo--com-ranking">
          <ListaSecretaria
            titulo="Quizzes"
            total={quizzes.length}
            busca={busca}
            onBusca={setBusca}
            filtro={filtro}
            onFiltro={setFiltro}
            placeholderBusca="Buscar quiz pelo nome"
            vazio={loading ? "Carregando…" : quizzes.length ? "Nenhum quiz com esse filtro." : "Nenhum quiz ainda. Crie o primeiro no botão Novo quiz."}
            quantidadeVisivel={quizzesVisiveis.length}
          >
            {quizzesVisiveis.map((quiz) => {
              const n = perguntasDo(quiz);
              return (
                <ItemSecretaria
                  key={quiz.id}
                  titulo={quiz.titulo}
                  meta={`${n} ${n === 1 ? "pergunta" : "perguntas"} · ${n * PONTOS_POR_PERGUNTA} pts`}
                  ativo={Boolean(quiz.ativo)}
                  selecionado={selectedQuiz?.id === quiz.id}
                  icone="concluido"
                  onSelecionar={() => handleSelectQuiz(quiz)}
                  onAlternar={() => handleToggle(quiz.id)}
                />
              );
            })}
          </ListaSecretaria>

          {selectedQuiz ? (
            <DetalheSecretaria
              titulo={selectedQuiz.titulo}
              ativo={Boolean(selectedQuiz.ativo)}
              status={selectedQuiz.ativo ? "Liberado para os alunos" : "Escondido dos alunos"}
              acoes={
                <>
                  <button type="button" className="sc-btn sc-btn--primario" onClick={() => openEditModal(selectedQuiz.id)}>
                    <Icone nome="editar" tamanho={15} /> Editar quiz
                  </button>
                  <button
                    type="button"
                    className="sc-btn sc-btn--perigo"
                    onClick={() => pedirExclusao(selectedQuiz)}
                    aria-label={`Excluir o quiz ${selectedQuiz.titulo}`}
                    title="Excluir quiz"
                  >
                    <Icone nome="lixeira" tamanho={16} />
                  </button>
                </>
              }
            >
              {selectedQuiz.descricao && (
                <p className="sc-descricao">
                  <strong>Instruções para o aluno</strong>
                  {selectedQuiz.descricao}
                </p>
              )}
              <div className="ec-numeros">
                <div>
                  <strong>{perguntasDo(selectedQuiz)}</strong>
                  <span>{perguntasDo(selectedQuiz) === 1 ? "pergunta" : "perguntas"}</span>
                </div>
                <div>
                  <strong>{perguntasDo(selectedQuiz) * PONTOS_POR_PERGUNTA}</strong>
                  <span>pontos no total</span>
                </div>
                <div>
                  <strong>{(selectedQuiz.campos?.length || 0) - perguntasDo(selectedQuiz)}</strong>
                  <span>conteúdos de apoio</span>
                </div>
              </div>
              <p className="ec-lembrete">
                <Icone nome="alerta" tamanho={15} /> Para os alunos responderem, o quiz precisa estar escolhido em um módulo
                (Módulos → Editar módulo → Quiz do módulo).
              </p>

              <h3 className="sc-subtitulo">
                <Icone nome="olho" tamanho={17} /> Como o aluno vê
              </h3>
              {selectedQuiz.campos && selectedQuiz.campos.length > 0 ? (
                <ol className="ec-previa">
                  {selectedQuiz.campos.map((campo, index) => {
                    const tipo = tipoDoCampo(campo);
                    const ehPergunta = TIPOS_PERGUNTA.includes(tipo);
                    return (
                      <li key={index} className={`campo-card ${ehPergunta ? "campo-card--pergunta" : ""}`}>
                        <span className={`ec-selo ${ehPergunta ? "ec-selo--pergunta" : "ec-selo--apoio"}`}>
                          {index + 1}. {INFO_TIPO[tipo]?.nome || "Conteúdo"}
                          {ehPergunta ? ` · ${PONTOS_POR_PERGUNTA} pts` : ""}
                        </span>
                        <div className="campo-label">{campo.label || "Sem título"}</div>
                        {tipo === "verdadeiro_falso" ? (
                          <div className="campo-conteudo">
                            Resposta certa: <strong>{String(campo.conteudo) === "true" ? "Verdadeiro" : "Falso"}</strong>
                          </div>
                        ) : tipo !== "discursiva" ? (
                          <div className="campo-conteudo">{formatarConteudoCampo(campo.conteudo)}</div>
                        ) : (
                          <div className="campo-conteudo">O aluno responde escrevendo.</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="sc-vazio-conteudo">Este quiz ainda não tem perguntas. Clique em Editar quiz para adicionar.</p>
              )}
            </DetalheSecretaria>
          ) : (
            <DetalheVazio
              icone="concluido"
              texto={quizzes.length ? "Escolha um quiz na lista para ver as perguntas." : "Ainda não há quizzes. Crie o primeiro para usar nos módulos."}
              acao={{ rotulo: "Novo quiz", onClick: openCreateModal }}
            />
          )}

          <aside className="sc-lateral" aria-label="Ranking">
            <RankingCard
              ranking={ranking}
              limit={20}
              title="RANKING"
              subtitle="Top 20 Discípulos"
              theme="light"
              headerAction={
                <div className="ranking-acoes">
                  <BotoesExportar
                    tema="claro"
                    rotuloExcel="Excel"
                    onExcel={async () => exportarRanking(await moduloService.getRankingCompleto())}
                  />
                  <button type="button" className="ranking-btn-dar-pontos" onClick={() => setModalDarPontosAberto(true)}>
                    + Dar pontos
                  </button>
                </div>
              }
            />
          </aside>
        </div>
      </PaginaSecretaria>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <DarPontosModal
        open={modalDarPontosAberto}
        onConfirm={handleDarPontos}
        onCancel={() => setModalDarPontosAberto(false)}
      />

      {editor}


      <ConfirmModal
        open={confirmarDescarte}
        title="Descartar alterações?"
        message="Você mudou este quiz e ainda não salvou. Se sair agora, as mudanças se perdem."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        variant="danger"
        onConfirm={closeFormModal}
        onCancel={() => setConfirmarDescarte(false)}
      />

      <ConfirmModal
        open={!!quizParaExcluir}
        title="Excluir quiz"
        message={
          quizParaExcluir && quizParaExcluir.respostas > 0
            ? `"${quizParaExcluir.quiz.titulo}" já foi respondido por ${quizParaExcluir.alunos} ${quizParaExcluir.alunos === 1 ? "aluno" : "alunos"} (${quizParaExcluir.respostas} respostas). Excluir apaga essas respostas e não tem volta. Para só esconder dos alunos, deixe o quiz Inativo.`
            : `Excluir "${quizParaExcluir?.quiz.titulo || "este quiz"}"? Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={excluirQuiz}
        textoCarregando="Excluindo…"
        onCancel={() => setQuizParaExcluir(null)}
      />
    </>
  );
}
