import React, { useEffect, useRef, useState } from "react";
import "../style/FormulariosSecretariaCelulasAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import InputModal from "../components/ui/InputModal";
import Toast from "../components/ui/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";

import formularioService, {
  FormularioCampo,
  FormularioCreateUpdate,
  FREQUENCIA_OPCOES,
} from "../services/formularioService";
import formularioRespostaService from "../services/formularioRespostaService";
import celulaService from "../services/celulaService";
import campoService from "../services/campoService";
import { uploadCampo, isImagePath } from "../services/uploadService";
import { ASSETS_BASE } from "../config/api";
import { generateUid } from "../utils/generateUid";

import TextField from "../components/fields/TextField";
import TextareaField from "../components/fields/TextareaField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";
import type { CampoDinamico, ValorCampo } from "../types/campoConteudo";
import { renderVideoPreview } from "../components/conteudo/renderVideoPreview";
import { filtrarRespostas, respondentesUnicos } from "../components/formularios/statusCelulas";
import RelatorioFormulario from "../components/formularios/RelatorioFormulario";
import { formatarDiaMes, rotuloCurto, singularSeUm } from "../components/formularios/periodoRelatorio";
import BotoesExportar from "../components/ui/BotoesExportar";
import { exportarRespostasFormulario } from "../utils/exportacoes";
import type { ResumoCampoResposta } from "../services/formularioRespostaService";
import { useAcao } from "../hooks/useAcao";
import BotaoCarregando from "../components/ui/BotaoCarregando";
import Icone from "../components/ui/Icone";

/* TYPES */
type Formulario = {
  id: number;
  titulo: string;
  descricao?: string | null;
  ativo?: number;
  frequencia?: string | null;
  campos?: FormularioCampo[];
};

type FormularioForm = {
  id: number | null;
  nome: string;
  descricao: string;
  ativo: number;
  frequencia: string;
};

type AvailableField = {
  id_campo: number;
  tipo_campo: string;
};

type LocalField = {
  uid: number;
  /** id do campo já salvo (edição): mantém as respostas antigas ligadas a ele */
  id?: number;
  id_campo: number;
  tipo: string;
  label: string;
  conteudo: ValorCampo;
  obrigatorio?: boolean;
};

type Resposta = {
  /** Data da reunião (campo de data do formulário) ou, sem ele, a do envio */
  data_referencia?: string;
  resumo?: ResumoCampoResposta[];
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
  frequencia: "",
};

/** A lista mostra "Reunião 11 nov" quando o formulário tem a data da reunião; senão a data é a do envio */
function rotuloDataReferencia(r: { resumo?: ResumoCampoResposta[] }) {
  const campo = (r.resumo || []).find((c) => c.tipo === "data" && c.valor);
  return campo ? campo.label.replace(/^data d[aoe]s? /i, "").replace(/^./, (x) => x.toUpperCase()) : "Envio";
}

