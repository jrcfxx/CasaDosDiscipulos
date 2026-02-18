import React, { useEffect, useState } from "react";
import "../style/FormulariosSecretariaCelulasLeader.css";
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
type Formulario = {
  id: number;
  titulo: string;
  descricao?: string | null;
  ativo?: number;
  campos?: any[];
};

type LocalField = {
  uid: number;
  id_campo: number;
  tipo: string;
  label: string;
  conteudo: any;
  obrigatorio?: boolean;
};

export default function FormulariosSecretariaCelulasLeader() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [selectedFormulario, setSelectedFormulario] =
    useState<Formulario | null>(null);
  const [fields, setFields] = useState<LocalField[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const loadData = async () => {
    setLoading(true);
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
      showToast("Erro ao buscar formulários");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedFormulario) {
      setFields(
        (selectedFormulario.campos || []).map((c: any, idx: number) => ({
          uid: idx,
          id_campo: c.id_campo,
          tipo: c.tipo_campo || "texto",
          label: c.label || `Campo ${idx + 1}`,
          conteudo: "",
          obrigatorio: c.obrigatorio || false,
        }))
      );
    } else {
      setFields([]);
    }
  }, [selectedFormulario]);

  const handleSelectFormulario = (formulario: Formulario) => {
    setSelectedFormulario(formulario);
    setSuccess(false);
  };

  const handleChangeField = (uid: number, value: any) => {
    setFields((prev) =>
      prev.map((f) => (f.uid === uid ? { ...f, conteudo: value } : f))
    );
  };

  const formatarConteudoCampo = (campo: LocalField) => {
    // Visualização do campo (read-only)
    if (campo.tipo === "upload" && campo.conteudo) {
      const fileName = String(campo.conteudo).split("/").pop() || "arquivo";
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
            <img
              src={`http://localhost:3001${campo.conteudo}`}
              alt={fileName}
              style={{
                maxWidth: "200px",
                maxHeight: "200px",
                borderRadius: "4px",
              }}
            />
          ) : null}
          <a
            href={`http://localhost:3001${campo.conteudo}`}
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
    if (campo.tipo === "video" && campo.conteudo) {
      return (
        <div className="video-preview-campo" style={{ marginTop: "0.5rem" }}>
          <video
            controls
            style={{
              width: "100%",
              maxWidth: "400px",
              height: "auto",
              borderRadius: "8px",
            }}
          >
            <source src={campo.conteudo} type="video/mp4" />
            Seu navegador não suporta o elemento de vídeo.
          </video>
        </div>
      );
    }
    return campo.conteudo ? String(campo.conteudo) : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Monta payload para envio
      const camposPayload = fields.map((f) => ({
        id_campo: f.id_campo,
        label: f.label,
        conteudo: f.conteudo,
      }));
      await axios.post(
        `http://localhost:3001/api/formulario/${selectedFormulario?.id}/resposta`,
        { campos: camposPayload }
      );
      setSuccess(true);
      showToast("Formulário enviado com sucesso!");
    } catch (err) {
      showToast("Erro ao enviar formulário");
    }
    setSending(false);
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
                </div>
              ))}
            </div>
          </aside>
          {/* Coluna central - Visualização e preenchimento do Formulário */}
          <section
            className="panel formularios-center"
            aria-label="Detalhes do formulário"
          >
            {selectedFormulario ? (
              <div className="formulario-card">
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
                  <form className="formulario-fields" onSubmit={handleSubmit}>
                    <h3>Preencha os campos</h3>
                    <div className="campos-grid">
                      {fields.map((campo) => {
                        let safeLabel =
                          typeof campo.label === "string"
                            ? campo.label
                            : String(campo.label ?? "Campo");
                        return (
                          <div key={campo.uid} className="campo-card">
                            <div className="campo-label">{campo.label}</div>
                            <div className="campo-conteudo">
                              {campo.tipo === "texto" && (
                                <TextField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v: any) =>
                                    handleChangeField(campo.uid, v)
                                  }
                                />
                              )}
                              {campo.tipo === "numero" && (
                                <NumberField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v: any) =>
                                    handleChangeField(campo.uid, v)
                                  }
                                />
                              )}
                              {campo.tipo === "data" && (
                                <DateField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v: any) =>
                                    handleChangeField(campo.uid, v)
                                  }
                                />
                              )}
                              {campo.tipo === "link" && (
                                <LinkField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v: any) =>
                                    handleChangeField(campo.uid, v)
                                  }
                                />
                              )}
                              {campo.tipo === "upload" && (
                                <UploadField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v: any) =>
                                    handleChangeField(campo.uid, v)
                                  }
                                />
                              )}
                              {campo.tipo === "video" && (
                                <VideoField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v: any) =>
                                    handleChangeField(campo.uid, v)
                                  }
                                />
                              )}
                              {/* Visualização do conteúdo preenchido */}
                              {formatarConteudoCampo(campo)}
                            </div>
                            {campo.obrigatorio && (
                              <span className="campo-required">
                                Obrigatório
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="formulario-actions">
                      <button
                        type="submit"
                        className="save-btn"
                        disabled={sending}
                      >
                        {sending ? "Enviando..." : "Enviar"}
                      </button>
                      {success && (
                        <span className="success-message">
                          Formulário enviado!
                        </span>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="formulario-empty">
                    <p>Este formulário não possui campos cadastrados.</p>
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
    </div>
  );
}
