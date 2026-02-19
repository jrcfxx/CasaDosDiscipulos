import React, { useEffect, useState } from "react";
import "../style/FormulariosSecretariaCelulasLeader.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import formularioService, { FormularioCampo } from "../services/formularioService";
import celulaService from "../services/celulaService";
import formularioRespostaService from "../services/formularioRespostaService";
import authService from "../services/authService";
import TextField from "../components/fields/TextField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";
import { ASSETS_BASE } from "../config/api";

type Formulario = {
  id_formulario: number;
  titulo: string;
  descricao?: string | null;
  ativo: boolean;
  campos?: FormularioCampo[];
};

type LocalField = {
  uid: number;
  id_formulario_campo: number;
  tipo: string;
  label: string;
  conteudo: any;
  obrigatorio?: boolean;
};

type Celula = {
  id_celula: number;
  nome: string;
};

export default function FormulariosSecretariaCelulasLeader() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [selectedFormulario, setSelectedFormulario] = useState<Formulario | null>(null);
  const [selectedCelula, setSelectedCelula] = useState<number | null>(null);
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
      const user = authService.getUser();
      const idUsuario = user?.id_usuario;

      const [formulariosRes, celulasRes] = await Promise.all([
        formularioService.getAll(),
        idUsuario ? celulaService.getByLider(idUsuario) : celulaService.getAtivas(),
      ]);

      const formulariosNorm = (formulariosRes || []).map((f) => ({
        ...f,
        id_formulario: f.id_formulario,
        ativo: f.ativo === 1 || f.ativo === true,
      })) as Formulario[];

      setFormularios(formulariosNorm);
      setCelulas(celulasRes);

      if (formulariosNorm.length > 0 && !selectedFormulario) {
        setSelectedFormulario(formulariosNorm[0]);
      }
      if (celulasRes.length > 0 && selectedCelula === null) {
        setSelectedCelula(celulasRes[0].id_celula);
      }
    } catch (err) {
      showToast("Erro ao buscar dados");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedFormulario?.campos) {
      setFields(
        selectedFormulario.campos.map((c, idx) => ({
          uid: idx,
          id_formulario_campo: c.id ?? c.id_campo ?? idx,
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
    if (campo.tipo === "upload" && campo.conteudo) {
      const fileName = String(campo.conteudo).split("/").pop() || "arquivo";
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
      const url = String(campo.conteudo).startsWith("http")
        ? campo.conteudo
        : `${ASSETS_BASE}${campo.conteudo}`;
      return (
        <div className="upload-preview-campo">
          {isImage && (
            <img src={url} alt={fileName} style={{ maxWidth: 200, maxHeight: 200 }} />
          )}
          <a href={url} target="_blank" rel="noopener noreferrer">
            📄 {fileName}
          </a>
        </div>
      );
    }
    if (campo.tipo === "video" && campo.conteudo) {
      const url = String(campo.conteudo).startsWith("http")
        ? campo.conteudo
        : `${ASSETS_BASE}${campo.conteudo}`;
      return (
        <div className="video-preview-campo">
          <video controls src={url} style={{ maxWidth: 400 }} />
        </div>
      );
    }
    return campo.conteudo ? String(campo.conteudo) : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormulario || selectedCelula === null) {
      showToast("Selecione um formulário e uma célula");
      return;
    }

    const obrigatorios = fields.filter((f) => f.obrigatorio && !f.conteudo);
    if (obrigatorios.length > 0) {
      showToast("Preencha todos os campos obrigatórios");
      return;
    }

    setSending(true);
    try {
      const camposPayload = fields.map((f) => ({
        id_formulario_campo: f.id_formulario_campo,
        resposta: String(f.conteudo ?? ""),
      }));

      await formularioRespostaService.criar({
        id_formulario: selectedFormulario.id_formulario,
        id_celula: selectedCelula,
        campos: camposPayload,
      });

      setSuccess(true);
      setFields((prev) => prev.map((f) => ({ ...f, conteudo: "" })));
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
          <aside className="panel formularios-left" aria-label="Lista de formulários">
            <div className="list-header">
              <h2>Formulários</h2>
              <span className="count">{formularios.length}</span>
            </div>
            <div className="list">
              {formularios.map((formulario) => (
                <div
                  key={formulario.id_formulario}
                  className={`formulario-item ${
                    selectedFormulario?.id_formulario === formulario.id_formulario
                      ? "selected"
                      : ""
                  } ${!formulario.ativo ? "inactive" : ""}`}
                  onClick={() => handleSelectFormulario(formulario)}
                >
                  <span className="formulario-item__name">{formulario.titulo}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="panel formularios-center" aria-label="Formulário">
            {selectedFormulario ? (
              <div className="formulario-card">
                <div className="formulario-header">
                  <h2 className="formulario-title">{selectedFormulario.titulo}</h2>
                  <span className={`badge badge-${selectedFormulario.ativo ? "active" : "inactive"}`}>
                    {selectedFormulario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {selectedFormulario.descricao && (
                  <div className="formulario-description">
                    <p>{selectedFormulario.descricao}</p>
                  </div>
                )}

                {selectedFormulario.campos?.length ? (
                  <form className="formulario-fields" onSubmit={handleSubmit}>
                    <div className="celula-selector">
                      <label htmlFor="celula">Célula *</label>
                      <select
                        id="celula"
                        value={selectedCelula ?? ""}
                        onChange={(e) => setSelectedCelula(Number(e.target.value))}
                        required
                      >
                        <option value="">Selecione a célula</option>
                        {celulas.map((c) => (
                          <option key={c.id_celula} value={c.id_celula}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <h3>Preencha os campos</h3>
                    <div className="campos-grid">
                      {fields.map((campo) => {
                        const safeLabel = String(campo.label ?? "Campo");
                        return (
                          <div key={campo.uid} className="campo-card">
                            <div className="campo-label">
                              {campo.label}
                              {campo.obrigatorio && " *"}
                            </div>
                            <div className="campo-conteudo">
                              {campo.tipo === "texto" && (
                                <TextField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label=""
                                  placeholder={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v) => handleChangeField(campo.uid, v)}
                                />
                              )}
                              {campo.tipo === "numero" && (
                                <NumberField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label=""
                                  placeholder={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v) => handleChangeField(campo.uid, v)}
                                />
                              )}
                              {campo.tipo === "data" && (
                                <DateField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label=""
                                  placeholder={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v) => handleChangeField(campo.uid, v)}
                                />
                              )}
                              {campo.tipo === "link" && (
                                <LinkField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label=""
                                  placeholder={safeLabel}
                                  value={campo.conteudo}
                                  onChange={(v) => handleChangeField(campo.uid, v)}
                                />
                              )}
                              {campo.tipo === "upload" && (
                                <UploadField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label=""
                                  value={campo.conteudo}
                                  onChange={(v) => handleChangeField(campo.uid, v)}
                                />
                              )}
                              {campo.tipo === "video" && (
                                <VideoField
                                  id={`campo_${campo.uid}`}
                                  name={`campo_${campo.uid}`}
                                  label=""
                                  value={campo.conteudo}
                                  onChange={(v) => handleChangeField(campo.uid, v)}
                                />
                              )}
                              {formatarConteudoCampo(campo)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="formulario-actions">
                      <button type="submit" className="save-btn" disabled={sending}>
                        {sending ? "Enviando..." : "Enviar"}
                      </button>
                      {success && <span className="success-message">Formulário enviado!</span>}
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
                <p>Selecione um formulário na lista</p>
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
