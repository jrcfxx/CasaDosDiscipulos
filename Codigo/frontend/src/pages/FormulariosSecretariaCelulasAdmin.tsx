import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FocusTrapComponent from "../components/ui/FocusTrap";
import "../style/FormulariosSecretariaCelulasAdmin.css";
import "../style/editorCasa.css";
import PaginaSecretaria, {
  DetalheSecretaria,
  DetalheVazio,
  ItemSecretaria,
  ListaSecretaria,
  filtrarItens,
  type FiltroStatus,
} from "../components/secretaria/PaginaSecretaria";

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
import Icone, { type NomeIcone } from "../components/ui/Icone";

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

/** Cada tipo de campo: nome, ícone e o que o líder faz nele */
const INFO_CAMPO: Record<string, { nome: string; icone: NomeIcone; resumo: string; dica: string }> = {
  texto: {
    nome: "Texto curto",
    icone: "arquivo",
    resumo: "Uma linha",
    dica: "O líder escreve uma resposta curta (ex.: nome do anfitrião, tema da reunião).",
  },
  textarea: {
    nome: "Texto longo",
    icone: "livro",
    resumo: "Várias linhas",
    dica: "O líder escreve um relato maior (ex.: pedidos de oração, observações da reunião).",
  },
  numero: {
    nome: "Número",
    icone: "lista",
    resumo: "Somado no relatório",
    dica: "O líder digita um número (ex.: quantos vieram, visitantes, oferta). O Relatório soma esses números.",
  },
  data: {
    nome: "Data",
    icone: "calendario",
    resumo: "Dia da reunião",
    dica: "O líder escolhe uma data. Se for a data da reunião, o Relatório usa ela (e não o dia do envio) para saber de qual semana é o envio.",
  },
  link: {
    nome: "Link",
    icone: "proximo",
    resumo: "Endereço de página",
    dica: "O líder cola um endereço (ex.: link de fotos da reunião).",
  },
  upload: {
    nome: "Arquivo",
    icone: "imagem",
    resumo: "Foto ou PDF",
    dica: "O líder envia uma foto ou arquivo (ex.: foto da célula).",
  },
  video: {
    nome: "Vídeo",
    icone: "projecao",
    resumo: "Link do YouTube",
    dica: "O líder cola o link de um vídeo.",
  },
};

/** O que cada frequência significa para o líder e para o Relatório */
const AJUDA_FREQUENCIA: Record<string, string> = {
  "": "Sem prazo: o líder envia quando quiser e o Relatório não aponta atrasos.",
  semanal: "Uma vez por semana (domingo a sábado). Quem não enviar na semana aparece como \"faltou\" no Relatório.",
  quinzenal: "Uma vez a cada duas semanas. Quem não enviar na quinzena aparece como \"faltou\".",
  mensal: "Uma vez por mês. Quem não enviar no mês aparece como \"faltou\".",
  bimestral: "Uma vez a cada dois meses. Quem não enviar no bimestre aparece como \"faltou\".",
};

