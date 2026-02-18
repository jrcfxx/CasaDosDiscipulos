import React, { useEffect, useRef, useState } from "react";
import "../style/LicoesSecretariaAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import axios from "axios";

import TextField from "../components/fields/TextField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";

/* TYPES */
type Licao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  ativo?: number;
  campos?: any[];
};

type LicaoForm = {
  id: number | null;
  nome: string;
  descricao: string;
  ativo: number;
  arquivo: File | null;
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

const initialFormState: LicaoForm = {
  id: null,
  nome: "",
  descricao: "",
  ativo: 1,
  arquivo: null,
};

const LicoesSecretariaAdmin: React.FC = () => {
  const [licoes, setLicoes] = useState<Licao[]>([]);
  const [selectedLicao, setSelectedLicao] = useState<Licao | null>(null);
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([]);
  const [loading, setLoading] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [licaoToEdit, setLicaoToEdit] = useState<number | null>(null);
  const [currentForm, setCurrentForm] = useState<LicaoForm>(initialFormState);

  const [fields, setFields] = useState<LocalField[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchLicoes(), fetchAvailableFields()]);
    setLoading(false);
  };

  const fetchLicoes = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/licao");
      const mapped: Licao[] = (res.data || []).map((l: any) => ({
        id: l.id_licao ?? l.id ?? 0,
        titulo: l.titulo,
        descricao: l.descricao ?? "",
        ativo: l.ativo ?? 1,
        campos: l.campos ?? [],
      }));
      setLicoes(mapped);
      if (mapped.length > 0 && !selectedLicao) {
        setSelectedLicao(mapped[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar lições:", err);
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
      const licao = licoes.find((l) => l.id === id);
      if (!licao) return;

      const camposLimpos = (licao.campos || []).map((campo: any) => ({
        id_campo: campo.id_campo,
        label: campo.label || "",
        conteudo: campo.conteudo || "",
      }));

      await axios.put(`http://localhost:3001/api/licao/${id}`, {
        titulo: licao.titulo,
        descricao: licao.descricao,
        ativo: licao.ativo === 1 ? false : true,
        campos: camposLimpos,
      });

      await fetchLicoes();

      // Se a lição alterada é a que está selecionada, atualizar a visualização
      if (selectedLicao && selectedLicao.id === id) {
        const res = await axios.get(`http://localhost:3001/api/licao/${id}`);
        const l = res.data;
        setSelectedLicao({
          id: l.id_licao ?? l.id ?? id,
          titulo: l.titulo,
          descricao: l.descricao ?? "",
          ativo: l.ativo ?? 1,
          campos: l.campos ?? [],
        });
      }
    } catch (error) {
      console.error("Erro ao alternar lição:", error);
    }
  };

  const handleSelectLicao = (licao: Licao) => {
    setSelectedLicao(licao);
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

  const addField = (tipo: string) => {
    const label = window.prompt("Digite o label do campo:");
    if (!label) return;

    const campo = availableFields.find(
      (c) => String(c.tipo_campo).toLowerCase() === tipo.toLowerCase()
    );
    if (!campo) {
      showToast(`Nenhum campo disponível para o tipo ${tipo}`);
      return;
    }

    // Define valor inicial baseado no tipo
    let conteudoInicial: any = "";
    if (tipo === "numero") {
      conteudoInicial = 0;
    } else if (tipo === "data") {
      conteudoInicial = "";
    }

    setFields((prev) => [
      ...prev,
      createLocalField(campo.id_campo, tipo, label, conteudoInicial),
    ]);
  };

  const removeField = (uid: number) => {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
  };

  const openCreateModal = () => {
    setCurrentForm(initialFormState);
    setLicaoToEdit(null);
    setFields([]);
    setShowFormModal(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const openEditModal = async (id: number) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/licao/${id}`);
      const l = res.data;

      setCurrentForm({
        id: l.id_licao ?? l.id ?? id,
        nome: l.titulo ?? "",
        descricao: l.descricao ?? "",
        ativo: l.ativo ?? 1,
        arquivo: null,
      });

      const incomingFields = (l.campos ?? []).map((c: any, idx: number) =>
        createLocalField(
          c.id_campo,
          availableFields.find((f) => f.id_campo === c.id_campo)?.tipo_campo ??
            "texto",
          c.label ?? `Campo ${idx + 1}`,
          c.conteudo ?? ""
        )
      );

      setFields(incomingFields);
      setLicaoToEdit(l.id_licao ?? l.id ?? id);
      setShowFormModal(true);
      setTimeout(() => nameRef.current?.focus(), 100);
    } catch (err) {
      console.error("Erro ao carregar lição:", err);
      showToast("Erro ao carregar lição para edição.");
    }
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setLicaoToEdit(null);
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
      showToast("Título da lição é obrigatório");
      return;
    }

    // Processar uploads antes de montar o payload
    const processedFields = await Promise.all(
      fields.map(async (f) => {
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

    const camposPayload = processedFields.map((f) => ({
      id_campo: f.id_campo,
      label: f.label ?? "",
      conteudo: f.conteudo ?? "",
    }));

    const payload: any = {
      titulo: currentForm.nome,
      descricao: currentForm.descricao || null,
      ativo: Boolean(currentForm.ativo),
      campos: camposPayload,
    };

    try {
      if (licaoToEdit) {
        await axios.put(
          `http://localhost:3001/api/licao/${licaoToEdit}`,
          payload
        );
        await fetchLicoes();

        // Atualizar a lição selecionada se for a que foi editada
        if (selectedLicao && selectedLicao.id === licaoToEdit) {
          const res = await axios.get(
            `http://localhost:3001/api/licao/${licaoToEdit}`
          );
          const l = res.data;
          setSelectedLicao({
            id: l.id_licao ?? l.id ?? licaoToEdit,
            titulo: l.titulo,
            descricao: l.descricao ?? "",
            ativo: l.ativo ?? 1,
            campos: l.campos ?? [],
          });
        }

        showToast("Lição atualizada com sucesso!");
      } else {
        await axios.post("http://localhost:3001/api/licao", payload);
        await fetchLicoes();
        showToast("Lição criada com sucesso!");
      }
      closeFormModal();
    } catch (err: any) {
      console.error("Erro ao salvar lição:", err);

      // Trata diferentes formatos de erro
      let msg = "Erro ao salvar lição";
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
    <div className="licoes-page page-with-fixed-header">
      <Header />
      <main className="page">
        <h1 className="page-title">SECRETARIA DAS CÉLULAS</h1>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="licoes-layout">
          {/* Coluna esquerda - Lista de Lições */}
          <aside className="panel licoes-left" aria-label="Lista de lições">
            <div className="list-header">
              <h2>Lições</h2>
              <span className="count">{licoes.length}</span>
            </div>
            <div className="list">
              {licoes.map((licao) => (
                <div
                  key={licao.id}
                  className={`licao-item ${
                    selectedLicao?.id === licao.id ? "selected" : ""
                  } ${!licao.ativo ? "inactive" : ""}`}
                  onClick={() => handleSelectLicao(licao)}
                >
                  <div className="licao-item__info">
                    <span className="licao-item__name">{licao.titulo}</span>
                  </div>
                  <button
                    className={`btn-status ${
                      licao.ativo ? "active" : "inactive"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(licao.id);
                    }}
                    title={licao.ativo ? "Desativar lição" : "Ativar lição"}
                  >
                    {licao.ativo ? "Ativo" : "Inativo"}
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-create" onClick={openCreateModal}>
              + CRIAR LIÇÃO
            </button>
          </aside>

          {/* Coluna direita - Visualização da Lição */}
          <section
            className="panel licoes-center"
            aria-label="Detalhes da lição"
          >
            {selectedLicao ? (
              <div className="licao-card">
                <div className="licao-header">
                  <div className="licao-title-area">
                    <h2 className="licao-title">{selectedLicao.titulo}</h2>
                    <span
                      className={`badge badge-${
                        selectedLicao.ativo ? "active" : "inactive"
                      }`}
                    >
                      {selectedLicao.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="licao-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(selectedLicao.id)}
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {selectedLicao.descricao && (
                  <div className="licao-description">
                    <h3>Descrição</h3>
                    <p>{selectedLicao.descricao}</p>
                  </div>
                )}

                <div className="licao-meta">
                  <div className="meta-item">
                    <span className="meta-label">Campos:</span>
                    <span className="meta-value">
                      {selectedLicao.campos?.length || 0}
                    </span>
                  </div>
                </div>

                {selectedLicao.campos && selectedLicao.campos.length > 0 ? (
                  <div className="licao-fields">
                    <h3>Campos Personalizados</h3>
                    <div className="campos-grid">
                      {selectedLicao.campos.map((campo, index) => (
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
                  <div className="licao-empty">
                    <p>Esta lição não possui campos cadastrados.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="licao-placeholder">
                <p>Selecione uma lição na lista para visualizar</p>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />

      {toast && <div className="toast">{toast}</div>}

      {/* FORM MODAL */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <h2>{licaoToEdit ? "Editar Lição" : "Criar Nova Lição"}</h2>

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

              <h3>Campos da Lição</h3>

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
};

export default LicoesSecretariaAdmin;
