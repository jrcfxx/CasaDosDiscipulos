import React, { useEffect, useRef, useState } from "react";
import "../style/FormulariosSecretariaCelulasAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import InputModal from "../components/ui/InputModal";
import Toast from "../components/ui/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";

import formularioService, { FormularioCampo } from "../services/formularioService";
import formularioRespostaService from "../services/formularioRespostaService";
import celulaService from "../services/celulaService";
import campoService from "../services/campoService";
import { uploadCampo, isImagePath } from "../services/uploadService";
import { ASSETS_BASE } from "../config/api";

import TextField from "../components/fields/TextField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";

/* TYPES */
type Formulario = {
  id: number;
  titulo: string;
  descricao?: string | null;
  ativo?: number;
  campos?: any[];
};

type FormularioForm = {
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

type Resposta = {
  id_resposta: number;
  id_formulario: number;
  id_celula: number;
  id_usuario?: number;
  data_resposta: string;
  nome_celula?: string;
  nome_lider?: string;
  campos?: Array<{
    label?: string;
    valor?: string;
    resposta?: string;
    conteudo?: string;
    tipo_campo?: string;
  }>;
};

const initialFormState: FormularioForm = {
  id: null,
  nome: "",
  descricao: "",
  ativo: 1,
};

export default function FormulariosSecretariaCelulasAdmin() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [selectedFormulario, setSelectedFormulario] =
    useState<Formulario | null>(null);
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([]);
  const [loading, setLoading] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formularioToEdit, setFormularioToEdit] = useState<number | null>(null);
  const [currentForm, setCurrentForm] =
    useState<FormularioForm>(initialFormState);

  const [fields, setFields] = useState<LocalField[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [formularioToDelete, setFormularioToDelete] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [respostasLoading, setRespostasLoading] = useState(false);
  const [expandedRespostaId, setExpandedRespostaId] = useState<number | null>(
    null
  );
  const [respostaDetalhe, setRespostaDetalhe] = useState<Resposta | null>(null);
  const [celulas, setCelulas] = useState<
    Array<{ id_celula: number; nome: string }>
  >([]);
  const [abaAtiva, setAbaAtiva] = useState<
    "formulario" | "respostas" | "dashboard"
  >("formulario");

  const fieldOptions = [
    { label: "Texto", tipo: "texto", component: TextField },
    { label: "Número", tipo: "numero", component: NumberField },
    { label: "Data", tipo: "data", component: DateField },
    { label: "Link", tipo: "link", component: LinkField },
    { label: "Upload", tipo: "upload", component: UploadField },
    { label: "Vídeo", tipo: "video", component: VideoField },
  ];

  useEffect(() => {
    loadData();
    celulaService.getAll().then((c) => setCelulas(c || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedFormulario) {
      setRespostas([]);
      setExpandedRespostaId(null);
      setRespostaDetalhe(null);
      return;
    }
    setRespostasLoading(true);
    formularioRespostaService
      .listarPorFormulario(selectedFormulario.id)
      .then((r: Resposta[]) => setRespostas(r || []))
      .catch(() => setRespostas([]))
      .finally(() => setRespostasLoading(false));
    setExpandedRespostaId(null);
    setRespostaDetalhe(null);
  }, [selectedFormulario?.id]);

  const showToast = (msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchFormularios(), fetchAvailableFields()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormularios = async () => {
    try {
      const data = await formularioService.getAll();
      const mapped: Formulario[] = (data || []).map((f) => ({
        id: f.id_formulario,
        titulo: f.titulo,
        descricao: f.descricao ?? "",
        ativo: f.ativo === true || f.ativo === 1 ? 1 : 0,
        campos: f.campos ?? [],
      }));
      setFormularios(mapped);
      if (mapped.length > 0 && !selectedFormulario) {
        setSelectedFormulario(mapped[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar formulários:", err);
      showToast("Erro ao carregar formulários", "error");
    }
  };

  const fetchAvailableFields = async () => {
    try {
      const data = await campoService.getByModalidade("formulario");
      setAvailableFields(data || []);
    } catch (err) {
      console.error("Erro ao buscar campos disponíveis:", err);
      showToast("Erro ao carregar campos", "error");
    }
  };

  const isAtivo = (f: Formulario) => (f.ativo ?? 0) === 1;

  const handleToggle = async (id: number) => {
    try {
      const formulario = formularios.find((f) => f.id === id);
      if (!formulario) return;

      const camposLimpos: FormularioCampo[] = (formulario.campos || []).map(
        (campo, index) => ({
          id_campo: campo.id_campo,
          label: campo.label || "",
          conteudo: campo.conteudo ?? "",
          ordem: index,
        })
      );

      await formularioService.update(id, {
        titulo: formulario.titulo,
        descricao: formulario.descricao ?? null,
        ativo: !isAtivo(formulario),
        campos: camposLimpos,
      });

      await fetchFormularios();
      if (selectedFormulario && selectedFormulario.id === id) {
        const updated = await formularioService.getById(id);
        setSelectedFormulario({
          id: updated.id_formulario,
          titulo: updated.titulo,
          descricao: updated.descricao ?? "",
          ativo: updated.ativo === true || updated.ativo === 1 ? 1 : 0,
          campos: updated.campos ?? [],
        });
      }
    } catch (error) {
      console.error("Erro ao alternar formulário:", error);
      showToast("Erro ao alternar status do formulário", "error");
    }
  };

  const handleDeleteClick = (id: number) => {
    setFormularioToDelete(id);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!formularioToDelete) return;
    const id = formularioToDelete;
    setShowConfirmDelete(false);
    setFormularioToDelete(null);
    try {
      await formularioService.delete(id);
      if (selectedFormulario?.id === id) setSelectedFormulario(null);
      await fetchFormularios();
      showToast("Formulário excluído com sucesso", "success");
    } catch (err) {
      console.error("Erro ao excluir formulário:", err);
      showToast("Erro ao excluir formulário", "error");
    }
  };

  const handleSelectFormulario = (formulario: Formulario) => {
    setSelectedFormulario(formulario);
  };

  const handleExpandResposta = async (id: number) => {
    if (expandedRespostaId === id) {
      setExpandedRespostaId(null);
      setRespostaDetalhe(null);
      return;
    }
    try {
      const det = await formularioRespostaService.getById(id);
      setExpandedRespostaId(id);
      setRespostaDetalhe(det);
    } catch {
      setRespostaDetalhe(null);
    }
  };

  const formatarData = (d: string) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  const celulasQueResponderam = (selectedFormulario?.id
    ? respostas.map((r) => r.id_celula)
    : []) as number[];
  const celulasQueNaoResponderam = celulas.filter(
    (c) => !celulasQueResponderam.includes(c.id_celula)
  );

  const buildUploadUrl = (path: string) => {
    if (!path || !path.startsWith("/")) return "";
    return `${ASSETS_BASE}${path}`;
  };

  const formatarConteudoCampo = (conteudo: unknown): React.ReactNode => {
    if (conteudo === null || conteudo === undefined) return "Sem conteúdo";

    let parsed = conteudo;
    if (typeof conteudo === "string") {
      if (conteudo.startsWith("/uploads/") || conteudo.includes("/uploads/")) {
        const fileName = conteudo.split("/").pop() || "arquivo";
        const imgCheck = isImagePath(conteudo);
        const fullUrl = buildUploadUrl(conteudo);

        return (
          <div className="upload-preview-campo">
            {imgCheck && fullUrl ? (
              <div>
                <img
                  src={fullUrl}
                  alt={fileName}
                  style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "4px" }}
                />
                <br />
              </div>
            ) : null}
            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="upload-link">
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

    if (typeof parsed !== "object" || parsed === null) return String(conteudo);
    return <pre className="json-formatted">{JSON.stringify(parsed, null, 2)}</pre>;
  };

  const renderVideoPreview = (url: string): React.ReactNode => {
    const convertToEmbedUrl = (videoUrl: string): string | null => {
      try {
        // YouTube
        const youtubeRegex =
          /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const youtubeMatch = videoUrl.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
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
    if (tipo === "numero") {
      conteudoInicial = 0;
    } else if (tipo === "data") {
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
    setFormularioToEdit(null);
    setFields([]);
    setShowFormModal(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const openEditModal = async (id: number) => {
    try {
      const f = await formularioService.getById(id);

      setCurrentForm({
        id: f.id_formulario,
        nome: f.titulo ?? "",
        descricao: f.descricao ?? "",
        ativo: f.ativo === 1 || f.ativo === true ? 1 : 0,
      });

      const incomingFields = (f.campos ?? []).map((c: any, idx: number) => {
        const tipo =
          availableFields.find((field) => field.id_campo === c.id_campo)
            ?.tipo_campo ?? "texto";

        // Limpa conteúdo se for apenas o label repetido (placeholder) ou valor inválido
        let conteudoLimpo = c.conteudo ?? "";
        if (conteudoLimpo === c.label || !conteudoLimpo) {
          if (tipo === "numero") {
            conteudoLimpo = 0;
          } else {
            conteudoLimpo = "";
          }
        } else if (tipo === "data") {
          // Valida formato de data (yyyy-MM-dd)
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
      setFormularioToEdit(f.id_formulario);
      setShowFormModal(true);
      setTimeout(() => nameRef.current?.focus(), 100);
    } catch (err) {
      console.error("Erro ao carregar formulário:", err);
      showToast("Erro ao carregar formulário para edição", "error");
    }
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setFormularioToEdit(null);
    setCurrentForm(initialFormState);
    setFields([]);
  };

  const saveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!currentForm.nome.trim()) {
      showToast("Título do formulário é obrigatório", "error");
      return;
    }

    // Remove duplicatas baseado em id_campo + label, mantendo apenas a última ocorrência
    const seenKeys = new Map<string, number>();
    const uniqueFields: LocalField[] = [];

    fields.forEach((field) => {
      const key = `${field.id_campo}_${field.label}`;
      const existingIndex = seenKeys.get(key);

      if (existingIndex !== undefined) {
        // Substitui o campo existente pela versão mais recente
        uniqueFields[existingIndex] = field;
      } else {
        seenKeys.set(key, uniqueFields.length);
        uniqueFields.push(field);
      }
    });

    // Processar uploads antes de montar o payload
    const processedFields = await Promise.all(
      uniqueFields.map(async (f) => {
        let conteudo = f.conteudo ?? "";

        // Se o conteúdo é um File (upload), fazer upload primeiro
        if (conteudo instanceof File) {
          try {
            conteudo = await uploadCampo(conteudo);
          } catch (error) {
            showToast(`Erro ao fazer upload do arquivo: ${f.label}`, "error");
            throw error;
          }
        }

        return { ...f, conteudo };
      })
    );

    const camposPayload = processedFields.map((f, index) => {
      let conteudo: string | number | boolean | null = "";
      const v = f.conteudo;
      if (v === null || v === undefined) conteudo = "";
      else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") conteudo = v;
      else if (typeof v === "object") conteudo = JSON.stringify(v);
      else conteudo = String(v);
      return { id_campo: f.id_campo, label: f.label ?? "", conteudo, ordem: index };
    });

    const payload = {
      titulo: currentForm.nome,
      descricao: currentForm.descricao || null,
      ativo: Boolean(currentForm.ativo),
      campos: camposPayload,
    };

    try {
      if (formularioToEdit) {
        await formularioService.update(formularioToEdit, payload);
        await fetchFormularios();
        if (selectedFormulario && selectedFormulario.id === formularioToEdit) {
          const updated = await formularioService.getById(formularioToEdit);
          setSelectedFormulario({
            id: updated.id_formulario,
            titulo: updated.titulo,
            descricao: updated.descricao ?? "",
            ativo: updated.ativo === true || updated.ativo === 1 ? 1 : 0,
            campos: updated.campos ?? [],
          });
        }
        showToast("Formulário atualizado com sucesso!", "success");
      } else {
        await formularioService.create(payload);
        await fetchFormularios();
        showToast("Formulário criado com sucesso!", "success");
      }
      closeFormModal();
    } catch (err: unknown) {
      console.error("Erro ao salvar formulário:", err);
      const errObj = err as { response?: { data?: { errors?: string[]; error?: string } } };
      let msg = "Erro ao salvar formulário";
      const errors = errObj?.response?.data?.errors;
      const errorStr = errObj?.response?.data?.error;
      if (Array.isArray(errors)) msg = errors.join(", ");
      else if (errorStr) msg = errorStr;
      showToast(msg, "error");
    }
  };

  return (
    <div className="formularios-page page-with-fixed-header">
      <Header />
      <main className="page">
        <h1 className="page-title">SECRETARIA DAS CÉLULAS</h1>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="formularios-layout">
          {/* Coluna esquerda - Lista de Formulários */}
          <aside
            className="panel formularios-left"
            aria-label="Lista de formulários"
          >
            <div className="list-header">
              <h2>Formulários</h2>
              <span className="count">{formularios.length}</span>
            </div>
            <div className="list">
              {formularios.map((formulario) => (
                <div
                  key={formulario.id}
                  className={`formulario-item ${
                    selectedFormulario?.id === formulario.id ? "selected" : ""
                  } ${!isAtivo(formulario) ? "inactive" : ""}`}
                  onClick={() => handleSelectFormulario(formulario)}
                >
                  <div className="formulario-item__info">
                    <span className="formulario-item__name">
                      {formulario.titulo}
                    </span>
                  </div>
                  <button
                    className={`btn-status ${isAtivo(formulario) ? "active" : "inactive"}`}
                    onClick={(e) => { e.stopPropagation(); handleToggle(formulario.id); }}
                    title={isAtivo(formulario) ? "Desativar formulário" : "Ativar formulário"}
                  >
                    {isAtivo(formulario) ? "Ativo" : "Inativo"}
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-create" onClick={openCreateModal}>
              + CRIAR FORMULÁRIO
            </button>
          </aside>

          {/* Coluna direita - Visualização do Formulário */}
          <section
            className="panel formularios-center"
            aria-label="Detalhes do formulário"
          >
            {selectedFormulario ? (
              <div className="formulario-card">
                <div className="formulario-tabs">
                  <button
                    className={abaAtiva === "formulario" ? "active" : ""}
                    onClick={() => setAbaAtiva("formulario")}
                  >
                    Formulário
                  </button>
                  <button
                    className={abaAtiva === "respostas" ? "active" : ""}
                    onClick={() => setAbaAtiva("respostas")}
                  >
                    Respostas ({respostas.length})
                  </button>
                  <button
                    className={abaAtiva === "dashboard" ? "active" : ""}
                    onClick={() => setAbaAtiva("dashboard")}
                  >
                    Dashboard
                  </button>
                </div>

                {abaAtiva === "formulario" && (
                  <>
                <div className="formulario-header">
                  <div className="formulario-title-area">
                    <h2 className="formulario-title">
                      {selectedFormulario.titulo}
                    </h2>
                    <span className={`badge badge-${isAtivo(selectedFormulario) ? "active" : "inactive"}`}>
                      {isAtivo(selectedFormulario) ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="formulario-actions">
                    <button className="btn-edit" onClick={() => openEditModal(selectedFormulario.id)}>
                      Editar
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteClick(selectedFormulario.id)}>
                      Excluir
                    </button>
                  </div>
                </div>

                {selectedFormulario.descricao && (
                  <div className="formulario-description">
                    <h3>Descrição</h3>
                    <p>{selectedFormulario.descricao}</p>
                  </div>
                )}

                <div className="formulario-meta">
                  <div className="meta-item">
                    <span className="meta-label">Campos:</span>
                    <span className="meta-value">
                      {selectedFormulario.campos?.length || 0}
                    </span>
                  </div>
                </div>

                {selectedFormulario.campos &&
                selectedFormulario.campos.length > 0 ? (
                  <div className="formulario-fields">
                    <h3>Campos Personalizados</h3>
                    <div className="campos-grid">
                      {selectedFormulario.campos.map((campo, index) => (
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
                  <div className="formulario-empty">
                    <p>Este formulário não possui campos cadastrados.</p>
                  </div>
                )}
                  </>
                )}

                {abaAtiva === "respostas" && (
                  <div className="respostas-section">
                    {respostasLoading ? (
                      <p className="loading-message">Carregando respostas...</p>
                    ) : respostas.length === 0 ? (
                      <div className="formulario-empty">
                        <p>Nenhuma resposta enviada para este formulário.</p>
                      </div>
                    ) : (
                      <div className="respostas-list">
                        {respostas.map((r) => (
                          <div
                            key={r.id_resposta}
                            className={`resposta-item ${
                              expandedRespostaId === r.id_resposta
                                ? "expanded"
                                : ""
                            }`}
                          >
                            <div
                              className="resposta-item-header"
                              onClick={() => handleExpandResposta(r.id_resposta)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                handleExpandResposta(r.id_resposta)
                              }
                            >
                              <span className="resposta-celula">
                                {r.nome_celula || `Célula #${r.id_celula}`}
                              </span>
                              <span className="resposta-lider">
                                {r.nome_lider || "-"}
                              </span>
                              <span className="resposta-data">
                                {formatarData(r.data_resposta)}
                              </span>
                              <span className="resposta-toggle">
                                {expandedRespostaId === r.id_resposta
                                  ? "▼"
                                  : "▶"}
                              </span>
                            </div>
                            {expandedRespostaId === r.id_resposta &&
                              respostaDetalhe?.id_resposta === r.id_resposta && (
                                <div className="resposta-detalhe">
                                  {respostaDetalhe.campos &&
                                  respostaDetalhe.campos.length > 0 ? (
                                    <div className="campos-grid">
                                      {respostaDetalhe.campos.map(
                                        (c: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="campo-card"
                                          >
                                            <div className="campo-label">
                                              {c.label || "Campo"}
                                            </div>
                                            <div className="campo-conteudo">
                                              {formatarConteudoCampo(
                                                c.valor ?? c.resposta ?? c.conteudo
                                              )}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <p className="muted">
                                      Sem campos preenchidos.
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {abaAtiva === "dashboard" && (
                  <div className="dashboard-section">
                    <h3>Células que responderam</h3>
                    {celulasQueResponderam.length === 0 ? (
                      <p className="muted">
                        Nenhuma célula respondeu este formulário ainda.
                      </p>
                    ) : (
                      <ul className="dashboard-list responded">
                        {respostas
                          .reduce(
                            (
                              acc: Array<{
                                id_celula: number;
                                nome: string;
                                count: number;
                              }>,
                              r
                            ) => {
                              const cel = celulas.find(
                                (c) => c.id_celula === r.id_celula
                              );
                              const exist = acc.find(
                                (a) => a.id_celula === r.id_celula
                              );
                              if (exist) {
                                exist.count += 1;
                              } else {
                                acc.push({
                                  id_celula: r.id_celula,
                                  nome: cel?.nome || r.nome_celula || `Célula #${r.id_celula}`,
                                  count: 1,
                                });
                              }
                              return acc;
                            },
                            []
                          )
                          .map((c) => (
                            <li key={c.id_celula}>
                              <strong>{c.nome}</strong> — {c.count} resposta
                              {c.count !== 1 ? "s" : ""}
                            </li>
                          ))}
                      </ul>
                    )}
                    <h3>Células que não responderam</h3>
                    {celulasQueNaoResponderam.length === 0 ? (
                      <p className="muted">
                        Todas as células responderam este formulário.
                      </p>
                    ) : (
                      <ul className="dashboard-list not-responded">
                        {celulasQueNaoResponderam.map((c) => (
                          <li key={c.id_celula}>{c.nome}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="formulario-placeholder">
                <p>Selecione um formulário na lista para visualizar</p>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />

      {toast && <Toast message={toast} onClose={() => setToast(null)} variant={toastVariant} />}

      <ConfirmModal
        open={showConfirmDelete}
        title="Excluir formulário"
        message="Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowConfirmDelete(false); setFormularioToDelete(null); }}
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
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>
              {formularioToEdit ? "Editar Formulário" : "Criar Novo Formulário"}
            </h2>

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

              <h3>Campos do Formulário</h3>

              <div className="fields-container">
                {fields.length === 0 && (
                  <p className="muted">Nenhum campo adicionado.</p>
                )}

                {fields.map((f) => {
                  const Component = fieldOptions.find((o) => o.tipo === f.tipo)?.component;
                  if (!Component) return null;
                  return (
                    <div key={f.uid} className="field-wrapper">
                      <div className="dynamic-field-row">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Component
                          id={String(f.uid)}
                          name={`campo_${f.uid}`}
                          label={f.label}
                          value={f.conteudo as any}
                          onChange={(v: any) =>
                            setFields((prev) =>
                              prev.map((fld) => (fld.uid === f.uid ? { ...fld, conteudo: v } : fld))
                            )
                          }
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
