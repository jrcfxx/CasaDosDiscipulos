import React, { useEffect, useRef, useState } from "react";
import "../style/LicoesSecretariaAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import InputModal from "../components/ui/InputModal";
import Toast from "../components/ui/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";

import licaoService, {
  Licao,
  LicaoCampo,
} from "../services/licaoService";
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
  conteudo: unknown;
};

const initialFormState: LicaoForm = {
  id: null,
  nome: "",
  descricao: "",
  ativo: 1,
  arquivo: null,
};

const fieldOptions = [
  { label: "Texto", tipo: "texto", component: TextField },
  { label: "Número", tipo: "numero", component: NumberField },
  { label: "Data", tipo: "data", component: DateField },
  { label: "Link", tipo: "link", component: LinkField },
  { label: "Upload", tipo: "upload", component: UploadField },
  { label: "Vídeo", tipo: "video", component: VideoField },
];

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
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [licaoToDelete, setLicaoToDelete] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLicoes(), fetchAvailableFields()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLicoes = async () => {
    try {
      const data = await licaoService.getAll();
      const mapped: Licao[] = (data || []).map((l) => ({
        ...l,
        id_licao: l.id_licao,
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
      showToast("Erro ao carregar lições", "error");
    }
  };

  const fetchAvailableFields = async () => {
    try {
      const data = await campoService.getByModalidade("licao");
      setAvailableFields(data || []);
    } catch (err) {
      console.error("Erro ao buscar campos disponíveis:", err);
      showToast("Erro ao carregar campos", "error");
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const licao = licoes.find((l) => l.id_licao === id);
      if (!licao) return;

      const camposLimpos: LicaoCampo[] = (licao.campos || []).map((campo) => ({
        id_campo: campo.id_campo,
        label: campo.label || "",
        conteudo: campo.conteudo ?? "",
      }));

      const novoAtivo = !!(licao.ativo === 1 || licao.ativo === true);
      await licaoService.update(id, {
        titulo: licao.titulo,
        descricao: licao.descricao ?? null,
        ativo: !novoAtivo,
        campos: camposLimpos,
      });

      await fetchLicoes();
      if (selectedLicao && selectedLicao.id_licao === id) {
        const updated = await licaoService.getById(id);
        setSelectedLicao({
          ...updated,
          ativo: updated.ativo ?? 1,
          campos: updated.campos ?? [],
        });
      }
    } catch (error) {
      console.error("Erro ao alternar lição:", error);
      showToast("Erro ao alternar status da lição", "error");
    }
  };

  const handleDeleteClick = (id: number) => {
    setLicaoToDelete(id);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!licaoToDelete) return;
    const id = licaoToDelete;
    setShowConfirmDelete(false);
    setLicaoToDelete(null);
    try {
      await licaoService.delete(id);
      if (selectedLicao?.id_licao === id) {
        setSelectedLicao(null);
      }
      await fetchLicoes();
      showToast("Lição excluída com sucesso", "success");
    } catch (err) {
      console.error("Erro ao excluir lição:", err);
      showToast("Erro ao excluir lição", "error");
    }
  };

  const handleSelectLicao = (licao: Licao) => {
    setSelectedLicao(licao);
  };

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
        const isImage = isImagePath(conteudo);
        const fullUrl = buildUploadUrl(conteudo);

        return (
          <div className="upload-preview-campo">
            {isImage && fullUrl ? (
              <div>
                <img
                  src={fullUrl}
                  alt={fileName}
                  style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "4px" }}
                />
                <br />
              </div>
            ) : null}
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="upload-link"
            >
              📄 {fileName}
            </a>
          </div>
        );
      }

      const videoUrlRegex = /(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.ogg)/i;
      if (videoUrlRegex.test(conteudo)) {
        return renderVideoPreview(conteudo);
      }

      try {
        parsed = JSON.parse(conteudo);
      } catch {
        return conteudo;
      }
    }

    if (typeof parsed !== "object" || parsed === null) {
      return String(conteudo);
    }
    return <pre className="json-formatted">{JSON.stringify(parsed, null, 2)}</pre>;
  };

  const renderVideoPreview = (url: string): React.ReactNode => {
    const convertToEmbedUrl = (videoUrl: string): string | null => {
      try {
        const youtubeRegex =
          /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const youtubeMatch = videoUrl.match(youtubeRegex);
        if (youtubeMatch?.[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}?cc_load_policy=1`;

        const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

        if (/\.(mp4|webm|ogg)$/i.test(videoUrl)) return videoUrl;
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

    const isDirectVideo = /\.(mp4|webm|ogg)$/i.test(embedUrl);

    return (
      <div className="video-preview-campo" style={{ marginTop: "0.5rem" }}>
        {isDirectVideo ? (
          <video controls style={{ width: "100%", maxWidth: "400px", height: "auto", borderRadius: "8px" }}>
            <source src={embedUrl} type="video/mp4" />
            Seu navegador não suporta o elemento de vídeo.
          </video>
        ) : (
          <iframe
            src={embedUrl}
            style={{ width: "100%", maxWidth: "400px", height: "225px", border: "none", borderRadius: "8px" }}
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
    conteudo: unknown = ""
  ): LocalField => ({
    uid: Date.now() + Math.floor(Math.random() * 10000),
    id_campo,
    tipo,
    label,
    conteudo,
  });

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
      (c) => String(c.tipo_campo).toLowerCase() === tipo?.toLowerCase()
    );
    if (!campo) {
      showToast(`Nenhum campo disponível para o tipo ${tipo}`);
      return;
    }

    let conteudoInicial: unknown = "";
    if (tipo === "numero") conteudoInicial = 0;
    else if (tipo === "data") conteudoInicial = "";

    setFields((prev) => [...prev, createLocalField(campo.id_campo, tipo!, label.trim(), conteudoInicial)]);
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
      const l = await licaoService.getById(id);

      setCurrentForm({
        id: l.id_licao,
        nome: l.titulo ?? "",
        descricao: l.descricao ?? "",
        ativo: l.ativo === 1 || l.ativo === true ? 1 : 0,
        arquivo: null,
      });

      const incomingFields = (l.campos ?? []).map((c, idx) =>
        createLocalField(
          c.id_campo,
          availableFields.find((f) => f.id_campo === c.id_campo)?.tipo_campo ?? "texto",
          c.label ?? `Campo ${idx + 1}`,
          c.conteudo ?? ""
        )
      );

      setFields(incomingFields);
      setLicaoToEdit(l.id_licao);
      setShowFormModal(true);
      setTimeout(() => nameRef.current?.focus(), 100);
    } catch (err) {
      console.error("Erro ao carregar lição:", err);
      showToast("Erro ao carregar lição para edição", "error");
    }
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setLicaoToEdit(null);
    setCurrentForm(initialFormState);
    setFields([]);
  };

  const saveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!currentForm.nome.trim()) {
      showToast("Título da lição é obrigatório", "error");
      return;
    }

    const processedFields = await Promise.all(
      fields.map(async (f) => {
        let conteudo = f.conteudo ?? "";

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

    const camposPayload: LicaoCampo[] = processedFields.map((f) => {
      let conteudo: string | number | boolean | null = "";
      const v = f.conteudo;
      if (v === null || v === undefined) conteudo = "";
      else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") conteudo = v;
      else if (typeof v === "object") conteudo = JSON.stringify(v);
      else conteudo = String(v);
      return { id_campo: f.id_campo, label: f.label ?? "", conteudo };
    });

    const payload = {
      titulo: currentForm.nome,
      descricao: currentForm.descricao || null,
      ativo: Boolean(currentForm.ativo),
      campos: camposPayload,
    };

    try {
      if (licaoToEdit) {
        await licaoService.update(licaoToEdit, payload);
        await fetchLicoes();
        if (selectedLicao && selectedLicao.id_licao === licaoToEdit) {
          const updated = await licaoService.getById(licaoToEdit);
          setSelectedLicao({ ...updated, campos: updated.campos ?? [] });
        }
        showToast("Lição atualizada com sucesso!", "success");
      } else {
        await licaoService.create(payload);
        await fetchLicoes();
        showToast("Lição criada com sucesso!", "success");
      }
      closeFormModal();
    } catch (err: unknown) {
      console.error("Erro ao salvar lição:", err);
      const errObj = err as { response?: { data?: { errors?: string[]; error?: string } } };
      let msg = "Erro ao salvar lição";
      const errors = errObj?.response?.data?.errors;
      const errorStr = errObj?.response?.data?.error;
      if (Array.isArray(errors)) {
        msg = errors.join(", ");
      } else if (errorStr) {
        msg = errorStr;
      }
      showToast(msg, "error");
    }
  };

  const isAtivo = (l: Licao) => l.ativo === 1 || l.ativo === true;

  return (
    <div className="licoes-page page-with-fixed-header">
      <Header />
      <main id="main-content" className="licoes-main" tabIndex={-1}>
        <h1 className="licoes-title">Secretaria das Células – Lições</h1>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="licoes-layout">
          <aside className="panel licoes-left" aria-label="Lista de lições">
            <div className="list-header">
              <h2>Lições</h2>
              <span className="count">{licoes.length}</span>
            </div>
            <div className="list">
              {licoes.map((licao) => (
                <div
                  key={licao.id_licao}
                  className={`licao-item ${selectedLicao?.id_licao === licao.id_licao ? "selected" : ""} ${!isAtivo(licao) ? "inactive" : ""}`}
                  onClick={() => handleSelectLicao(licao)}
                >
                  <div className="licao-item__info">
                    <span className="licao-item__name">{licao.titulo}</span>
                  </div>
                  <button
                    className={`btn-status ${isAtivo(licao) ? "active" : "inactive"}`}
                    onClick={(e) => { e.stopPropagation(); handleToggle(licao.id_licao); }}
                    title={isAtivo(licao) ? "Desativar lição" : "Ativar lição"}
                  >
                    {isAtivo(licao) ? "Ativo" : "Inativo"}
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-create" onClick={openCreateModal}>
              + Criar lição
            </button>
          </aside>

          <section className="panel licoes-center" aria-label="Detalhes da lição">
            {selectedLicao ? (
              <div className="licao-card">
                <div className="licao-header">
                  <div className="licao-title-area">
                    <h2 className="licao-title">{selectedLicao.titulo}</h2>
                    <span className={`badge badge-${isAtivo(selectedLicao) ? "active" : "inactive"}`}>
                      {isAtivo(selectedLicao) ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="licao-actions">
                    <button className="btn-edit" onClick={() => openEditModal(selectedLicao.id_licao)}>
                      Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteClick(selectedLicao.id_licao)}
                    >
                      Excluir
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
                    <span className="meta-label">Campos</span>
                    <span className="meta-value">{selectedLicao.campos?.length || 0}</span>
                  </div>
                </div>

                {selectedLicao.campos && selectedLicao.campos.length > 0 ? (
                  <div className="licao-fields">
                    <h3>Campos personalizados</h3>
                    <div className="campos-grid">
                      {selectedLicao.campos.map((campo, index) => (
                        <div key={index} className="campo-card">
                          <div className="campo-label">{campo.label || "Sem label"}</div>
                          <div className="campo-conteudo">
                            {formatarConteudoCampo(campo.conteudo)}
                          </div>
                          {campo.obrigatorio && <span className="campo-required">Obrigatório</span>}
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

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} variant={toastVariant} />
      )}

      <InputModal
        open={labelModalOpen}
        title="Label do campo"
        label="Digite o label do campo"
        placeholder="Ex: Nome completo"
        onConfirm={confirmAddField}
        onCancel={() => { setLabelModalOpen(false); setLabelModalTipo(null); }}
      />

      <ConfirmModal
        open={showConfirmDelete}
        title="Excluir lição"
        message="Tem certeza que deseja excluir esta lição? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowConfirmDelete(false); setLicaoToDelete(null); }}
      />

      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <h2>{licaoToEdit ? "Editar lição" : "Criar nova lição"}</h2>

            <form onSubmit={saveForm}>
              <label>Título</label>
              <input
                ref={nameRef}
                value={currentForm.nome}
                onChange={(e) => setCurrentForm({ ...currentForm, nome: e.target.value })}
                required
              />

              <label>Descrição</label>
              <textarea
                value={currentForm.descricao}
                onChange={(e) => setCurrentForm({ ...currentForm, descricao: e.target.value })}
                rows={4}
              />

              <label>Ativo</label>
              <select
                value={currentForm.ativo}
                onChange={(e) => setCurrentForm({ ...currentForm, ativo: Number(e.target.value) })}
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>

              <h3>Campos da lição</h3>

              <div className="fields-container">
                {fields.length === 0 && <p className="muted">Nenhum campo adicionado.</p>}

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
                              prev.map((fld) =>
                                fld.uid === f.uid ? { ...fld, conteudo: v } : fld
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
                  <button key={opt.tipo} type="button" onClick={() => addField(opt.tipo)}>
                    + {opt.label}
                  </button>
                ))}
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">Salvar</button>
                <button type="button" className="cancel-btn" onClick={closeFormModal}>
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
