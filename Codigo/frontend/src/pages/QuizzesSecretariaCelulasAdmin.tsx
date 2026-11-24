import type { ErroApi } from "../utils/errorUtils";
import React, { useEffect, useRef, useState } from "react";
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
import Icone from "../components/ui/Icone";

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

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
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
    try {
      const quiz = quizzes.find((q) => q.id === id);
      if (!quiz) return;

      const camposLimpos = (quiz.campos || []).map(
        (campo: CampoVinculado, index: number) => ({
          id_campo: campo.id_campo,
          label: campo.label || "",
          conteudo: campo.conteudo || "",
          ordem: index,
        })
      );

      await api.put(`/quiz/${id}`, {
        titulo: quiz.titulo,
        descricao: quiz.descricao,
        ativo: quiz.ativo === 1 ? false : true,
        campos: camposLimpos,
      });

      await fetchQuizzes();

      // Se o quiz alterado é o que está selecionado, atualizar a visualização
      if (selectedQuiz && selectedQuiz.id === id) {
        const res = await api.get(`/quiz/${id}`);
        const q = res.data;
        setSelectedQuiz({
          id: q.id_quiz ?? q.id ?? id,
          titulo: q.titulo,
          descricao: q.descricao ?? "",
          ativo: q.ativo ?? 1,
          campos: q.campos ?? [],
        });
      }
    } catch (error) {
      console.error("Erro ao alternar quiz:", error);
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
    setFields((prev) => [
      ...prev,
      createLocalField(campo.id_campo, tipo!, label.trim(), conteudoInicial),
    ]);
  };

  const moverField = (uid: number, dir: -1 | 1) => {
    setFields((prev) => {
      const i = prev.findIndex((f) => f.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  const removeField = (uid: number) => {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
  };

  const openCreateModal = () => {
    setCurrentForm(initialFormState);
    setQuizToEdit(null);
    setFields([]);
    setErroForm(null);
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
      setQuizToEdit(q.id_quiz ?? q.id ?? id);
      setShowFormModal(true);
      setTimeout(() => nameRef.current?.focus(), 100);
    } catch (err) {
      console.error("Erro ao carregar quiz:", err);
      showToast("Erro ao carregar quiz para edição.");
    }
  };

  const closeFormModal = () => {
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
        label: f.label ?? "",
        // O banco guarda texto: Verdadeiro/Falso vira "true"/"false"
        conteudo: typeof f.conteudo === "boolean" ? String(f.conteudo) : f.conteudo ?? "",
        ordem: index,
      }));

      const payload = {
        titulo: currentForm.nome.trim(),
        descricao: currentForm.descricao || null,
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
        showToast("Quiz criado com sucesso!");
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
                  className={`quiz-item ${
                    selectedQuiz?.id === quiz.id ? "selected" : ""
                  } ${!quiz.ativo ? "inactive" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectQuiz(quiz)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.target as HTMLElement).click(); } }}
                >
                  <div className="quiz-item__info">
                    <span className="quiz-item__name">{quiz.titulo}</span>
                  </div>
                  <button
                    className={`btn-status ${
                      quiz.ativo ? "active" : "inactive"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(quiz.id);
                    }}
                    title={quiz.ativo ? "Desativar quiz" : "Ativar quiz"}
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
          <section
            className="panel quizzes-center"
            aria-label="Detalhes do quiz"
          >
            {selectedQuiz ? (
              <div className="quiz-card">
                <div className="quiz-header">
                  <div className="quiz-title-area">
                    <h2 className="quiz-title">{selectedQuiz.titulo}</h2>
                    <span
                      className={`badge badge-${
                        selectedQuiz.ativo ? "active" : "inactive"
                      }`}
                    >
                      {selectedQuiz.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="quiz-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(selectedQuiz.id)}
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {selectedQuiz.descricao && (
                  <div className="quiz-description">
                    <h3>Descrição</h3>
                    <p>{selectedQuiz.descricao}</p>
                  </div>
                )}

                <div className="quiz-meta">
                  <div className="meta-item">
                    <span className="meta-label">Campos:</span>
                    <span className="meta-value">
                      {selectedQuiz.campos?.length || 0}
                    </span>
                  </div>
                </div>

                {selectedQuiz.campos && selectedQuiz.campos.length > 0 ? (
                  <div className="quiz-fields">
                    <h3>Campos Personalizados</h3>
                    <div className="campos-grid">
                      {selectedQuiz.campos.map((campo, index) => (
                        <div key={index} className="campo-card">
                          <div className="campo-label">
                            {campo.label || "Sem label"}
                          </div>
                          <div className="campo-conteudo">
                            {formatarConteudoCampo(campo.conteudo)}
                          </div>
                          {campo.obrigatorio && (
                            <span className="campo-required">Obrigatório</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="quiz-empty">
                    <p>Este quiz não possui campos cadastrados.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="quiz-placeholder">
                <p>Selecione um quiz na lista para visualizar</p>
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
                  <button
                    type="button"
                    className="ranking-btn-dar-pontos"
                    onClick={() => setModalDarPontosAberto(true)}
                  >
                    + Dar pontos
                  </button>
                </div>
              }
            />
          </aside>
        </section>
      </main>

      <Footer />

      {toast && <div className="toast">{toast}</div>}

      <DarPontosModal
        open={modalDarPontosAberto}
        onConfirm={handleDarPontos}
        onCancel={() => setModalDarPontosAberto(false)}
      />

      <InputModal
        open={labelModalOpen}
        title={
          labelModalTipo && TIPOS_PERGUNTA.includes(labelModalTipo)
            ? "Nova pergunta"
            : "Novo conteúdo"
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

      {/* FORM MODAL */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <h2>{quizToEdit ? "Editar Quiz" : "Criar Novo Quiz"}</h2>

            <details className="quiz-ajuda" open={!quizToEdit}>
              <summary>Como montar um quiz</summary>
              <ol>
                <li>Dê um <strong>título</strong> (é o nome que o aluno vê).</li>
                <li>
                  Adicione as <strong>perguntas</strong> nos botões verdes. Cada pergunta vale 10 pontos.
                  Em cada uma, <strong>marque a resposta certa</strong>.
                </li>
                <li>
                  Se quiser, adicione <strong>conteúdo de apoio</strong> (texto, vídeo, link, arquivo) — aparece
                  para o aluno na mesma ordem, mas não vale pontos.
                </li>
                <li>
                  Clique em <strong>Salvar</strong>. Depois vincule o quiz a um módulo na tela de Módulos para os
                  alunos responderem.
                </li>
              </ol>
            </details>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                acaoSalvar.executar(() => saveForm());
              }}
            >
              <label htmlFor="quizModalTitulo">Título *</label>
              <input
                id="quizModalTitulo"
                ref={nameRef}
                value={currentForm.nome}
                onChange={(e) =>
                  setCurrentForm({ ...currentForm, nome: e.target.value })
                }
                required
                minLength={3}
                placeholder="Ex: Quiz do Módulo 1 – Fundamentos da Fé"
                aria-describedby="quizModalTituloDica"
              />
              <p id="quizModalTituloDica" className="quiz-dica">
                Nome que aparece para o aluno e na lista de quizzes (mínimo 3 letras).
              </p>

              <label htmlFor="quizModalDescricao">Descrição (opcional)</label>
              <textarea
                id="quizModalDescricao"
                value={currentForm.descricao}
                onChange={(e) =>
                  setCurrentForm({ ...currentForm, descricao: e.target.value })
                }
                rows={4}
                placeholder="Ex: Responda depois de assistir à aula 1."
                aria-describedby="quizModalDescricaoDica"
              />
              <p id="quizModalDescricaoDica" className="quiz-dica">
                Instrução mostrada ao aluno antes das perguntas.
              </p>

              <label htmlFor="quizModalAtivo">Situação</label>
              <select
                id="quizModalAtivo"
                value={currentForm.ativo}
                onChange={(e) =>
                  setCurrentForm({
                    ...currentForm,
                    ativo: Number(e.target.value),
                  })
                }
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
              <p className="quiz-dica">
                <strong>Ativo</strong>: alunos podem responder. <strong>Inativo</strong>: fica salvo, mas escondido
                dos alunos (use enquanto ainda está montando).
              </p>

              <h3>Perguntas e conteúdo</h3>
              <p className="quiz-dica">
                Aparecem para o aluno nesta ordem. Use ↑ e ↓ para reorganizar.
              </p>

              <div className="fields-container">
                {fields.length === 0 && (
                  <p className="muted">Nenhum campo adicionado.</p>
                )}

                {fields.map((f, idx) => {
                  const Component = fieldOptions.find(
                    (o) => o.tipo === f.tipo
                  )?.component;
                  if (!Component) return null;

                  // Propriedades adicionais para campos específicos
                  const additionalProps: Record<string, unknown> = {};

                  if (
                    f.tipo === "select" ||
                    f.tipo === "multipla_escolha" ||
                    f.tipo === "checkbox"
                  ) {
                    additionalProps.options = [];
                  }

                  return (
                    <div key={f.uid} className="field-wrapper">
                      <div className="quiz-campo-tipo">
                        <span className={`quiz-campo-badge ${TIPOS_PERGUNTA.includes(f.tipo) ? "pergunta" : "apoio"}`}>
                          {fieldOptions.find((o) => o.tipo === f.tipo)?.label}
                          {TIPOS_PERGUNTA.includes(f.tipo) ? " · vale 10 pts" : " · não vale pontos"}
                        </span>
                        {AJUDA_TIPO[f.tipo] && <p className="quiz-dica">{AJUDA_TIPO[f.tipo].dica}</p>}
                      </div>
                      <div className="dynamic-field-row">
                        <Component
                          id={String(f.uid)}
                          name={`campo_${f.uid}`}
                          label={f.label}
                          value={f.conteudo}
                          onChange={(v: ValorCampo) =>
                            setFields((prev) =>
                              prev.map((fld) =>
                                fld.uid === f.uid
                                  ? { ...fld, conteudo: v }
                                  : fld
                              )
                            )
                          }
                          {...additionalProps}
                        />
                        <div className="quiz-campo-ordem">
                          <button
                            type="button"
                            className="field-move-btn"
                            onClick={() => moverField(f.uid, -1)}
                            disabled={idx === 0}
                            title="Subir"
                            aria-label="Subir campo"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="field-move-btn"
                            onClick={() => moverField(f.uid, 1)}
                            disabled={idx === fields.length - 1}
                            title="Descer"
                            aria-label="Descer campo"
                          >
                            ↓
                          </button>
                        </div>
                        <button
                          type="button"
                          className="field-remove-btn"
                          onClick={() => removeField(f.uid)}
                          title="Remover campo"
                        >
                          <Icone nome="fechar" tamanho={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="quiz-grupo-titulo">Adicionar pergunta (vale pontos)</p>
              <div className="field-add-buttons">
                {fieldOptions
                  .filter((opt) => TIPOS_PERGUNTA.includes(opt.tipo))
                  .map((opt) => (
                    <button
                      key={opt.tipo}
                      type="button"
                      className="btn-add-pergunta"
                      title={AJUDA_TIPO[opt.tipo]?.dica}
                      onClick={() => addField(opt.tipo)}
                    >
                      + {opt.label}
                    </button>
                  ))}
              </div>
              <p className="quiz-grupo-titulo">Adicionar conteúdo de apoio (não vale pontos)</p>
              <div className="field-add-buttons">
                {fieldOptions
                  .filter((opt) => !TIPOS_PERGUNTA.includes(opt.tipo))
                  .map((opt) => (
                    <button
                      key={opt.tipo}
                      type="button"
                      title={AJUDA_TIPO[opt.tipo]?.dica}
                      onClick={() => addField(opt.tipo)}
                    >
                      + {opt.label}
                    </button>
                  ))}
              </div>

              {erroForm && (
                <div className="quiz-erro-form" role="alert">
                  {erroForm}
                </div>
              )}

              <div className="modal-actions">
                <BotaoCarregando
                  type="submit"
                  className="save-btn"
                  carregando={acaoSalvar.executando}
                  textoCarregando={quizToEdit ? "Salvando alterações…" : "Criando quiz…"}
                >
                  Salvar
                </BotaoCarregando>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeFormModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
