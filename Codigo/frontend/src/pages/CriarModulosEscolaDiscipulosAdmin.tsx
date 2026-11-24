import type { ErroApi } from "../utils/errorUtils";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/CriarModulosEscolaDiscipulosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import InputModal from "../components/ui/InputModal";

import moduloService from "../services/moduloService";
import campoService from "../services/campoService";
import { showAllNiveis } from "../services/nivel";
import { uploadCampo } from "../services/uploadService";
import { Campo, FieldType } from "../types";

// Import dos componentes de campo
import TextField from "../components/fields/TextField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";
import QuizField from "../components/fields/QuizField";
import type { ValorCampo } from "../types/campoConteudo";
import Icone from "../components/ui/Icone";
import { erroDoModulo } from "../utils/validarModulo";

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
    { id: string; tipo: string; label: string; conteudo?: ValorCampo; campo?: Campo }[]
  >([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [obrigatorio, setObrigatorio] = useState(true);
  const [idNivel, setIdNivel] = useState<number | "">("");
  const [preRequisitos, setPreRequisitos] = useState<number[]>([]);

  const nameRef = useRef<HTMLInputElement>(null);
  const ordemMexida = useRef(false);

  const [availableFields, setAvailableFields] = useState<Campo[]>([]);
  const [listaModulos, setListaModulos] = useState<{ id_modulo: number; titulo: string }[]>([]);
  const [niveis, setNiveis] = useState<{ id_nivel: number; nome: string; ordem: number }[]>([]);

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
    const loadModulos = async () => {
      try {
        const mods = await moduloService.getAll();
        setListaModulos(mods.map((m) => ({ id_modulo: m.id_modulo, titulo: m.titulo })));
        // Novo módulo entra no fim da trilha (antes vinha "1" e empatava com o primeiro)
        if (!ordemMexida.current) {
          setModuleOrder(mods.reduce((maior, m) => Math.max(maior, Number(m.ordem) || 0), 0) + 1);
        }
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

  // Erros ficam mais tempo na tela (dava tempo de ler só o começo)
  const showToast = (msg: string, ms = 3500) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), ms);
  };

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelModalTipo, setLabelModalTipo] = useState<string | null>(null);

  const addField = (tipo: string) => {
    if (tipo === "QUIZ") {
      if (fields.some((f) => f.tipo === "QUIZ")) {
        showToast("O módulo já tem um bloco de quiz.");
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
    const repetido = fields.some(
      (f) => f.tipo !== "QUIZ" && f.label.trim().toLocaleLowerCase("pt-BR") === label.trim().toLocaleLowerCase("pt-BR")
    );
    if (repetido) {
      showToast(`Já existe um conteúdo chamado "${label.trim()}". Use outro nome.`);
      return;
    }
    const tipo = labelModalTipo;
    setLabelModalOpen(false);
    setLabelModalTipo(null);

    const campo = availableFields.find((c) => c.tipo_campo === tipo);

    if (!campo) {
      showToast(`Nenhum campo disponível para o tipo ${tipo}`);
      return;
    }

    setFields((prev) => [
      ...prev,
      {
        id: `field-${Date.now()}`,
        tipo: tipo!,
        label: label.trim(),
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
    const problema = erroDoModulo({
      titulo: moduleName,
      conteudos: fields.filter((f) => f.tipo !== "QUIZ").map((f) => ({ tipo: f.tipo, label: f.label, conteudo: f.conteudo })),
      temBlocoQuiz: fields.some((f) => f.tipo === "QUIZ"),
      quizEscolhido: selectedQuizId,
    });
    if (problema) {
      if (moduleName.trim().length < 3) {
        setError(true);
        nameRef.current?.focus();
      }
      showToast(problema, 4500);
      return;
    }

    try {
      setError(false);
      setLoading(true);

      // Processar uploads antes de montar o payload
      const camposProcessados = await Promise.all(
        fields
          .filter((f) => f.tipo !== "QUIZ" && f.campo)
          .map(async (f, index) => {
            let conteudo = f.conteudo ?? "";

            // Se for File (upload), enviar primeiro e obter o caminho
            if (conteudo instanceof File) {
              try {
                conteudo = await uploadCampo(conteudo);
              } catch (erro) {
                const err = erro as ErroApi;
                const msg =
                  err?.response?.data?.error ||
                  err?.message ||
                  "Falha ao enviar o arquivo";
                showToast(`Erro no campo "${f.label}": ${msg}`);
                throw err;
              }
            }

            return {
              id_campo: f.campo!.id_campo,
              label: f.label,
              conteudo: typeof conteudo === "string" ? conteudo : "",
              ordem: index + 1,
            };
          })
      );

      const camposParaEnviar = camposProcessados;

      // Criar módulo com campos
      const moduloData = {
        titulo: moduleName.trim(),
        descricao: moduleDescription.trim(),
        ordem: moduleOrder,
        ativo: isActive,
        obrigatorio,
        id_nivel: obrigatorio && idNivel ? Number(idNivel) : undefined,
        pre_requisitos: preRequisitos.length > 0 ? preRequisitos : undefined,
        campos: camposParaEnviar,
      };

      const moduloCriado = await moduloService.create(moduloData);

      // Vincular quiz ao módulo, se selecionado
      if (selectedQuizId) {
        try {
          await moduloService.vincularQuiz(
            moduloCriado.id_modulo,
            selectedQuizId
          );
        } catch (error) {
          console.error("Erro ao vincular quiz:", error);
          // O módulo já existe: segue para a edição dele (ficar aqui e salvar de novo criava outro igual)
          showToast("Módulo criado, mas o quiz não foi vinculado. Escolha o quiz de novo na edição.", 4500);
          setTimeout(() => navigate(`/admin/modulos/editar/${moduloCriado.id_modulo}`), 1500);
          return;
        }
      }

      showToast("Módulo criado com sucesso!");

      // O botão segue em "Salvando…" até sair (antes dava para clicar de novo e criar outro igual)
      setTimeout(() => {
        navigate("/admin/modulos");
      }, 1000);
    } catch (erro) {
      const err = erro as ErroApi;
      console.error("Erro ao criar módulo:", err);

      // Exibir mensagem de erro específica do backend
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.[0] ||
        "Erro ao criar módulo. Verifique os campos.";

      showToast(errorMessage, 4500);
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
        <h1 className="criar-modulo-title">Criar módulo</h1>
      </div>

      <main id="main-content" className="criar-modulo-container" tabIndex={-1}>
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
              maxLength={255}
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
              maxLength={1000}
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
              onChange={(e) => {
                ordemMexida.current = true;
                setModuleOrder(Math.max(1, Number(e.target.value) || 1));
              }}
              min="1"
            />

            <div className="criar-modulo-toggle-row">
              <label className="criar-modulo-label" htmlFor="moduleTipo">Tipo do módulo</label>
              <label className="criar-modulo-toggle" title={obrigatorio ? "Obrigatório: segue sequência e conta para o nível" : "Opcional: livre, não bloqueia, não conta para nível"}>
                <input
                  id="moduleTipo"
                  type="checkbox"
                  checked={obrigatorio}
                  onChange={(e) => setObrigatorio(e.target.checked)}
                  aria-label="Módulo obrigatório"
                />
                <span className="criar-modulo-toggle-slider" />
                <span className="criar-modulo-toggle-text">
                  {obrigatorio ? "Obrigatório" : "Opcional"}
                </span>
              </label>
              <p className="criar-modulo-hint">
                {obrigatorio
                  ? "Obrigatório: segue sequência e aumenta o nível do usuário."
                  : "Opcional: livre, acessível a qualquer momento, não conta para o nível."}
              </p>
            </div>

            {obrigatorio && (
              <div className="criar-modulo-field-row">
                <label className="criar-modulo-label" htmlFor="moduleNivel">
                  Nível vinculado
                </label>
                <select
                  id="moduleNivel"
                  className="criar-modulo-input"
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
                <p className="criar-modulo-hint">
                  Nível que o usuário atinge ao concluir este módulo (cadastrados em Gerenciar Usuários).
                </p>
              </div>
            )}

            <div className="criar-modulo-field-row">
              <span className="criar-modulo-label">Pré-requisitos</span>
              <p className="criar-modulo-hint" style={{ marginBottom: "0.5rem" }}>
                Módulos que devem ser concluídos antes deste (deixe vazio para usar a ordem).
              </p>
              {listaModulos.length === 0 ? (
                <p className="criar-modulo-hint">Nenhum outro módulo cadastrado.</p>
              ) : (
                <div className="criar-modulo-pre-req-list">
                  {listaModulos.map((m) => (
                    <label key={m.id_modulo} className="criar-modulo-pre-req-item" htmlFor={`pre-req-${m.id_modulo}`}>
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

            <h3 className="criar-modulo-section-title">Conteúdos</h3>
            {fields.map((f) => {
              const fieldOption = fieldOptions.find(
                (opt) => opt.value === f.tipo
              );

              if (!fieldOption) return null;

              const FieldComponent = fieldOption.component as React.FC<{
                name: string;
                label: string;
                value: ValorCampo;
                onChange: (val: ValorCampo) => void;
              }>;

              return (
                <div key={f.id} className="criar-modulo-field-card">
                  <button
                    className="criar-modulo-field-remove"
                    onClick={() => removeField(f.id)}
                    title="Remover campo"
                    type="button"
                  >
                    <Icone nome="fechar" tamanho={18} />
                  </button>
                  <FieldComponent
                    name={f.id}
                    label={f.label}
                    value={
                      f.tipo === "QUIZ" ? selectedQuizId : f.conteudo || ""
                    }
                    onChange={(val: ValorCampo) => {
                      if (f.tipo === "QUIZ") {
                        setSelectedQuizId(typeof val === "number" ? val : null);
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
               aria-busy={loading}>
                {loading ? <><span className="btn-spinner" aria-hidden />Salvando…</> : "Salvar"}
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

      <InputModal
        open={labelModalOpen}
        title="Nome do conteúdo"
        label="Como o conteúdo vai aparecer para o aluno"
        placeholder="Ex: Aula 1 – Introdução"
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

export default CriarModulosEscolaDiscipulosAdmin;
