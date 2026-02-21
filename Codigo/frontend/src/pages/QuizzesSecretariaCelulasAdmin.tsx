import React, { useEffect, useRef, useState } from "react";
import "../style/QuizzesSecretariaCelulasAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import InputModal from "../components/ui/InputModal";

import axios from "axios";

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
import { API_BASE, ASSETS_BASE } from "../config/api";
import type { Usuario } from "../services/usuarioService";
import RankingCard, { type RankItem } from "../components/modulos/RankingCard";
import DarPontosModal from "../components/ui/DarPontosModal";

/* TYPES */
type Quiz = {
  id: number;
  titulo: string;
  descricao?: string | null;
  ativo?: number;
  campos?: any[];
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
  conteudo: any;
};

const initialFormState: QuizForm = {
  id: null,
  nome: "",
  descricao: "",
  ativo: 1,
};

export default function QuizzesSecretariaCelulasAdmin() {
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
  const nameRef = useRef<HTMLInputElement | null>(null);

  const fieldOptions = [
    { label: "Texto", tipo: "texto", component: TextField },
    { label: "Número", tipo: "numero", component: NumberField },
    { label: "Data", tipo: "data", component: DateField },
    { label: "Link", tipo: "link", component: LinkField },
    { label: "Upload", tipo: "upload", component: UploadField },
    { label: "Vídeo", tipo: "video", component: VideoField },
    { label: "Área de Texto", tipo: "textarea", component: TextareaField },
    {
      label: "Múltipla Escolha",
      tipo: "multipla_escolha",
      component: MultipleChoiceField,
    },
    {
      label: "Verdadeiro/Falso",
      tipo: "verdadeiro_falso",
      component: TrueFalseField,
    },
    { label: "Discursiva", tipo: "discursiva", component: EssayField },
    { label: "Checkbox", tipo: "checkbox", component: CheckboxField },
    { label: "Seleção", tipo: "select", component: SelectField },
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
      const res = await axios.get(`${API_BASE}/quiz`);
      const mapped: Quiz[] = (res.data || []).map((q: any) => ({
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
      const res = await axios.get(`${API_BASE}/campo`, {
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
        (campo: any, index: number) => ({
          id_campo: campo.id_campo,
          label: campo.label || "",
          conteudo: campo.conteudo || "",
          ordem: index,
        })
      );

      await axios.put(`${API_BASE}/quiz/${id}`, {
        titulo: quiz.titulo,
        descricao: quiz.descricao,
        ativo: quiz.ativo === 1 ? false : true,
        campos: camposLimpos,
      });

      await fetchQuizzes();

      // Se o quiz alterado é o que está selecionado, atualizar a visualização
      if (selectedQuiz && selectedQuiz.id === id) {
        const res = await axios.get(`${API_BASE}/quiz/${id}`);
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
    conteudo: any = ""
  ): LocalField => {
    return {
      uid: Date.now() + Math.floor(Math.random() * 10000),
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

    let conteudoInicial: any = "";

    // Define conteúdo inicial baseado no tipo de campo
    if (tipo === "numero") {
      conteudoInicial = 0;
    } else if (tipo === "data") {
      conteudoInicial = "";
    } else if (tipo === "verdadeiro_falso") {
      conteudoInicial = "false";
    } else if (tipo === "multipla_escolha") {
      conteudoInicial = "A";
    } else if (tipo === "select" || tipo === "checkbox") {
      conteudoInicial = "";
    } else {
      conteudoInicial = "";
    }

    setFields((prev) => [
      ...prev,
      createLocalField(campo.id_campo, tipo!, label.trim(), conteudoInicial),
    ]);
  };

  const removeField = (uid: number) => {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
  };

  const openCreateModal = () => {
    setCurrentForm(initialFormState);
    setQuizToEdit(null);
    setFields([]);
    setShowFormModal(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const openEditModal = async (id: number) => {
    try {
      const res = await axios.get(`${API_BASE}/quiz/${id}`);
      const q = res.data;

      setCurrentForm({
        id: q.id_quiz ?? q.id ?? id,
        nome: q.titulo ?? "",
        descricao: q.descricao ?? "",
        ativo: q.ativo ?? 1,
      });

      const incomingFields = (q.campos ?? []).map((c: any, idx: number) => {
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
          if (!dateRegex.test(conteudoLimpo)) {
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
    setQuizToEdit(null);
    setCurrentForm(initialFormState);
    setFields([]);
  };

  // Função auxiliar para fazer upload de arquivo
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_BASE}/upload/campo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.path || response.data.url || response.data.filePath;
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage =
        error?.response?.data?.error || "Falha ao fazer upload do arquivo";
      throw new Error(errorMessage);
    }
  };

  const saveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!currentForm.nome.trim()) {
      showToast("Título do quiz é obrigatório");
      return;
    }

    // Usar uid para preservar todos os campos (evita colapsar questões com mesmo tipo/label)
    const uniqueFields = fields;

    // Processar uploads antes de montar o payload
    const processedFields = await Promise.all(
      uniqueFields.map(async (f) => {
        let conteudo = f.conteudo ?? "";

        // Se o conteúdo é um File (upload), fazer upload primeiro
        if (conteudo instanceof File) {
          try {
            conteudo = await uploadFile(conteudo);
          } catch (error) {
            showToast(`Erro ao fazer upload do arquivo: ${f.label}`);
            throw error;
          }
        }

        return { ...f, conteudo };
      })
    );

    const camposPayload = processedFields.map((f, index) => ({
      id_campo: f.id_campo,
      label: f.label ?? "",
      conteudo: f.conteudo ?? "",
      ordem: index,
    }));

    const payload: any = {
      titulo: currentForm.nome,
      descricao: currentForm.descricao || null,
      ativo: Boolean(currentForm.ativo),
      campos: camposPayload,
    };

    try {
      if (quizToEdit) {
        await axios.put(
          `${API_BASE}/quiz/${quizToEdit}`,
          payload
        );
        await fetchQuizzes();

        // Atualizar o quiz selecionado se for o que foi editado
        if (selectedQuiz && selectedQuiz.id === quizToEdit) {
          const res = await axios.get(
            `${API_BASE}/quiz/${quizToEdit}`
          );
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
        await axios.post(`${API_BASE}/quiz`, payload);
        await fetchQuizzes();
        showToast("Quiz criado com sucesso!");
      }
      closeFormModal();
    } catch (err: any) {
      console.error("Erro ao salvar quiz:", err);

      let msg = "Erro ao salvar quiz";
      if (
        err?.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        msg = err.response.data.errors.join(", ");
      } else if (err?.response?.data?.error) {
        msg = err.response.data.error;
      }

      showToast(msg);
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

  const formatarConteudoCampo = (conteudo: any): React.ReactNode => {
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
              📄 {fileName}
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
    if (typeof parsed !== "object" || parsed === null) {
      return String(conteudo);
    }

    // Formata alternativas (múltipla escolha)
    if (parsed.alternativas && Array.isArray(parsed.alternativas)) {
      return (
        <div className="quiz-alternativas">
          <strong>Alternativas:</strong>
          <ul>
            {parsed.alternativas.map((alt: any, idx: number) => (
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
          {parsed.correta && (
            <div className="resposta-correta">
              <strong>Resposta correta:</strong> {parsed.correta}
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

  const renderVideoPreview = (url: string): React.ReactNode => {
    const convertToEmbedUrl = (videoUrl: string): string | null => {
      try {
        // YouTube
        const youtubeRegex =
          /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const youtubeMatch = videoUrl.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}?cc_load_policy=1`;
        }

        // Vimeo
        const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
        const vimeoMatch = videoUrl.match(vimeoRegex);
        if (vimeoMatch && vimeoMatch[1]) {
          return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        // Link direto de vídeo
        if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
          return videoUrl;
        }

        return null;
      } catch {
        return null;
      }
    };

    const embedUrl = convertToEmbedUrl(url);
    if (!embedUrl) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      );
    }

    const isDirectVideo = embedUrl.match(/\.(mp4|webm|ogg)$/i);

    return (
      <div className="video-preview-campo" style={{ marginTop: "0.5rem" }}>
        {isDirectVideo ? (
          <video
            controls
            style={{
              width: "100%",
              maxWidth: "400px",
              height: "auto",
              borderRadius: "8px",
            }}
          >
            <source src={embedUrl} type="video/mp4" />
            Seu navegador não suporta o elemento de vídeo.
          </video>
        ) : (
          <iframe
            src={embedUrl}
            style={{
              width: "100%",
              maxWidth: "400px",
              height: "225px",
              border: "none",
              borderRadius: "8px",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video preview"
          />
        )}
      </div>
    );
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="medal-icon gold"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="#FFF"
            fontSize="12"
            fontWeight="bold"
          >
            1
          </text>
        </svg>
      );
    }
    if (position === 2) {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="medal-icon silver"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="#C0C0C0"
            stroke="#A8A8A8"
            strokeWidth="2"
          />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="#FFF"
            fontSize="12"
            fontWeight="bold"
          >
            2
          </text>
        </svg>
      );
    }
    if (position === 3) {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="medal-icon bronze"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="#CD7F32"
            stroke="#B87333"
            strokeWidth="2"
          />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="#FFF"
            fontSize="12"
            fontWeight="bold"
          >
            3
          </text>
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="quizzes-page page-with-fixed-header">
      <Header />
      <main id="main-content" className="page" tabIndex={-1}>
        <h1 className="page-title">SECRETARIA DAS CÉLULAS</h1>

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
                  onClick={() => handleSelectQuiz(quiz)}
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
                <button
                  type="button"
                  className="ranking-btn-dar-pontos"
                  onClick={() => setModalDarPontosAberto(true)}
                >
                  + Dar pontos
                </button>
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
        title="Label do campo"
        label="Digite o label do campo"
        placeholder="Ex: Nome completo"
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

            <form onSubmit={saveForm}>
              <label>Título</label>
              <input
                ref={nameRef}
                value={currentForm.nome}
                onChange={(e) =>
                  setCurrentForm({ ...currentForm, nome: e.target.value })
                }
                required
              />

              <label>Descrição</label>
              <textarea
                value={currentForm.descricao}
                onChange={(e) =>
                  setCurrentForm({ ...currentForm, descricao: e.target.value })
                }
                rows={4}
              />

              <label>Ativo</label>
              <select
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

              <h3>Campos do Quiz</h3>

              <div className="fields-container">
                {fields.length === 0 && (
                  <p className="muted">Nenhum campo adicionado.</p>
                )}

                {fields.map((f) => {
                  const Component = fieldOptions.find(
                    (o) => o.tipo === f.tipo
                  )?.component;
                  if (!Component) return null;

                  // Propriedades adicionais para campos específicos
                  const additionalProps: any = {};

                  if (
                    f.tipo === "select" ||
                    f.tipo === "multipla_escolha" ||
                    f.tipo === "checkbox"
                  ) {
                    additionalProps.options = [];
                  }

                  return (
                    <div key={f.uid} className="field-wrapper">
                      <div className="dynamic-field-row">
                        <Component
                          id={String(f.uid)}
                          name={`campo_${f.uid}`}
                          label={f.label}
                          value={f.conteudo}
                          onChange={(v: any) =>
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
                        <button
                          type="button"
                          className="field-remove-btn"
                          onClick={() => removeField(f.uid)}
                          title="Remover campo"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="field-add-buttons">
                {fieldOptions.map((opt) => (
                  <button
                    key={opt.tipo}
                    type="button"
                    onClick={() => addField(opt.tipo)}
                  >
                    + {opt.label}
                  </button>
                ))}
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  Salvar
                </button>

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
