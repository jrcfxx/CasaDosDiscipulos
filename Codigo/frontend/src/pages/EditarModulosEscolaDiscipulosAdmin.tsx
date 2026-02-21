import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../style/EditarModulosEscolaDiscipulosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import InputModal from "../components/ui/InputModal";

import moduloService from "../services/moduloService";
import campoService from "../services/campoService";
import { showAllNiveis } from "../services/nivel";
import { uploadCampo } from "../services/uploadService";
import { Campo, FieldType } from "../types";

import TextField from "../components/fields/TextField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";
import QuizField from "../components/fields/QuizField";

const fieldOptions = [
  { label: "Texto", value: FieldType.TEXT, component: TextField },
  { label: "Número", value: FieldType.NUMBER, component: NumberField },
  { label: "Data", value: FieldType.DATE, component: DateField },
  { label: "Link", value: FieldType.LINK, component: LinkField },
  { label: "Upload", value: FieldType.UPLOAD, component: UploadField },
  { label: "Vídeo", value: "video", component: VideoField },
  { label: "Quiz", value: "QUIZ", component: QuizField },
];

const EditarModulosEscolaDiscipulosAdmin: React.FC = () => {
  const { id_modulo } = useParams<{ id_modulo: string }>();
  const navigate = useNavigate();

  const [moduleName, setModuleName] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleOrder, setModuleOrder] = useState<number>(1);
  const [fields, setFields] = useState<
    { id: string; tipo: string; label: string; conteudo?: any; campo?: Campo }[]
  >([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [obrigatorio, setObrigatorio] = useState(true);
  const [idNivel, setIdNivel] = useState<number | "">("");
  const [preRequisitos, setPreRequisitos] = useState<number[]>([]);

  const nameRef = useRef<HTMLInputElement>(null);

  const [availableFields, setAvailableFields] = useState<Campo[]>([]);
  const [listaModulos, setListaModulos] = useState<{ id_modulo: number; titulo: string }[]>([]);
  const [niveis, setNiveis] = useState<{ id_nivel: number; nome: string; ordem: number }[]>([]);

  // Carregar campos disponíveis para modalidade "modulo"
  useEffect(() => {
    const loadFields = async () => {
      try {
        const campos = await campoService.getByModalidade("modulo");
        setAvailableFields(campos);
      } catch (error) {
        console.error("Erro ao carregar campos:", error);
      }
    };
    loadFields();
  }, []);

  // Função para carregar dados do módulo (extraída para reutilização)
  const loadModulo = async () => {
    if (!id_modulo) {
      console.error("ID do módulo não encontrado na URL");
      showToast("ID do módulo não encontrado");
      navigate("/admin/modulos");
      return;
    }

    const moduloId = Number(id_modulo);
    if (isNaN(moduloId) || moduloId <= 0) {
      console.error("ID do módulo inválido:", id_modulo);
      showToast("ID do módulo inválido");
      navigate("/admin/modulos");
      return;
    }

    try {
      setLoading(true);
      const modulo = await moduloService.getById(moduloId);

      if (!modulo) {
        showToast("Módulo não encontrado");
        navigate("/admin/modulos");
        return;
      }

      setModuleName(modulo.titulo || "");
      setModuleDescription(modulo.descricao || "");
      setModuleOrder(modulo.ordem || 1);
      setIsActive(modulo.ativo !== false);
      const obs = modulo.obrigatorio as boolean | number | undefined;
      setObrigatorio(obs !== false && obs !== 0);
      setIdNivel((modulo as any).id_nivel ?? "");
      setPreRequisitos((modulo as any).pre_requisitos || []);

      // Buscar quiz vinculado primeiro
      let quizVinculado = null;
      try {
        const quizData = await moduloService.getQuizVinculado(moduloId);
        if (quizData && quizData.id_quiz) {
          setSelectedQuizId(quizData.id_quiz);
          quizVinculado = quizData;
        }
      } catch {
        // Quiz opcional
      }

      // Mapear campos do módulo e adicionar quiz se houver
      const mappedFields: any[] = [];

      if (modulo.campos && modulo.campos.length > 0) {
        modulo.campos.forEach((c: any) => {
          mappedFields.push({
            id: `field-${c.id}`,
            tipo: c.tipo_campo || "texto",
            label: c.label || "",
            conteudo: c.conteudo || "",
            campo: c,
          });
        });
      }

      // Adicionar campo quiz se houver quiz vinculado
      if (quizVinculado) {
        mappedFields.push({
          id: `quiz-${Date.now()}`,
          tipo: "QUIZ",
          label: "Quiz",
        });
      }

      setFields(mappedFields);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar módulo:", err);
      showToast("Erro ao carregar módulo");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModulo();
  }, [id_modulo, navigate]);

  useEffect(() => {
    const loadModulos = async () => {
      try {
        const mods = await moduloService.getAll();
        setListaModulos(mods.map((m) => ({ id_modulo: m.id_modulo, titulo: m.titulo })));
      } catch {
        setListaModulos([]);
      }
    };
    loadModulos();
  }, []);

  useEffect(() => {
    const loadNiveis = async () => {
      try {
        const n = await showAllNiveis();
        setNiveis(Array.isArray(n) ? n : []);
      } catch {
        setNiveis([]);
      }
    };
    loadNiveis();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelModalTipo, setLabelModalTipo] = useState<string | null>(null);

  const addField = (tipo: string) => {
    if (tipo === "QUIZ") {
      if (selectedQuizId) {
        showToast("Quiz já selecionado.");
        return;
      }
      setFields((prev) => [
        ...prev,
        { id: `quiz-${Date.now()}`, tipo: "QUIZ", label: "Quiz" },
      ]);
      return;
    }

    setLabelModalTipo(tipo);
    setLabelModalOpen(true);
  };

  const confirmAddField = (label: string) => {
    if (!label.trim()) return;
    const tipo = labelModalTipo;
    setLabelModalOpen(false);
    setLabelModalTipo(null);

    const campoDisponivel = availableFields.find((c) => c.tipo_campo === tipo);

    if (!campoDisponivel) {
      showToast(`Campo do tipo ${tipo} não encontrado`);
      return;
    }

    setFields((prev) => [
      ...prev,
      {
        id: `field-${Date.now()}`,
        tipo: tipo!,
        label: label.trim(),
        conteudo: "",
        campo: {
          id_campo: campoDisponivel.id_campo,
          tipo_campo: campoDisponivel.tipo_campo,
        },
      },
    ]);
  };

  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (
      selectedQuizId &&
      fields.find((f) => f.id === fieldId)?.tipo === "QUIZ"
    ) {
      setSelectedQuizId(null);
    }
    showToast("Campo removido");
  };

  const onSave = async () => {
    if (!moduleName.trim()) {
      setError(true);
      nameRef.current?.focus();
      return;
    }

    if (!id_modulo) {
      showToast("ID do módulo não encontrado");
      return;
    }

    const moduloId = Number(id_modulo);
    if (isNaN(moduloId) || moduloId <= 0) {
      showToast("ID do módulo inválido");
      return;
    }

    try {
      setError(false);
      setLoading(true);

      const camposProcessados = await Promise.all(
        fields
          .filter((f) => f.tipo !== "QUIZ")
          .map(async (f, index) => {
            const idCampo = f.campo?.id_campo;
            if (!idCampo) return null;

            let conteudo = f.conteudo ?? "";

            // Se for File (upload), enviar primeiro e obter o caminho
            if (conteudo instanceof File) {
              try {
                conteudo = await uploadCampo(conteudo);
              } catch (err: any) {
                const msg =
                  err?.response?.data?.error ||
                  err?.message ||
                  "Falha ao enviar o arquivo";
                showToast(`Erro no campo "${f.label}": ${msg}`);
                throw err;
              }
            }

            return {
              id_campo: idCampo,
              label: f.label,
              conteudo: typeof conteudo === "string" ? conteudo : "",
              ordem: index + 1,
            };
          })
      );

      const camposSemQuiz = camposProcessados.filter(
        (
          c
        ): c is {
          id_campo: number;
          label: string;
          conteudo: string;
          ordem: number;
        } => c !== null
      );

      await moduloService.update(moduloId, {
        titulo: moduleName,
        descricao: moduleDescription,
        ordem: moduleOrder,
        obrigatorio,
        id_nivel: obrigatorio && idNivel ? Number(idNivel) : undefined,
        pre_requisitos: preRequisitos,
        campos: camposSemQuiz,
      });

      // Gerenciar vínculo do quiz
      const quizVinculado = await moduloService
        .getQuizVinculado(moduloId)
        .catch(() => null);

      if (selectedQuizId && !quizVinculado) {
        // Vincular novo quiz
        await moduloService.vincularQuiz(moduloId, selectedQuizId);
      } else if (!selectedQuizId && quizVinculado) {
        // Remover vínculo existente
        await moduloService.desvincularQuiz(moduloId, quizVinculado.id_quiz);
      } else if (
        selectedQuizId &&
        quizVinculado &&
        selectedQuizId !== quizVinculado.id_quiz
      ) {
        // Atualizar vínculo (remover antigo e adicionar novo)
        await moduloService.desvincularQuiz(moduloId, quizVinculado.id_quiz);
        await moduloService.vincularQuiz(moduloId, selectedQuizId);
      }

      showToast("Módulo atualizado com sucesso!");

      // Recarregar dados do módulo após salvar
      await loadModulo();

      setTimeout(() => navigate("/admin/modulos"), 1000);
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar módulo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    if (!id_modulo) return;

    const moduloId = Number(id_modulo);
    if (isNaN(moduloId) || moduloId <= 0) return;

    try {
      await moduloService.toggleActive(moduloId);
      setIsActive((prev) => !prev);
      showToast(isActive ? "Módulo desativado" : "Módulo ativado");

      // Recarregar dados do módulo após alternar status
      await loadModulo();
    } catch (err) {
      console.error(err);
      showToast("Erro ao alterar status do módulo.");
    }
  };

  return (
    <div className="editar-modulo-page">
      <Header />
      <div className="editar-modulo-container">
        <h1 className="editar-modulo-title">EDITAR MÓDULO</h1>
      </div>

      {loading ? (
        <main id="main-content" className="editar-modulo-container" tabIndex={-1}>
          <div className="editar-modulo-panel editar-modulo-panel-main">
            <p
              style={{ textAlign: "center", padding: "2rem", color: "#4a5568" }}
            >
              Carregando dados do módulo...
            </p>
          </div>
        </main>
      ) : (
        <main id="main-content" className="editar-modulo-container" tabIndex={-1}>
          <div className="editar-modulo-grid">
            <section
              className="editar-modulo-panel editar-modulo-panel-main"
              aria-label="Editor de módulo"
            >
              <label className="editar-modulo-label" htmlFor="moduleName">
                Nome do módulo
              </label>
              <input
                id="moduleName"
                ref={nameRef}
                className={`editar-modulo-input ${
                  error ? "editar-modulo-input-error" : ""
                }`}
                placeholder="Digite o nome do módulo"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
              />

              <label
                className="editar-modulo-label"
                htmlFor="moduleDescription"
              >
                Descrição
              </label>
              <textarea
                id="moduleDescription"
                className="editar-modulo-input"
                placeholder="Digite a descrição do módulo"
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
              />

              <div className="editar-modulo-toggle-row">
                <label className="editar-modulo-label" htmlFor="moduleTipo">Tipo do módulo</label>
                <label className="editar-modulo-toggle" title={obrigatorio ? "Obrigatório: segue sequência e conta para o nível" : "Opcional: livre, não bloqueia, não conta para nível"}>
                  <input
                    id="moduleTipo"
                    type="checkbox"
                    checked={obrigatorio}
                    onChange={(e) => setObrigatorio(e.target.checked)}
                    aria-label="Módulo obrigatório"
                  />
                  <span className="editar-modulo-toggle-slider" />
                  <span className="editar-modulo-toggle-text">
                    {obrigatorio ? "Obrigatório" : "Opcional"}
                  </span>
                </label>
                <p className="editar-modulo-hint">
                  {obrigatorio
                    ? "Obrigatório: segue sequência e aumenta o nível do usuário."
                    : "Opcional: livre, acessível a qualquer momento, não conta para o nível."}
                </p>
              </div>

              {obrigatorio && (
                <div className="editar-modulo-field-row">
                  <label className="editar-modulo-label" htmlFor="moduleNivel">
                    Nível vinculado
                  </label>
                  <select
                    id="moduleNivel"
                    className="editar-modulo-input"
                    value={idNivel}
                    onChange={(e) => setIdNivel(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Nenhum (não conta para nível)</option>
                    {niveis.map((n) => (
                      <option key={n.id_nivel} value={n.id_nivel}>
                        {n.nome}
                      </option>
                    ))}
                  </select>
                  <p className="editar-modulo-hint">
                    Nível que o usuário atinge ao concluir este módulo (cadastrados em Gerenciar Usuários).
                  </p>
                </div>
              )}

              <div className="editar-modulo-field-row">
                <span className="editar-modulo-label">Pré-requisitos</span>
                <p className="editar-modulo-hint" style={{ marginBottom: "0.5rem" }}>
                  Módulos que devem ser concluídos antes deste (deixe vazio para usar a ordem).
                </p>
                {listaModulos.filter((m) => m.id_modulo !== (id_modulo ? Number(id_modulo) : 0)).length === 0 ? (
                  <p className="editar-modulo-hint">Nenhum outro módulo para selecionar.</p>
                ) : (
                  <div className="editar-modulo-pre-req-list">
                    {listaModulos
                      .filter((m) => m.id_modulo !== (id_modulo ? Number(id_modulo) : 0))
                      .map((m) => (
                        <label key={m.id_modulo} className="editar-modulo-pre-req-item" htmlFor={`pre-req-${m.id_modulo}`}>
                          <input
                            id={`pre-req-${m.id_modulo}`}
                            type="checkbox"
                            checked={preRequisitos.includes(m.id_modulo)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreRequisitos((prev) => [...prev, m.id_modulo]);
                              } else {
                                setPreRequisitos((prev) => prev.filter((id) => id !== m.id_modulo));
                              }
                            }}
                          />
                          <span>{m.titulo}</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              <h3 className="editar-modulo-section-title">Conteúdos</h3>

              {fields.map((f) => {
                if (f.tipo === "QUIZ") {
                  return (
                    <div key={f.id} className="editar-modulo-field-card">
                      <button
                        className="editar-modulo-field-remove"
                        onClick={() => removeField(f.id)}
                        title="Remover campo"
                        type="button"
                      >
                        ×
                      </button>
                      <QuizField
                        name={`quiz-${f.id}`}
                        label={f.label}
                        value={selectedQuizId}
                        onChange={setSelectedQuizId}
                      />
                    </div>
                  );
                }

                const FieldComponent = fieldOptions.find(
                  (opt) => opt.value === f.tipo
                )?.component;

                if (!FieldComponent) return null;

                return (
                  <div key={f.id} className="editar-modulo-field-card">
                    <button
                      className="editar-modulo-field-remove"
                      onClick={() => removeField(f.id)}
                      title="Remover campo"
                      type="button"
                    >
                      ×
                    </button>
                    <FieldComponent
                      name={`field-${f.id}`}
                      label={f.label}
                      value={f.conteudo}
                      onChange={(val: any) =>
                        setFields((prev) =>
                          prev.map((field) =>
                            field.id === f.id
                              ? { ...field, conteudo: val }
                              : field
                          )
                        )
                      }
                    />
                  </div>
                );
              })}

              <div className="editar-modulo-add-buttons">
                {fieldOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className="editar-modulo-btn editar-modulo-btn-outline"
                    onClick={() => addField(opt.value)}
                  >
                    + {opt.label}
                  </button>
                ))}
              </div>

              <div className="editar-modulo-actions">
                <button
                  className="editar-modulo-btn editar-modulo-btn-primary"
                  onClick={onSave}
                >
                  Salvar
                </button>
                <button
                  className="editar-modulo-btn editar-modulo-btn-secondary"
                  onClick={() => navigate("/admin/modulos")}
                >
                  Cancelar
                </button>
              </div>
            </section>

            <aside className="editar-modulo-panel editar-modulo-panel-aside">
              <h3 className="editar-modulo-aside-title">
                Liberar para Discípulos
              </h3>
              <p className="editar-modulo-aside-description">
                Controle a visibilidade do módulo para os alunos.
              </p>
              <div className="editar-modulo-toggle-container">
                <label className="editar-modulo-toggle-label">
                  <span className="editar-modulo-toggle-text">
                    {isActive ? "Módulo Ativo" : "Módulo Inativo"}
                  </span>
                  <button
                    className={`editar-modulo-toggle-btn ${
                      isActive ? "active" : ""
                    }`}
                    onClick={toggleActive}
                    type="button"
                    aria-label={isActive ? "Desativar módulo" : "Ativar módulo"}
                  >
                    <span className="editar-modulo-toggle-slider"></span>
                  </button>
                </label>
              </div>
              <p className="editar-modulo-toggle-info">
                {isActive
                  ? "Os discípulos podem visualizar este módulo."
                  : "Este módulo está oculto para os discípulos."}
              </p>
            </aside>
          </div>
        </main>
      )}

      {toast && <div className="editar-modulo-toast">{toast}</div>}
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
      <Footer />
    </div>
  );
};

export default EditarModulosEscolaDiscipulosAdmin;
