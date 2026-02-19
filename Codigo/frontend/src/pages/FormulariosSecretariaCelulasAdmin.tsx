import React, { useEffect, useRef, useState } from "react";
import "../style/FormulariosSecretariaCelulasAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import InputModal from "../components/ui/InputModal";

import axios from "axios";

import formularioRespostaService from "../services/formularioRespostaService";
import celulaService from "../services/celulaService";

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

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchFormularios(), fetchAvailableFields()]);
    setLoading(false);
  };

  const fetchFormularios = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/formulario");
      const mapped: Formulario[] = (res.data || []).map((f: any) => ({
        id: f.id_formulario ?? f.id ?? 0,
        titulo: f.titulo,
        descricao: f.descricao ?? "",
        ativo: f.ativo ?? 1,
        campos: f.campos ?? [],
      }));
      setFormularios(mapped);
      if (mapped.length > 0 && !selectedFormulario) {
        setSelectedFormulario(mapped[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar formulários:", err);
    }
  };

  const fetchAvailableFields = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/campo");
      setAvailableFields(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar campos disponíveis:", err);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const formulario = formularios.find((f) => f.id === id);
      if (!formulario) return;

      const camposLimpos = (formulario.campos || []).map(
        (campo: any, index: number) => ({
          id_campo: campo.id_campo,
          label: campo.label || "",
          conteudo: campo.conteudo || "",
          ordem: index,
        })
      );

      await axios.put(`http://localhost:3001/api/formulario/${id}`, {
        titulo: formulario.titulo,
        descricao: formulario.descricao,
        ativo: formulario.ativo === 1 ? false : true,
        campos: camposLimpos,
      });

      await fetchFormularios();

      // Se o formulário alterado é o que está selecionado, atualizar a visualização
      if (selectedFormulario && selectedFormulario.id === id) {
        const res = await axios.get(
          `http://localhost:3001/api/formulario/${id}`
        );
        const f = res.data;
        setSelectedFormulario({
          id: f.id_formulario ?? f.id ?? id,
          titulo: f.titulo,
          descricao: f.descricao ?? "",
          ativo: f.ativo ?? 1,
          campos: f.campos ?? [],
        });
      }
    } catch (error) {
      console.error("Erro ao alternar formulário:", error);
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
                  src={`http://localhost:3001${conteudo}`}
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
              href={`http://localhost:3001${conteudo}`}
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
      const res = await axios.get(`http://localhost:3001/api/formulario/${id}`);
      const f = res.data;

      setCurrentForm({
        id: f.id_formulario ?? f.id ?? id,
        nome: f.titulo ?? "",
        descricao: f.descricao ?? "",
        ativo: f.ativo ?? 1,
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
      setFormularioToEdit(f.id_formulario ?? f.id ?? id);
      setShowFormModal(true);
      setTimeout(() => nameRef.current?.focus(), 100);
    } catch (err) {
      console.error("Erro ao carregar formulário:", err);
      showToast("Erro ao carregar formulário para edição.");
    }
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setFormularioToEdit(null);
    setCurrentForm(initialFormState);
    setFields([]);
  };

  // Função auxiliar para fazer upload de arquivo
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/upload/campo",
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
      showToast("Título do formulário é obrigatório");
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
      if (formularioToEdit) {
        await axios.put(
          `http://localhost:3001/api/formulario/${formularioToEdit}`,
          payload
        );
        await fetchFormularios();

        // Atualizar o formulário selecionado se for o que foi editado
        if (selectedFormulario && selectedFormulario.id === formularioToEdit) {
          const res = await axios.get(
            `http://localhost:3001/api/formulario/${formularioToEdit}`
          );
          const f = res.data;
          setSelectedFormulario({
            id: f.id_formulario ?? f.id ?? formularioToEdit,
            titulo: f.titulo,
            descricao: f.descricao ?? "",
            ativo: f.ativo ?? 1,
            campos: f.campos ?? [],
          });
        }

        showToast("Formulário atualizado com sucesso!");
      } else {
        await axios.post("http://localhost:3001/api/formulario", payload);
        await fetchFormularios();
        showToast("Formulário criado com sucesso!");
      }
      closeFormModal();
    } catch (err: any) {
      console.error("Erro ao salvar formulário:", err);

      let msg = "Erro ao salvar formulário";
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
                  } ${!formulario.ativo ? "inactive" : ""}`}
                  onClick={() => handleSelectFormulario(formulario)}
                >
                  <div className="formulario-item__info">
                    <span className="formulario-item__name">
                      {formulario.titulo}
                    </span>
                  </div>
                  <button
                    className={`btn-status ${
                      formulario.ativo ? "active" : "inactive"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(formulario.id);
                    }}
                    title={
                      formulario.ativo
                        ? "Desativar formulário"
                        : "Ativar formulário"
                    }
                  >
                    {formulario.ativo ? "Ativo" : "Inativo"}
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
                    <span
                      className={`badge badge-${
                        selectedFormulario.ativo ? "active" : "inactive"
                      }`}
                    >
                      {selectedFormulario.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="formulario-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(selectedFormulario.id)}
                    >
                      Editar
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

      {toast && <div className="toast">{toast}</div>}

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
                  const Component = fieldOptions.find(
                    (o) => o.tipo === f.tipo
                  )?.component;
                  if (!Component) return null;

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
