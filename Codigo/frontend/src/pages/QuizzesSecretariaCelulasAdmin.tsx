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
import "../style/QuizzesSecretariaCelulasAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import InputModal from "../components/ui/InputModal";

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
      const certas = alts.filter((a) => a.correta).length;
      if (certas === 0) return `${nomeCampo}: marque qual alternativa é a correta.`;
    } else if (c.tipo === "select") {
      const sel = parseSelect(c.conteudo);
      if (sel.opcoes.length < 2) return `${nomeCampo}: adicione pelo menos 2 opções.`;
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
      className={`qz-item ${ehPergunta ? "qz-item--pergunta" : "qz-item--apoio"}${isDragging ? " qz-item--arrastando" : ""}`}
    >
      <div className="qz-item__topo">
        <button
          type="button"
          className="qz-item__alca"
          aria-label={`Arrastar "${item.label}" para mudar a ordem`}
          title="Arraste para mudar a ordem"
          {...attributes}
          {...listeners}
        >
          <Icone nome="arrastar" tamanho={18} />
        </button>
        <span className="qz-item__numero" aria-hidden>
          {ehPergunta ? numero : "•"}
        </span>
        <span className={`qz-selo ${ehPergunta ? "qz-selo--pergunta" : "qz-selo--apoio"}`}>
          {info?.nome || item.tipo}
          {ehPergunta ? ` · ${PONTOS_POR_PERGUNTA} pts` : " · apoio"}
        </span>
        <button type="button" className="qz-item__remover" onClick={onRemover} aria-label={`Remover "${item.label}"`} title="Remover">
          <Icone nome="lixeira" tamanho={16} />
        </button>
      </div>
      <label className="qz-rotulo" htmlFor={`qz-enunciado-${item.uid}`}>
        {AJUDA_TIPO[item.tipo]?.rotulo || "Título"}
      </label>
      <input
        id={`qz-enunciado-${item.uid}`}
        className="qz-input qz-input--enunciado"
        value={item.label}
        maxLength={255}
        onChange={(e) => onRenomear(e.target.value)}
        placeholder={ehPergunta ? "Escreva a pergunta" : "Título do conteúdo"}
      />
      {AJUDA_TIPO[item.tipo] && <p className="qz-ajuda-tipo">{AJUDA_TIPO[item.tipo].dica}</p>}
      <div className="qz-item__corpo field-wrapper">{children}</div>
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

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelModalTipo, setLabelModalTipo] = useState<string | null>(null);

  const addField = (tipo: string) => {
    setLabelModalTipo(tipo);
    setLabelModalOpen(true);
  };

  const confirmAddField = (label: string) => {
    if (!label.trim()) return;
    const tipo = labelModalTipo;
    setLabelModalOpen(false);
    setLabelModalTipo(null);

    const campo = availableFields.find(
      (c) => String(c.tipo_campo).toLowerCase() === tipo!.toLowerCase()
    );
    if (!campo) {
      showToast(`Nenhum campo disponível para o tipo ${tipo}`);
      return;
    }

    let conteudoInicial: ValorCampo = "";

    // Define conteúdo inicial baseado no tipo de campo
    if (tipo === "numero") {
      conteudoInicial = 0;
    } else if (tipo === "data") {
      conteudoInicial = "";
    } else if (tipo === "verdadeiro_falso") {
      conteudoInicial = "false";
    } else if (tipo === "select" || tipo === "checkbox") {
      conteudoInicial = "";
    } else {
      conteudoInicial = "";
    }

    setErroForm(null);
    setAlterado(true);
    setFields((prev) => [
      ...prev,
      createLocalField(campo.id_campo, tipo!, label.trim(), conteudoInicial),
    ]);
    // Leva a tela até o item novo
    setTimeout(() => document.querySelector(".qz-lista > li:last-child")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
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
          active={showFormModal && !labelModalOpen && !confirmarDescarte}
          focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false, returnFocusOnDeactivate: true }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className="qz-fundo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qz-editor-titulo"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !labelModalOpen && !confirmarDescarte) pedirFechar();
            }}
          >
            <div className="qz-editor">
              <header className="qz-editor__topo">
                <div>
                  <p className="qz-editor__sobretitulo">Escola de Discípulos · Quiz</p>
                  <h2 id="qz-editor-titulo">{quizToEdit ? "Editar quiz" : "Novo quiz"}</h2>
                </div>
                <button type="button" className="qz-fechar" onClick={pedirFechar} aria-label="Fechar">
                  <Icone nome="fechar" tamanho={20} />
                </button>
              </header>

              <form
                className="qz-editor__form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  acaoSalvar.executar(() => saveForm());
                }}
              >
                <div className="qz-editor__rolagem">
                  <details className="qz-passos" open={!quizToEdit}>
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

                  <section className="qz-secao" aria-labelledby="qz-secao-info">
                    <h3 id="qz-secao-info" className="qz-secao__titulo">
                      <span className="qz-secao__num">1</span> Informações
                    </h3>
                    <div className="qz-campo">
                      <label className="qz-rotulo" htmlFor="quizModalTitulo">
                        Título <span className="qz-obrigatorio">obrigatório</span>
                      </label>
                      <input
                        id="quizModalTitulo"
                        ref={nameRef}
                        className="qz-input"
                        value={currentForm.nome}
                        maxLength={255}
                        onChange={(e) => {
                          setCurrentForm({ ...currentForm, nome: e.target.value });
                          setAlterado(true);
                        }}
                        placeholder="Ex.: Quiz do Módulo 1 – Fundamentos da Fé"
                        aria-describedby="quizModalTituloDica"
                      />
                      <p id="quizModalTituloDica" className="qz-dica">
                        Nome que o aluno vê (mínimo 3 letras).
                      </p>
                    </div>
                    <div className="qz-campo">
                      <label className="qz-rotulo" htmlFor="quizModalDescricao">
                        Instruções para o aluno <span className="qz-opcional">opcional</span>
                      </label>
                      <textarea
                        id="quizModalDescricao"
                        className="qz-input qz-input--area"
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
                    <label className="qz-chave" htmlFor="quizModalAtivo">
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
                      <span className="qz-chave__trilho" aria-hidden />
                      <span className="qz-chave__texto">
                        <strong>{currentForm.ativo ? "Liberado para os alunos" : "Escondido dos alunos"}</strong>
                        <small>
                          {currentForm.ativo
                            ? "Quem estiver no módulo vinculado já pode responder."
                            : "Fica salvo, mas ninguém vê. Use enquanto ainda está montando."}
                        </small>
                      </span>
                    </label>
                  </section>

                  <section className="qz-secao" aria-labelledby="qz-secao-perguntas">
                    <div className="qz-secao__cabecalho">
                      <h3 id="qz-secao-perguntas" className="qz-secao__titulo">
                        <span className="qz-secao__num">2</span> Perguntas e conteúdo
                      </h3>
                      <span className="qz-resumo">
                        {perguntasNoEditor} {perguntasNoEditor === 1 ? "pergunta" : "perguntas"} ·{" "}
                        <strong>{perguntasNoEditor * PONTOS_POR_PERGUNTA} pontos</strong>
                      </span>
                    </div>
                    <p className="qz-dica">
                      O aluno vê nesta ordem. Arraste pela alça <Icone nome="arrastar" tamanho={13} /> para reorganizar.
                      O conteúdo de apoio (texto, vídeo, link, arquivo) aparece entre as perguntas e não vale pontos.
                    </p>

                    {fields.length === 0 ? (
                      <div className="qz-vazio">
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
                          <ol className="qz-lista">
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
                                  <Component
                                    id={String(f.uid)}
                                    name={`campo_${f.uid}`}
                                    label=""
                                    value={f.conteudo}
                                    onChange={(v: ValorCampo) => atualizarItem(f.uid, { conteudo: v })}
                                    {...extras}
                                  />
                                </ItemQuiz>
                              );
                            })}
                          </ol>
                        </SortableContext>
                      </DndContext>
                    )}

                    <div className="qz-adicionar">
                      <p className="qz-adicionar__titulo">
                        Adicionar pergunta <span>vale {PONTOS_POR_PERGUNTA} pontos</span>
                      </p>
                      <div className="qz-adicionar__grade">
                        {opcoesPergunta.map((opt) => (
                          <button
                            key={opt.tipo}
                            type="button"
                            className="qz-tipo qz-tipo--pergunta"
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
                      <p className="qz-adicionar__titulo">
                        Adicionar conteúdo de apoio <span>não vale pontos</span>
                      </p>
                      <div className="qz-adicionar__grade">
                        {opcoesApoio.map((opt) => (
                          <button
                            key={opt.tipo}
                            type="button"
                            className="qz-tipo"
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

                <footer className="qz-editor__rodape">
                  {erroForm ? (
                    <p className="qz-erro" role="alert">
                      <Icone nome="alerta" tamanho={16} /> {erroForm}
                    </p>
                  ) : (
                    <p className="qz-rodape-info">
                      {perguntasNoEditor > 0
                        ? `${perguntasNoEditor} ${perguntasNoEditor === 1 ? "pergunta" : "perguntas"} · ${perguntasNoEditor * PONTOS_POR_PERGUNTA} pontos no total`
                        : "Adicione pelo menos uma pergunta para salvar."}
                    </p>
                  )}
                  <div className="qz-editor__botoes">
                    <button type="button" className="qz-btn qz-btn--fantasma" onClick={pedirFechar} disabled={acaoSalvar.executando}>
                      Cancelar
                    </button>
                    <BotaoCarregando
                      type="submit"
                      className="qz-btn qz-btn--primario"
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

  return (
    <div className="quizzes-page page-with-fixed-header">
      <Header />
      <main id="main-content" className="page" tabIndex={-1}>
        <h1 className="page-title">Secretaria das Células</h1>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="quizzes-layout">
          {/* Coluna esquerda - Lista de Quizzes */}
          <aside className="panel quizzes-left" aria-label="Lista de quizzes">
            <div className="list-header">
              <h2>Quizzes</h2>
              <span className="count">{quizzes.length}</span>
            </div>
            <div className="list">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`quiz-item ${selectedQuiz?.id === quiz.id ? "selected" : ""} ${!quiz.ativo ? "inactive" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectQuiz(quiz)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectQuiz(quiz);
                    }
                  }}
                >
                  <div className="quiz-item__info">
                    <span className="quiz-item__name">{quiz.titulo}</span>
                  </div>
                  <button
                    className={`btn-status ${quiz.ativo ? "active" : "inactive"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(quiz.id);
                    }}
                    title={quiz.ativo ? "Esconder dos alunos" : "Liberar para os alunos"}
                    aria-label={`${quiz.titulo}: ${quiz.ativo ? "ativo, clique para esconder dos alunos" : "inativo, clique para liberar"}`}
                  >
                    {quiz.ativo ? "Ativo" : "Inativo"}
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-create" onClick={openCreateModal}>
              + CRIAR QUIZ
            </button>
          </aside>

          {/* Coluna central - Visualização do Quiz */}
          <section className="panel quizzes-center" aria-label="Detalhes do quiz">
            {selectedQuiz ? (
              <div className="quiz-card">
                <div className="quiz-header">
                  <div className="quiz-title-area">
                    <h2 className="quiz-title">{selectedQuiz.titulo}</h2>
                    <span className={`badge badge-${selectedQuiz.ativo ? "active" : "inactive"}`}>
                      {selectedQuiz.ativo ? "Liberado para os alunos" : "Escondido dos alunos"}
                    </span>
                  </div>
                  <div className="quiz-actions">
                    <button className="btn-edit" onClick={() => openEditModal(selectedQuiz.id)}>
                      <Icone nome="editar" tamanho={15} /> Editar
                    </button>
                    <button
                      className="btn-excluir-quiz"
                      onClick={() => pedirExclusao(selectedQuiz)}
                      aria-label={`Excluir o quiz ${selectedQuiz.titulo}`}
                      title="Excluir quiz"
                    >
                      <Icone nome="lixeira" tamanho={16} />
                    </button>
                  </div>
                </div>

                {selectedQuiz.descricao && (
                  <div className="quiz-description">
                    <h3>Instruções para o aluno</h3>
                    <p>{selectedQuiz.descricao}</p>
                  </div>
                )}

                <div className="qz-numeros">
                  <div>
                    <strong>{perguntasDo(selectedQuiz)}</strong>
                    <span>{perguntasDo(selectedQuiz) === 1 ? "pergunta" : "perguntas"}</span>
                  </div>
                  <div>
                    <strong>{perguntasDo(selectedQuiz) * PONTOS_POR_PERGUNTA}</strong>
                    <span>pontos</span>
                  </div>
                  <div>
                    <strong>{(selectedQuiz.campos?.length || 0) - perguntasDo(selectedQuiz)}</strong>
                    <span>conteúdos de apoio</span>
                  </div>
                </div>
                <p className="qz-lembrete">
                  <Icone nome="alerta" tamanho={15} /> Para os alunos responderem, o quiz precisa estar vinculado a um módulo
                  (tela de Módulos → editar módulo → Quiz).
                </p>

                {selectedQuiz.campos && selectedQuiz.campos.length > 0 ? (
                  <div className="quiz-fields">
                    <h3>Como o aluno vê</h3>
                    <ol className="qz-previa">
                      {selectedQuiz.campos.map((campo, index) => {
                        const tipo = tipoDoCampo(campo);
                        const ehPergunta = TIPOS_PERGUNTA.includes(tipo);
                        return (
                          <li key={index} className={`campo-card ${ehPergunta ? "campo-card--pergunta" : ""}`}>
                            <span className={`qz-selo ${ehPergunta ? "qz-selo--pergunta" : "qz-selo--apoio"}`}>
                              {INFO_TIPO[tipo]?.nome || "Conteúdo"}
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
                  </div>
                ) : (
                  <div className="quiz-empty">
                    <p>Este quiz ainda não tem perguntas. Clique em Editar para adicionar.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="quiz-placeholder">
                <p>Selecione um quiz na lista para ver as perguntas, ou crie um novo.</p>
              </div>
            )}
          </section>

          {/* Coluna direita - Ranking */}
          <aside className="panel quizzes-right" aria-label="Ranking">
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
        </section>
      </main>

      <Footer />

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

      <InputModal
        open={labelModalOpen}
        title={
          labelModalTipo && TIPOS_PERGUNTA.includes(labelModalTipo)
            ? `Nova pergunta · ${INFO_TIPO[labelModalTipo]?.nome || ""}`
            : `Novo conteúdo · ${(labelModalTipo && INFO_TIPO[labelModalTipo]?.nome) || ""}`
        }
        label={(labelModalTipo && AJUDA_TIPO[labelModalTipo]?.rotulo) || "Título do campo"}
        placeholder={
          labelModalTipo === "verdadeiro_falso"
            ? "Ex: Jesus nasceu em Belém"
            : labelModalTipo && TIPOS_PERGUNTA.includes(labelModalTipo)
              ? "Ex: Quem foi o primeiro rei de Israel?"
              : "Ex: Leia antes de responder"
        }
        hint={(labelModalTipo && AJUDA_TIPO[labelModalTipo]?.dica) || undefined}
        onConfirm={confirmAddField}
        onCancel={() => {
          setLabelModalOpen(false);
          setLabelModalTipo(null);
        }}
      />

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
    </div>
  );
}