/** Um campo no editor: arrastado pela alça para mudar a ordem */
function ItemFormulario({
  item,
  numero,
  onRenomear,
  onObrigatorio,
  onRemover,
  children,
}: {
  item: { uid: number; tipo: string; label: string; obrigatorio?: boolean };
  numero: number;
  onRenomear: (label: string) => void;
  onObrigatorio: (v: boolean) => void;
  onRemover: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const info = INFO_CAMPO[item.tipo];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`ec-item ec-item--pergunta${isDragging ? " ec-item--arrastando" : ""}`}
    >
      <div className="ec-item__topo">
        <button
          type="button"
          className="ec-item__alca"
          aria-label={`Arrastar "${item.label}" para mudar a ordem`}
          title="Arraste para mudar a ordem"
          {...attributes}
          {...listeners}
        >
          <Icone nome="arrastar" tamanho={18} />
        </button>
        <span className="ec-item__numero" aria-hidden>
          {numero}
        </span>
        <span className="ec-selo ec-selo--pergunta">{info?.nome || item.tipo}</span>
        <label className="ec-obrig">
          <input type="checkbox" checked={Boolean(item.obrigatorio)} onChange={(e) => onObrigatorio(e.target.checked)} />
          <span>Obrigatório</span>
        </label>
        <button type="button" className="ec-item__remover" onClick={onRemover} aria-label={`Remover "${item.label}"`} title="Remover">
          <Icone nome="lixeira" tamanho={16} />
        </button>
      </div>
      <label className="ec-rotulo" htmlFor={`ec-nome-${item.uid}`}>
        Pergunta que o líder vê
      </label>
      <input
        id={`ec-nome-${item.uid}`}
        className="ec-input ec-input--enunciado"
        value={item.label}
        maxLength={255}
        onChange={(e) => onRenomear(e.target.value)}
        placeholder="Ex.: Quantas pessoas vieram?"
      />
      {info && <p className="ec-ajuda-tipo">{info.dica}</p>}
      <div className="ec-item__previa">
        <span className="ec-item__previa-rotulo" aria-hidden>
          Prévia do que o líder preenche
        </span>
        <div className="ec-item__corpo field-wrapper">{children}</div>
      </div>
    </li>
  );
}

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
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
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
  /** Houve mudança no editor (pergunta antes de descartar) */
  const [alterado, setAlterado] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  /** Erro mostrado no rodapé do editor (o aviso flutuante ficava longe do botão Salvar) */
  const [erroForm, setErroForm] = useState<string | null>(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  /** Clicou num tipo: a pergunta entra no fim da lista já com o cursor no texto dela */
  const addField = (tipo: string) => {
    const campo = availableFields.find((c) => String(c.tipo_campo).toLowerCase() === tipo.toLowerCase());
    if (!campo) {
      showToast(`Esse tipo (${INFO_CAMPO[tipo]?.nome || tipo}) não está disponível.`, "error");
      return;
    }
    const novo = createLocalField(campo.id_campo, tipo, "", tipo === "numero" ? 0 : "");
    setErroForm(null);
    setAlterado(true);
    setFields((prev) => [...prev, novo]);
    setTimeout(() => {
      const input = document.getElementById(`ec-nome-${novo.uid}`) as HTMLInputElement | null;
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
    }, 80);
  };

  const removeField = (uid: number) => {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
    setAlterado(true);
  };

  const aoSoltarCampo = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const de = prev.findIndex((f) => f.uid === active.id);
      const para = prev.findIndex((f) => f.uid === over.id);
      return arrayMove(prev, de, para);
    });
    setAlterado(true);
  };

  const atualizarCampo = (uid: number, mudanca: Partial<LocalField>) => {
    setFields((prev) => prev.map((f) => (f.uid === uid ? { ...f, ...mudanca } : f)));
    setErroForm(null);
    setAlterado(true);
  };

  /** Fechar o editor: com mudanças não salvas, pergunta antes */
  const pedirFechar = () => {
    if (acaoSalvar.executando) return;
    if (alterado) setConfirmarDescarte(true);
    else closeFormModal();
  };

  const openCreateModal = () => {
    setCurrentForm(initialFormState);
    setFormularioToEdit(null);
    setFields([]);
    setAlterado(false);
    setErroForm(null);
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
      setAlterado(false);
      setErroForm(null);
      setFormularioToEdit(f.id_formulario);
      setShowFormModal(true);
      setTimeout(() => nameRef.current?.focus(), 100);
    } catch (err) {
      console.error("Erro ao carregar formulário:", err);
      showToast("Erro ao carregar formulário para edição", "error");
    }
  };

  const closeFormModal = () => {
    setConfirmarDescarte(false);
    setAlterado(false);
    setErroForm(null);
    setShowFormModal(false);
    setFormularioToEdit(null);
    setCurrentForm(initialFormState);
    setFields([]);
  };

  const saveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const titulo = currentForm.nome.trim();
    if (titulo.length < 3) {
      setErroForm("O título precisa ter pelo menos 3 letras.");
      nameRef.current?.focus();
      return;
    }
    if (fields.length === 0) {
      setErroForm("Adicione pelo menos um campo ao formulário.");
      return;
    }
    const semNome = fields.findIndex((f) => !f.label.trim());
    if (semNome >= 0) {
      setErroForm(`O ${semNome + 1}º campo está sem a pergunta escrita.`);
      return;
    }
    const vistos = new Set<string>();
    for (const f of fields) {
      const chave = f.label.trim().toLocaleLowerCase("pt-BR");
      if (vistos.has(chave)) {
        setErroForm(`Há dois campos chamados "${f.label.trim()}". Use nomes diferentes.`);
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
      setErroForm(error instanceof Error ? error.message : "Erro ao enviar arquivo");
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
        showToast("Formulário criado! Os líderes já podem preencher em Formulários.", "success");
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
      setErroForm(msg);
    }
  };

  const formulariosVisiveis = filtrarItens(formularios, busca, filtro, (f) => f.titulo, isAtivo);
  const abertos = formularios.filter(isAtivo).length;
  const rotuloFrequencia = (f: Formulario) =>
    FREQUENCIA_OPCOES.find((o) => o.value === (f.frequencia ?? ""))?.label ?? "Sem frequência";

  return (
    <>
      <PaginaSecretaria
        area="Secretaria das Células"
        titulo="Formulários"
        icone="lista"
        descricao="Relatórios que os líderes de célula preenchem (ex.: presença da semana). Acompanhe quem enviou em Respostas e veja os números em Relatório."
        acao={{ rotulo: "Novo formulário", onClick: openCreateModal }}
        numeros={[
          { valor: formularios.length, rotulo: formularios.length === 1 ? "formulário" : "formulários" },
          { valor: abertos, rotulo: abertos === 1 ? "aberto" : "abertos" },
          { valor: formularios.length - abertos, rotulo: "fechados" },
        ]}
      >
        <div className="sc-corpo">
          <ListaSecretaria
            titulo="Formulários"
            total={formularios.length}
            busca={busca}
            onBusca={setBusca}
            filtro={filtro}
            onFiltro={setFiltro}
            placeholderBusca="Buscar formulário pelo nome"
            vazio={
              loading
                ? "Carregando…"
                : formularios.length
                  ? "Nenhum formulário com esse filtro."
                  : "Nenhum formulário ainda. Crie o primeiro no botão Novo formulário."
            }
            quantidadeVisivel={formulariosVisiveis.length}
          >
            {formulariosVisiveis.map((formulario) => {
              const n = formulario.campos?.length || 0;
              return (
                <ItemSecretaria
                  key={formulario.id}
                  titulo={formulario.titulo}
                  meta={`${n} ${n === 1 ? "pergunta" : "perguntas"} · ${rotuloFrequencia(formulario)}`}
                  ativo={isAtivo(formulario)}
                  selecionado={selectedFormulario?.id === formulario.id}
                  icone="lista"
                  onSelecionar={() => handleSelectFormulario(formulario)}
                  onAlternar={() => handleToggle(formulario.id)}
                />
              );
            })}
          </ListaSecretaria>

          {selectedFormulario ? (
            <DetalheSecretaria
              titulo={selectedFormulario.titulo}
              ativo={isAtivo(selectedFormulario)}
              status={`${isAtivo(selectedFormulario) ? "Aberto para os líderes" : "Fechado para os líderes"} · ${rotuloFrequencia(selectedFormulario)}`}
              acoes={
                <>
                  <button type="button" className="sc-btn sc-btn--primario" onClick={() => openEditModal(selectedFormulario.id)}>
                    <Icone nome="editar" tamanho={15} /> Editar formulário
                  </button>
                  <button
                    type="button"
                    className="sc-btn sc-btn--perigo"
                    onClick={() => handleDeleteClick(selectedFormulario.id)}
                    aria-label={`Excluir o formulário ${selectedFormulario.titulo}`}
                    title="Excluir formulário"
                  >
                    <Icone nome="lixeira" tamanho={16} />
                  </button>
                </>
              }
            >
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
                {selectedFormulario.descricao && (
                  <p className="sc-descricao">
                    <strong>Instruções para o líder</strong>
                    {selectedFormulario.descricao}
                  </p>
                )}

                <div className="ec-numeros">
                  <div>
                    <strong>{selectedFormulario.campos?.length || 0}</strong>
                    <span>{(selectedFormulario.campos?.length || 0) === 1 ? "pergunta" : "perguntas"}</span>
                  </div>
                  <div>
                    <strong>{(selectedFormulario.campos || []).filter((c) => c.obrigatorio).length}</strong>
                    <span>obrigatórias</span>
                  </div>
                  <div>
                    <strong className="ec-numeros__texto">
                      {FREQUENCIA_OPCOES.find((o) => o.value === (selectedFormulario.frequencia ?? ""))?.label ?? "Sem frequência"}
                    </strong>
                    <span>frequência</span>
                  </div>
                </div>
                <p className="ec-lembrete">
                  <Icone nome="alerta" tamanho={15} />
                  {isAtivo(selectedFormulario)
                    ? AJUDA_FREQUENCIA[selectedFormulario.frequencia ?? ""] ?? AJUDA_FREQUENCIA[""]
                    : "Fechado: os líderes não veem este formulário. Ative em Editar quando quiser receber envios."}
                </p>

                <h3 className="sc-subtitulo">
                  <Icone nome="olho" tamanho={17} /> Como o líder vê
                </h3>
                {selectedFormulario.campos && selectedFormulario.campos.length > 0 ? (
                  <div className="formulario-fields">
                    <ol className="ec-previa">
                      {selectedFormulario.campos.map((campo, index) => {
                        const tipo = String(
                          campo.tipo_campo || availableFields.find((a) => a.id_campo === campo.id_campo)?.tipo_campo || ""
                        );
                        return (
                          <li key={index} className="campo-card campo-card--pergunta">
                            <span className="ec-selo ec-selo--pergunta">
                              {index + 1}. {INFO_CAMPO[tipo]?.nome || "Campo"}
                              {campo.obrigatorio ? " · obrigatório" : ""}
                            </span>
                            <div className="campo-label">{campo.label || "Sem título"}</div>
                            <div className="campo-conteudo">{INFO_CAMPO[tipo]?.dica}</div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : (
                  <p className="sc-vazio-conteudo">Este formulário ainda não tem perguntas. Clique em Editar formulário para montar.</p>
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
            </DetalheSecretaria>
          ) : (
            <DetalheVazio
              icone="lista"
              texto={formularios.length ? "Escolha um formulário na lista para ver as perguntas, as respostas e o relatório." : "Ainda não há formulários. Crie o primeiro para os líderes preencherem."}
              acao={{ rotulo: "Novo formulário", onClick: openCreateModal }}
            />
          )}
        </div>
      </PaginaSecretaria>

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


      {/* EDITOR DE FORMULÁRIO (no fim do <body>, por cima de tudo) */}
      {showFormModal &&
        createPortal(
          <FocusTrapComponent
            active={showFormModal && !confirmarDescarte}
            focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false, returnFocusOnDeactivate: true }}
          >
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
              className="ec-fundo"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ec-form-titulo"
              onKeyDown={(e) => {
                if (e.key === "Escape" && !confirmarDescarte) pedirFechar();
              }}
            >
              <div className="ec-editor">
                <div className="ec-editor__topo">
                  <div>
                    <p className="ec-editor__sobretitulo">Secretaria das Células · Formulário</p>
                    <h2 id="ec-form-titulo">{formularioToEdit ? "Editar formulário" : "Novo formulário"}</h2>
                  </div>
                  <button type="button" className="ec-fechar" onClick={pedirFechar} aria-label="Fechar">
                    <Icone nome="fechar" tamanho={20} />
                  </button>
                </div>

                <form
                  className="ec-editor__form"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    acaoSalvar.executar(() => saveForm());
                  }}
                >
                  <div className="ec-editor__rolagem">
                    <details className="ec-passos" open={!formularioToEdit}>
                      <summary>
                        <Icone nome="livro" tamanho={16} /> Como funciona o formulário
                      </summary>
                      <ol>
                        <li>
                          <strong>Dê um título e a frequência</strong>
                          <span>A frequência diz de quanto em quanto tempo cada célula deve enviar.</span>
                        </li>
                        <li>
                          <strong>Monte as perguntas</strong>
                          <span>Cada campo é uma pergunta que o líder responde. Marque as que não podem ficar em branco.</span>
                        </li>
                        <li>
                          <strong>Organize</strong>
                          <span>
                            Arraste pela alça <Icone nome="arrastar" tamanho={13} /> para mudar a ordem. O líder vê nessa ordem.
                          </span>
                        </li>
                        <li>
                          <strong>Acompanhe</strong>
                          <span>Com o formulário ativo, os líderes preenchem em Formulários. Veja os envios nas abas Respostas e Relatório.</span>
                        </li>
                      </ol>
                    </details>

                    <section className="ec-secao" aria-labelledby="ec-form-secao-info">
                      <h3 id="ec-form-secao-info" className="ec-secao__titulo">
                        <span className="ec-secao__num">1</span> Informações
                      </h3>
                      <div className="ec-campo">
                        <label className="ec-rotulo" htmlFor="formModalTitulo">
                          Título <span className="ec-obrigatorio">obrigatório</span>
                        </label>
                        <input
                          id="formModalTitulo"
                          ref={nameRef}
                          className="ec-input"
                          maxLength={255}
                          value={currentForm.nome}
                          onChange={(e) => {
                            setCurrentForm({ ...currentForm, nome: e.target.value });
                            setAlterado(true);
                            setErroForm(null);
                          }}
                          placeholder="Ex.: Relatório semanal da célula"
                        />
                        <p className="ec-dica">Nome que os líderes veem na lista de formulários (mínimo 3 letras).</p>
                      </div>
                      <div className="ec-campo">
                        <label className="ec-rotulo" htmlFor="formModalDescricao">
                          Instruções para o líder <span className="ec-opcional">opcional</span>
                        </label>
                        <textarea
                          id="formModalDescricao"
                          className="ec-input ec-input--area"
                          value={currentForm.descricao}
                          maxLength={1000}
                          rows={3}
                          onChange={(e) => {
                            setCurrentForm({ ...currentForm, descricao: e.target.value });
                            setAlterado(true);
                          }}
                          placeholder="Ex.: Envie até domingo à noite, depois da reunião."
                        />
                      </div>
                      <div className="ec-campo">
                        <label className="ec-rotulo" htmlFor="formModalFrequencia">
                          Frequência de envio
                        </label>
                        <select
                          id="formModalFrequencia"
                          className="ec-input"
                          value={currentForm.frequencia}
                          onChange={(e) => {
                            setCurrentForm({ ...currentForm, frequencia: e.target.value });
                            setAlterado(true);
                          }}
                          aria-describedby="formModalFrequenciaDica"
                        >
                          {FREQUENCIA_OPCOES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p id="formModalFrequenciaDica" className="ec-dica">
                          {AJUDA_FREQUENCIA[currentForm.frequencia] ?? AJUDA_FREQUENCIA[""]}
                        </p>
                      </div>
                      <label className="ec-chave" htmlFor="formModalAtivo">
                        <input
                          id="formModalAtivo"
                          type="checkbox"
                          role="switch"
                          checked={Boolean(currentForm.ativo)}
                          onChange={(e) => {
                            setCurrentForm({ ...currentForm, ativo: e.target.checked ? 1 : 0 });
                            setAlterado(true);
                          }}
                        />
                        <span className="ec-chave__trilho" aria-hidden />
                        <span className="ec-chave__texto">
                          <strong>{currentForm.ativo ? "Aberto para os líderes" : "Fechado para os líderes"}</strong>
                          <small>
                            {currentForm.ativo
                              ? "Aparece para os líderes de célula preencherem."
                              : "Fica salvo com as respostas antigas, mas ninguém preenche. Use enquanto ainda está montando."}
                          </small>
                        </span>
                      </label>
                    </section>

                    <section className="ec-secao" aria-labelledby="ec-form-secao-campos">
                      <div className="ec-secao__cabecalho">
                        <h3 id="ec-form-secao-campos" className="ec-secao__titulo">
                          <span className="ec-secao__num">2</span> Perguntas do formulário
                        </h3>
                        <span className="ec-resumo">
                          {fields.length} {fields.length === 1 ? "pergunta" : "perguntas"} ·{" "}
                          <strong>
                            {fields.filter((f) => f.obrigatorio).length}{" "}
                            {fields.filter((f) => f.obrigatorio).length === 1 ? "obrigatória" : "obrigatórias"}
                          </strong>
                        </span>
                      </div>
                      <p className="ec-dica">
                        O líder responde nesta ordem. Arraste pela alça <Icone nome="arrastar" tamanho={13} /> para reorganizar.
                        Mudar o texto de uma pergunta mantém as respostas que já foram enviadas.
                      </p>

                      {fields.length === 0 ? (
                        <div className="ec-vazio">
                          <Icone nome="lista" tamanho={30} />
                          <p>Nenhuma pergunta ainda. Escolha um tipo abaixo para começar.</p>
                        </div>
                      ) : (
                        <DndContext
                          sensors={sensores}
                          collisionDetection={closestCenter}
                          onDragEnd={aoSoltarCampo}
                          accessibility={{
                            screenReaderInstructions: {
                              draggable:
                                "Para mudar a ordem, aperte espaço ou Enter, use as setas e aperte espaço ou Enter de novo para soltar. Esc cancela.",
                            },
                            announcements: {
                              onDragStart: () => "Pergunta pega.",
                              onDragOver: ({ over }) =>
                                over ? `Sobre a posição ${fields.findIndex((f) => f.uid === over.id) + 1}.` : undefined,
                              onDragEnd: ({ over }) =>
                                over ? `Solta na posição ${fields.findIndex((f) => f.uid === over.id) + 1}.` : undefined,
                              onDragCancel: () => "Cancelado. A pergunta voltou ao lugar.",
                            },
                          }}
                        >
                          <SortableContext items={fields.map((f) => f.uid)} strategy={verticalListSortingStrategy}>
                            <ol className="ec-lista">
                              {fields.map((f, idx) => {
                                const Component = fieldOptions.find((o) => o.tipo === f.tipo)?.component;
                                if (!Component) return null;
                                return (
                                  <ItemFormulario
                                    key={f.uid}
                                    item={f}
                                    numero={idx + 1}
                                    onRenomear={(label) => atualizarCampo(f.uid, { label })}
                                    onObrigatorio={(obrigatorio) => atualizarCampo(f.uid, { obrigatorio })}
                                    onRemover={() => removeField(f.uid)}
                                  >
                                    {/* Só mostra como fica: o líder começa sempre com o campo vazio */}
                                    <>
                                      <label className="sr-only" htmlFor={`previa-${f.uid}`}>
                                        Prévia: {f.label || "pergunta sem texto"}
                                      </label>
                                      <Component id={`previa-${f.uid}`} name={`previa_${f.uid}`} label="" value="" onChange={() => {}} disabled />
                                    </>
                                  </ItemFormulario>
                                );
                              })}
                            </ol>
                          </SortableContext>
                        </DndContext>
                      )}

                      <div className="ec-adicionar">
                        <p className="ec-adicionar__titulo">
                          Adicionar pergunta <span>escolha o tipo de resposta</span>
                        </p>
                        <div className="ec-adicionar__grade">
                          {fieldOptions.map((opt) => (
                            <button
                              key={opt.tipo}
                              type="button"
                              className="ec-tipo ec-tipo--pergunta"
                              title={INFO_CAMPO[opt.tipo]?.dica}
                              onClick={() => addField(opt.tipo)}
                            >
                              <Icone nome={INFO_CAMPO[opt.tipo]?.icone || "lista"} tamanho={18} />
                              <span>
                                <strong>{INFO_CAMPO[opt.tipo]?.nome || opt.label}</strong>
                                <small>{INFO_CAMPO[opt.tipo]?.resumo}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="ec-editor__rodape">
                    {erroForm ? (
                      <p className="ec-erro" role="alert">
                        <Icone nome="alerta" tamanho={16} /> {erroForm}
                      </p>
                    ) : (
                      <p className="ec-rodape-info">
                        {fields.length > 0
                          ? `${fields.length} ${fields.length === 1 ? "pergunta" : "perguntas"} · ${
                              FREQUENCIA_OPCOES.find((o) => o.value === currentForm.frequencia)?.label ?? "Sem frequência"
                            }`
                          : "Adicione pelo menos uma pergunta para salvar."}
                      </p>
                    )}
                    <div className="ec-editor__botoes">
                      <button type="button" className="ec-btn ec-btn--fantasma" onClick={pedirFechar} disabled={acaoSalvar.executando}>
                        Cancelar
                      </button>
                      <BotaoCarregando
                        type="submit"
                        className="ec-btn ec-btn--primario"
                        carregando={acaoSalvar.executando}
                        textoCarregando={formularioToEdit ? "Salvando…" : "Criando…"}
                      >
                        {formularioToEdit ? "Salvar alterações" : "Criar formulário"}
                      </BotaoCarregando>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </FocusTrapComponent>,
          document.body
        )}

      <ConfirmModal
        open={confirmarDescarte}
        title="Descartar alterações?"
        message="Você mudou este formulário e ainda não salvou. Se sair agora, as mudanças se perdem."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        variant="danger"
        onConfirm={closeFormModal}
        onCancel={() => setConfirmarDescarte(false)}
      />
    </>
  );
}