export default function FormulariosSecretariaCelulasAdmin() {
  const acaoSalvar = useAcao();
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

  /* Filtros da visualização de respostas */
  const [filtroCelula, setFiltroCelula] = useState<number | "">("");
  const [filtroRespondente, setFiltroRespondente] = useState<string>("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("");
  const [filtroDataFim, setFiltroDataFim] = useState<string>("");

  const [celulas, setCelulas] = useState<
    Array<{ id_celula: number; nome: string }>
  >([]);
  const [abaAtiva, setAbaAtiva] = useState<
    "formulario" | "respostas" | "dashboard"
  >("formulario");

  const fieldOptions = [
    { label: "Texto (linha única)", tipo: "texto", component: TextField as CampoDinamico },
    { label: "Área de texto (multilinhas)", tipo: "textarea", component: TextareaField as CampoDinamico },
    { label: "Número", tipo: "numero", component: NumberField as CampoDinamico },
    { label: "Data", tipo: "data", component: DateField as CampoDinamico },
    { label: "Link", tipo: "link", component: LinkField as CampoDinamico },
    { label: "Upload", tipo: "upload", component: UploadField as CampoDinamico },
    { label: "Vídeo", tipo: "video", component: VideoField as CampoDinamico },
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
    setFiltroCelula("");
    setFiltroRespondente("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
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
        frequencia: f.frequencia ?? null,
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

      // Só o status: reenviar título/campos aqui apagava a frequência e recriava os campos
      await formularioService.update(id, { ativo: !isAtivo(formulario) });

      await fetchFormularios();
      if (selectedFormulario && selectedFormulario.id === id) {
        const updated = await formularioService.getById(id);
        setSelectedFormulario({
          id: updated.id_formulario,
          titulo: updated.titulo,
          descricao: updated.descricao ?? "",
          ativo: updated.ativo === true || updated.ativo === 1 ? 1 : 0,
          frequencia: updated.frequencia ?? null,
          campos: updated.campos ?? [],
        });
      }
    } catch (error) {
      console.error("Erro ao alternar formulário:", error);
      showToast("Erro ao alternar status do formulário", "error");
    }
  };

  const [respostasDoExcluido, setRespostasDoExcluido] = useState(0);
  const handleDeleteClick = async (id: number) => {
    let total = 0;
    try {
      total = await formularioService.totalRespostas(id);
    } catch {
      total = 0;
    }
    setRespostasDoExcluido(total);
    setFormularioToDelete(id);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!formularioToDelete) return;
    const id = formularioToDelete;
    try {
      await formularioService.delete(id);
      if (selectedFormulario?.id === id) setSelectedFormulario(null);
      await fetchFormularios();
      showToast("Formulário excluído com sucesso", "success");
    } catch (err) {
      console.error("Erro ao excluir formulário:", err);
      showToast("Erro ao excluir formulário", "error");
    } finally {
      // fecha só depois de terminar: o modal mostra o andamento
      setShowConfirmDelete(false);
      setFormularioToDelete(null);
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

  /* Respostas filtradas por célula, respondente e intervalo de data (regras em statusCelulas.ts) */
  const filteredRespostas = filtrarRespostas(respostas, {
    celula: filtroCelula,
    respondente: filtroRespondente,
    dataInicio: filtroDataInicio,
    dataFim: filtroDataFim,
  });

  const respondentesUnicosLista = respondentesUnicos(respostas);

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
              <Icone nome="arquivo" tamanho={16} /> {fileName}
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

  const createLocalField = (
    id_campo: number,
    tipo: string,
    label = "",
    conteudo: ValorCampo = "",
    obrigatorio = false,
    id?: number
  ): LocalField => {
    return {
      uid: generateUid(),
      id,
      id_campo,
      tipo,
      label,
      conteudo,
      obrigatorio,
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
    if (fields.some((f) => f.label.trim().toLocaleLowerCase("pt-BR") === label.trim().toLocaleLowerCase("pt-BR"))) {
      showToast(`Já existe um campo chamado "${label.trim()}". Use outro nome.`, "error");
      return;
    }
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

    let conteudoInicial: ValorCampo = "";
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

  /** Sobe (-1) ou desce (+1) o campo na ordem do formulário */
  const moverCampo = (uid: number, direcao: -1 | 1) => {
    setFields((prev) => {
      const i = prev.findIndex((f) => f.uid === uid);
      const j = i + direcao;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const novo = [...prev];
      [novo[i], novo[j]] = [novo[j], novo[i]];
      return novo;
    });
  };

  const renomearCampo = (uid: number, label: string) => {
    setFields((prev) => prev.map((f) => (f.uid === uid ? { ...f, label } : f)));
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
        frequencia: f.frequencia ?? "",
      });

      const incomingFields = (f.campos ?? []).map((c: FormularioCampo, idx: number) => {
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
          if (!dateRegex.test(String(conteudoLimpo))) {
            conteudoLimpo = "";
          }
        }

        return createLocalField(
          c.id_campo,
          tipo,
          c.label ?? `Campo ${idx + 1}`,
          conteudoLimpo,
          Boolean(c.obrigatorio),
          c.id
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

    const titulo = currentForm.nome.trim();
    if (titulo.length < 3) {
      showToast("O título precisa ter pelo menos 3 letras.", "error");
      nameRef.current?.focus();
      return;
    }
    if (fields.length === 0) {
      showToast("Adicione pelo menos um campo ao formulário.", "error");
      return;
    }
    const semNome = fields.findIndex((f) => !f.label.trim());
    if (semNome >= 0) {
      showToast(`O ${semNome + 1}º campo está sem nome.`, "error");
      return;
    }
    const vistos = new Set<string>();
    for (const f of fields) {
      const chave = f.label.trim().toLocaleLowerCase("pt-BR");
      if (vistos.has(chave)) {
        showToast(`Há dois campos chamados "${f.label.trim()}". Use nomes diferentes.`, "error");
        return;
      }
      vistos.add(chave);
    }

    // Processar uploads antes de montar o payload
    let processedFields: LocalField[];
    try {
      processedFields = await Promise.all(
        fields.map(async (f) => {
          let conteudo = f.conteudo ?? "";
          if (conteudo instanceof File) {
            try {
              conteudo = await uploadCampo(conteudo);
            } catch (error) {
              console.error(error);
              throw new Error(`Não foi possível enviar o arquivo de "${f.label}".`);
            }
          }
          return { ...f, conteudo };
        })
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao enviar arquivo", "error");
      return;
    }

    const camposPayload = processedFields.map((f, index) => {
      let conteudo: string | number | boolean | null = "";
      const v = f.conteudo;
      if (v === null || v === undefined) conteudo = "";
      else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") conteudo = v;
      else if (typeof v === "object") conteudo = JSON.stringify(v);
      else conteudo = String(v);
      return {
        ...(f.id ? { id: f.id } : {}),
        id_campo: f.id_campo,
        label: f.label.trim(),
        conteudo,
        ordem: index,
        obrigatorio: Boolean(f.obrigatorio),
      };
    });

    const freqVal = currentForm.frequencia;
    const payload: FormularioCreateUpdate = {
      titulo,
      descricao: currentForm.descricao.trim() || null,
      ativo: Boolean(currentForm.ativo),
      // Vazio = "sem frequência" (null); undefined deixaria a frequência antiga na edição
      frequencia: ["semanal", "quinzenal", "mensal", "bimestral"].includes(freqVal)
        ? (freqVal as FormularioCreateUpdate["frequencia"])
        : null,
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
            frequencia: updated.frequencia ?? null,
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
      <main id="main-content" className="page" tabIndex={-1}>
        <h1 className="page-title">Secretaria das Células</h1>

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
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectFormulario(formulario)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.target as HTMLElement).click(); } }}
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
                    Relatório
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
                  <div className="meta-item">
                    <span className="meta-label">Frequência:</span>
                    <span className="meta-value">
                      {FREQUENCIA_OPCOES.find((o) => o.value === (selectedFormulario.frequencia ?? ""))?.label ?? "Sem frequência"}
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
                      <>
                        <div className="respostas-filtros">
                          <div className="filtro-group">
                            <label htmlFor="filtro-celula">Célula</label>
                            <select
                              id="filtro-celula"
                              value={filtroCelula}
                              onChange={(e) =>
                                setFiltroCelula(
                                  e.target.value === "" ? "" : Number(e.target.value)
                                )
                              }
                            >
                              <option value="">Todas</option>
                              {celulas.map((c) => (
                                <option key={c.id_celula} value={c.id_celula}>
                                  {c.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="filtro-group">
                            <label htmlFor="filtro-respondente">Respondente</label>
                            <select
                              id="filtro-respondente"
                              value={filtroRespondente}
                              onChange={(e) => setFiltroRespondente(e.target.value)}
                            >
                              <option value="">Todos</option>
                              <option value="-">Sem respondente</option>
                              {respondentesUnicosLista
                                .filter((n) => n !== "-")
                                .map((nome) => (
                                  <option key={nome} value={nome}>
                                    {nome}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="filtro-group">
                            <label htmlFor="filtro-data-inicio">Data início</label>
                            <input
                              id="filtro-data-inicio"
                              type="date"
                              value={filtroDataInicio}
                              onChange={(e) => setFiltroDataInicio(e.target.value)}
                            />
                          </div>
                          <div className="filtro-group">
                            <label htmlFor="filtro-data-fim">Data fim</label>
                            <input
                              id="filtro-data-fim"
                              type="date"
                              value={filtroDataFim}
                              onChange={(e) => setFiltroDataFim(e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn-limpar-filtros"
                            onClick={() => {
                              setFiltroCelula("");
                              setFiltroRespondente("");
                              setFiltroDataInicio("");
                              setFiltroDataFim("");
                            }}
                          >
                            Limpar filtros
                          </button>
                        </div>
                        <div className="respostas-topo">
                          <p className="respostas-count">
                            {filteredRespostas.length} resposta{filteredRespostas.length !== 1 ? "s" : ""}
                            {(filtroCelula !== "" || filtroRespondente || filtroDataInicio || filtroDataFim) &&
                              ` de ${respostas.length}`}
                          </p>
                          <BotoesExportar
                            tema="claro"
                            onExcel={async () => {
                              const dados = await formularioRespostaService.exportacao(selectedFormulario.id);
                              const filtrando =
                                filtroCelula !== "" || !!filtroRespondente || !!filtroDataInicio || !!filtroDataFim;
                              await exportarRespostasFormulario(
                                selectedFormulario.titulo,
                                dados,
                                filtrando ? new Set(filteredRespostas.map((r) => r.id_resposta)) : null,
                                buildUploadUrl
                              );
                            }}
                          />
                        </div>
                        <div className="respostas-list">
                        {filteredRespostas.map((r) => (
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
                              <span className="resposta-quem">
                                <span className="resposta-celula">
                                  {r.nome_celula || `Célula #${r.id_celula}`}
                                </span>
                                <span className="resposta-lider">{r.nome_lider || "Sem respondente"}</span>
                              </span>
                              <span className="resposta-resumo">
                                {r.data_referencia && (
                                  <span className="resposta-reuniao">
                                    {rotuloDataReferencia(r)} {formatarDiaMes(r.data_referencia)}
                                  </span>
                                )}
                                {(r.resumo || [])
                                  .filter((c) => c.tipo === "numero" && c.valor !== null && String(c.valor).trim() !== "")
                                  .map((c) => (
                                    <span key={c.id} className="resposta-numero">
                                      <strong>{c.valor}</strong> {singularSeUm(rotuloCurto(c.label), c.valor)}
                                    </span>
                                  ))}
                              </span>
                              <span className="resposta-data">
                                Enviado em {formatarData(r.data_resposta)}
                              </span>
                              <span className="resposta-toggle">
                                {expandedRespostaId === r.id_resposta
                                  ? <Icone nome="abrir" tamanho={16} />
                                  : <Icone nome="proximo" tamanho={16} />}
                              </span>
                            </div>
                            {expandedRespostaId === r.id_resposta &&
                              respostaDetalhe?.id_resposta === r.id_resposta && (
                                <div className="resposta-detalhe">
                                  {respostaDetalhe.campos &&
                                  respostaDetalhe.campos.length > 0 ? (
                                    <div className="campos-grid">
                                      {respostaDetalhe.campos.map(
                                        (c, idx: number) => (
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
                      </>
                    )}
                  </div>
                )}

                {abaAtiva === "dashboard" && (
                  <RelatorioFormulario
                    idFormulario={selectedFormulario.id}
                    frequencia={selectedFormulario.frequencia}
                    titulo={selectedFormulario.titulo}
                  />
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
        message={
          respostasDoExcluido > 0
            ? `Este formulário tem ${respostasDoExcluido} ${respostasDoExcluido === 1 ? "resposta" : "respostas"}, que serão apagadas junto e não voltam mais. Para só parar de receber respostas, desative o formulário em vez de excluir.`
            : "Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita."
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        textoCarregando="Excluindo…"
        onCancel={() => { setShowConfirmDelete(false); setFormularioToDelete(null); }}
      />

      <InputModal
        open={labelModalOpen}
        title="Nome do campo"
        label="Como o campo vai aparecer para quem preenche"
        placeholder="Ex: Quantas pessoas vieram?"
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                acaoSalvar.executar(() => saveForm());
              }}
            >
              <label htmlFor="formModalTitulo">Título</label>
              <input
                id="formModalTitulo"
                ref={nameRef}
                maxLength={255}
                value={currentForm.nome}
                onChange={(e) =>
                  setCurrentForm({ ...currentForm, nome: e.target.value })
                }
                required
              />

              <label htmlFor="formModalDescricao">Descrição</label>
              <textarea
                id="formModalDescricao"
                value={currentForm.descricao}
                onChange={(e) =>
                  setCurrentForm({ ...currentForm, descricao: e.target.value })
                }
                maxLength={1000}
                rows={4}
              />

              <label htmlFor="formModalAtivo">Ativo</label>
              <select
                id="formModalAtivo"
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

              <label htmlFor="formModalFrequencia">Frequência de envio esperada</label>
              <select
                id="formModalFrequencia"
                value={currentForm.frequencia}
                onChange={(e) =>
                  setCurrentForm({
                    ...currentForm,
                    frequencia: e.target.value,
                  })
                }
              >
                {FREQUENCIA_OPCOES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <h3>Campos do Formulário</h3>

              <div className="fields-container">
                {fields.length === 0 && (
                  <p className="muted">Nenhum campo adicionado.</p>
                )}

                {fields.map((f, idx) => {
                  const opcao = fieldOptions.find((o) => o.tipo === f.tipo);
                  const Component = opcao?.component;
                  if (!Component) return null;
                  return (
                    <div key={f.uid} className="field-wrapper">
                      <div className="field-cabecalho">
                        <span className="field-tipo">{opcao.label}</span>
                        <input
                          className="field-nome"
                          value={f.label}
                          onChange={(e) => renomearCampo(f.uid, e.target.value)}
                          aria-label={`Nome do ${idx + 1}º campo`}
                          placeholder="Nome do campo"
                          maxLength={255}
                        />
                        <div className="field-ordem">
                          <button
                            type="button"
                            onClick={() => moverCampo(f.uid, -1)}
                            disabled={idx === 0}
                            aria-label={`Subir "${f.label}"`}
                            title="Subir"
                          >
                            <Icone nome="anterior" tamanho={14} className="field-ordem__seta" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverCampo(f.uid, 1)}
                            disabled={idx === fields.length - 1}
                            aria-label={`Descer "${f.label}"`}
                            title="Descer"
                          >
                            <Icone nome="proximo" tamanho={14} className="field-ordem__seta" />
                          </button>
                        </div>
                      </div>
                      <div className="dynamic-field-row">
                        <div className="field-input-container">
                          <Component
                            id={String(f.uid)}
                            name={`campo_${f.uid}`}
                            label={f.label}
                            value={f.conteudo}
                            onChange={(v: ValorCampo) =>
                              setFields((prev) =>
                                prev.map((fld) => (fld.uid === f.uid ? { ...fld, conteudo: v } : fld))
                              )
                            }
                          />
                          <label className="field-obrigatorio-checkbox">
                            <input
                              type="checkbox"
                              checked={Boolean(f.obrigatorio)}
                              onChange={(e) =>
                                setFields((prev) =>
                                  prev.map((fld) =>
                                    fld.uid === f.uid ? { ...fld, obrigatorio: e.target.checked } : fld
                                  )
                                )
                              }
                              aria-label="Campo obrigatório"
                            />
                            <span>Obrigatório</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          className="field-remove-btn"
                          onClick={() => removeField(f.uid)}
                          title="Remover campo"
                        >
                          <Icone nome="fechar" tamanho={16} />
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
                <BotaoCarregando type="submit" className="save-btn" carregando={acaoSalvar.executando}>
                  Salvar
                </BotaoCarregando>

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
