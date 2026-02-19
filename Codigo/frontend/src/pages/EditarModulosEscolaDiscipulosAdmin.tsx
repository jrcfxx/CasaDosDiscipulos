import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../style/EditarModulosEscolaDiscipulosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import moduloService from "../services/moduloService";
import campoService from "../services/campoService";
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

  const nameRef = useRef<HTMLInputElement>(null);

  const [availableFields, setAvailableFields] = useState<Campo[]>([]);

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
      setIsActive(modulo.ativo || false);

      // Buscar quiz vinculado primeiro
      let quizVinculado = null;
      try {
        const quizData = await moduloService.getQuizVinculado(moduloId);
        if (quizData && quizData.id_quiz) {
          setSelectedQuizId(quizData.id_quiz);
          quizVinculado = quizData;
        }
      } catch (err) {
        console.log("Nenhum quiz vinculado");
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

  // Carregar dados do módulo ao montar o componente
  useEffect(() => {
    loadModulo();
  }, [id_modulo, navigate]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

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

    const label = prompt("Digite o label do campo:");
    if (!label) return;

    // Buscar o campo personalizado disponível para este tipo
    const campoDisponivel = availableFields.find((c) => c.tipo_campo === tipo);

    if (!campoDisponivel) {
      showToast(`Campo do tipo ${tipo} não encontrado`);
      return;
    }

    setFields((prev) => [
      ...prev,
      {
        id: `field-${Date.now()}`,
        tipo,
        label,
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

      const camposSemQuiz = fields
        .filter((f) => f.tipo !== "QUIZ")
        .map((f, index) => {
          // Verifica se tem id_campo (campo personalizado vinculado)
          const idCampo = f.campo?.id_campo;

          if (!idCampo) {
            console.warn("Campo sem id_campo encontrado:", f);
            return null;
          }

          return {
            id_campo: idCampo,
            label: f.label,
            conteudo: f.conteudo || "",
            ordem: index + 1, // Ordem sequencial começando em 1
          };
        })
        .filter(
          (
            c
          ): c is {
            id_campo: number;
            label: string;
            conteudo: any;
            ordem: number;
          } => c !== null
        ); // Remove campos inválidos

      await moduloService.update(moduloId, {
        titulo: moduleName,
        descricao: moduleDescription,
        ordem: moduleOrder,
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
        <main className="editar-modulo-container">
          <div className="editar-modulo-panel editar-modulo-panel-main">
            <p
              style={{ textAlign: "center", padding: "2rem", color: "#4a5568" }}
            >
              Carregando dados do módulo...
            </p>
          </div>
        </main>
      ) : (
        <main className="editar-modulo-container">
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
      <Footer />
    </div>
  );
};

export default EditarModulosEscolaDiscipulosAdmin;
