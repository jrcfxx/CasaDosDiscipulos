import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/CriarModulosEscolaDiscipulosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import moduloService from "../services/moduloService";
import campoService from "../services/campoService";
import { Campo, FieldType } from "../types";

// Import dos componentes de campo
import TextField from "../components/fields/TextField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";
import QuizField from "../components/fields/QuizField";

// Tipos de campos disponíveis
const fieldOptions = [
  { label: "Texto", value: FieldType.TEXT, component: TextField },
  { label: "Número", value: FieldType.NUMBER, component: NumberField },
  { label: "Data", value: FieldType.DATE, component: DateField },
  { label: "Link", value: FieldType.LINK, component: LinkField },
  { label: "Upload", value: FieldType.UPLOAD, component: UploadField },
  { label: "Vídeo", value: "video", component: VideoField },
  { label: "Quiz", value: "QUIZ", component: QuizField },
];

const CriarModulosEscolaDiscipulosAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [moduleName, setModuleName] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleOrder, setModuleOrder] = useState<number>(1);
  const [fields, setFields] = useState<
    { id: string; tipo: string; label: string; conteudo?: any; campo?: Campo }[]
  >([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const nameRef = useRef<HTMLInputElement>(null);

  const [availableFields, setAvailableFields] = useState<Campo[]>([]);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const campos = await campoService.getByModalidade("modulo");
        setAvailableFields(campos);
      } catch (error) {
        console.error("Erro ao carregar campos:", error);
        showToast("Erro ao carregar campos disponíveis");
      }
    };
    loadFields();
  }, []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
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

    const campo = availableFields.find((c) => c.tipo_campo === tipo);

    if (!campo) {
      showToast(`Nenhum campo disponível para o tipo ${tipo}`);
      return;
    }

    setFields((prev) => [
      ...prev,
      {
        id: `field-${Date.now()}`,
        tipo,
        label,
        conteudo: "",
        campo,
      },
    ]);
  };

  const removeField = (id: string) => {
    const field = fields.find((f) => f.id === id);
    if (field?.tipo === "QUIZ") {
      setSelectedQuizId(null);
    }
    setFields((prev) => prev.filter((f) => f.id !== id));
    showToast("Campo removido");
  };

  const onSave = async () => {
    if (!moduleName.trim()) {
      setError(true);
      nameRef.current?.focus();
      showToast("Nome do módulo é obrigatório");
      return;
    }

    try {
      setError(false);
      setLoading(true);

      // Preparar campos (excluindo Quiz que será enviado separadamente)
      const camposParaEnviar = fields
        .filter((f) => f.tipo !== "QUIZ" && f.campo)
        .map((f, index) => ({
          id_campo: f.campo!.id_campo,
          label: f.label,
          conteudo: f.conteudo || "",
          ordem: index + 1, // Ordem sequencial começando em 1
        }));

      // Criar módulo com campos
      const moduloData = {
        titulo: moduleName,
        descricao: moduleDescription || "",
        ordem: moduleOrder,
        ativo: isActive,
        campos: camposParaEnviar,
      };

      console.log("Dados enviados:", moduloData);

      const moduloCriado = await moduloService.create(moduloData as any);

      // Vincular quiz ao módulo, se selecionado
      if (selectedQuizId) {
        try {
          await moduloService.vincularQuiz(
            moduloCriado.id_modulo,
            selectedQuizId
          );
          console.log(
            `Quiz ${selectedQuizId} vinculado ao módulo ${moduloCriado.id_modulo}`
          );
        } catch (error) {
          console.error("Erro ao vincular quiz:", error);
          showToast("Módulo criado, mas erro ao vincular quiz");
          return;
        }
      }

      showToast("Módulo criado com sucesso!");

      setTimeout(() => {
        navigate("/admin/modulos");
      }, 1000);
    } catch (err: any) {
      console.error("Erro ao criar módulo:", err);

      // Exibir mensagem de erro específica do backend
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.[0] ||
        "Erro ao criar módulo. Verifique os campos.";

      console.log("Detalhes do erro:", err.response?.data);
      showToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = () => {
    setIsActive((prev) => !prev);
  };

  return (
    <div className="criar-modulo-page">
      <Header />
      <div className="criar-modulo-container">
        <h1 className="criar-modulo-title">CRIAR MÓDULO</h1>
      </div>

      <main className="criar-modulo-container">
        <div className="criar-modulo-grid">
          <section
            className="criar-modulo-panel criar-modulo-panel-main"
            aria-label="Editor de módulo"
          >
            <label className="criar-modulo-label" htmlFor="moduleName">
              Nome do módulo
            </label>
            <input
              id="moduleName"
              ref={nameRef}
              className={`criar-modulo-input ${
                error ? "criar-modulo-input-error" : ""
              }`}
              placeholder="Digite o nome do módulo"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
            />

            <label className="criar-modulo-label" htmlFor="moduleDescription">
              Descrição
            </label>
            <textarea
              id="moduleDescription"
              className="criar-modulo-input"
              placeholder="Digite a descrição do módulo"
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
            />

            <label className="criar-modulo-label" htmlFor="moduleOrder">
              Ordem
            </label>
            <input
              id="moduleOrder"
              type="number"
              className="criar-modulo-input"
              placeholder="Ordem do módulo"
              value={moduleOrder}
              onChange={(e) => setModuleOrder(Number(e.target.value))}
              min="1"
            />

            <h3 className="criar-modulo-section-title">Conteúdos</h3>
            {fields.map((f) => {
              const fieldOption = fieldOptions.find(
                (opt) => opt.value === f.tipo
              );

              if (!fieldOption) return null;

              const FieldComponent = fieldOption.component as React.FC<{
                name: string;
                label: string;
                value: any;
                onChange: (val: any) => void;
              }>;

              return (
                <div key={f.id} className="criar-modulo-field-card">
                  <button
                    className="criar-modulo-field-remove"
                    onClick={() => removeField(f.id)}
                    title="Remover campo"
                    type="button"
                  >
                    ×
                  </button>
                  <FieldComponent
                    name={f.id}
                    label={f.label}
                    value={
                      f.tipo === "QUIZ" ? selectedQuizId : f.conteudo || ""
                    }
                    onChange={(val: any) => {
                      if (f.tipo === "QUIZ") {
                        setSelectedQuizId(val);
                      } else {
                        setFields((prev) =>
                          prev.map((field) =>
                            field.id === f.id
                              ? { ...field, conteudo: val }
                              : field
                          )
                        );
                      }
                    }}
                  />
                </div>
              );
            })}

            <div className="criar-modulo-add-buttons">
              {fieldOptions.map((opt) => (
                <button
                  key={opt.value}
                  className="criar-modulo-btn criar-modulo-btn-outline"
                  onClick={() => addField(opt.value)}
                  disabled={loading}
                >
                  + {opt.label}
                </button>
              ))}
            </div>

            <div className="criar-modulo-actions">
              <button
                className="criar-modulo-btn criar-modulo-btn-primary"
                onClick={onSave}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
              <button
                className="criar-modulo-btn criar-modulo-btn-secondary"
                onClick={() => navigate("/admin/modulos")}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </section>

          <aside className="criar-modulo-panel criar-modulo-panel-aside">
            <h3 className="criar-modulo-aside-title">
              Liberar para Discípulos
            </h3>
            <p className="criar-modulo-aside-description">
              Defina se o módulo estará visível para os alunos ao ser criado.
            </p>
            <div className="criar-modulo-toggle-container">
              <label className="criar-modulo-toggle-label">
                <span className="criar-modulo-toggle-text">
                  {isActive ? "Módulo Ativo" : "Módulo Inativo"}
                </span>
                <button
                  className={`criar-modulo-toggle-btn ${
                    isActive ? "active" : ""
                  }`}
                  onClick={toggleActive}
                  type="button"
                  aria-label={isActive ? "Desativar módulo" : "Ativar módulo"}
                >
                  <span className="criar-modulo-toggle-slider"></span>
                </button>
              </label>
            </div>
            <p className="criar-modulo-toggle-info">
              {isActive
                ? "O módulo será criado ativo e visível para os discípulos."
                : "O módulo será criado inativo. Você pode ativá-lo depois na edição."}
            </p>
          </aside>
        </div>
      </main>

      {toast && <div className="criar-modulo-toast">{toast}</div>}

      <Footer />
    </div>
  );
};

export default CriarModulosEscolaDiscipulosAdmin;
