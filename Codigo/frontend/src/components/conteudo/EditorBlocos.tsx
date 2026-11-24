import React from "react";
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
import "../../style/editorCasa.css";

import Icone, { type NomeIcone } from "../ui/Icone";
import TextField from "../fields/TextField";
import TextareaField from "../fields/TextareaField";
import NumberField from "../fields/NumberField";
import DateField from "../fields/DateField";
import LinkField from "../fields/LinkField";
import UploadField from "../fields/UploadField";
import VideoField from "../fields/VideoField";
import type { CampoDinamico, ValorCampo } from "../../types/campoConteudo";
import { generateUid } from "../../utils/generateUid";

/**
 * Lista de conteúdos (vídeo, texto, arquivo…) de um módulo ou de uma lição: cada bloco com título,
 * explicação do tipo e o conteúdo em si; reorganizada arrastando. Módulos e lições usam a mesma.
 */

/** Tipos de conteúdo: nome, ícone, resumo e o que quem estuda vê */
export const TIPOS_CONTEUDO: {
  tipo: string;
  nome: string;
  icone: NomeIcone;
  resumo: string;
  dica: string;
  componente: CampoDinamico;
}[] = [
  {
    tipo: "video",
    nome: "Vídeo",
    icone: "projecao",
    resumo: "YouTube ou Vimeo",
    dica: "Cole o link do vídeo (começando com https://). Ele aparece para assistir ali mesmo.",
    componente: VideoField as CampoDinamico,
  },
  {
    tipo: "textarea",
    nome: "Texto longo",
    icone: "livro",
    resumo: "Ensino ou leitura",
    dica: "Escreva o ensino, a leitura ou a explicação. Quebras de linha são mantidas.",
    componente: TextareaField as CampoDinamico,
  },
  {
    tipo: "texto",
    nome: "Texto curto",
    icone: "arquivo",
    resumo: "Versículo ou frase",
    dica: "Uma frase curta: versículo-chave, tarefa da semana, lembrete.",
    componente: TextField as CampoDinamico,
  },
  {
    tipo: "upload",
    nome: "Arquivo",
    icone: "imagem",
    resumo: "PDF ou imagem",
    dica: "Envie um PDF ou imagem para ver ou baixar (apostila, esboço, slide).",
    componente: UploadField as CampoDinamico,
  },
  {
    tipo: "link",
    nome: "Link",
    icone: "proximo",
    resumo: "Página para consultar",
    dica: "Cole o endereço completo de uma página (começando com https://).",
    componente: LinkField as CampoDinamico,
  },
  {
    tipo: "data",
    nome: "Data",
    icone: "calendario",
    resumo: "Encontro ou prazo",
    dica: "Uma data de referência (ex.: dia do encontro presencial).",
    componente: DateField as CampoDinamico,
  },
  {
    tipo: "numero",
    nome: "Número",
    icone: "lista",
    resumo: "Valor de referência",
    dica: "Um número de referência (ex.: capítulos para ler).",
    componente: NumberField as CampoDinamico,
  },
];
const INFO = Object.fromEntries(TIPOS_CONTEUDO.map((t) => [t.tipo, t]));

export type BlocoConteudo = { uid: number; tipo: string; label: string; conteudo: ValorCampo; id_campo: number };

/** Campos vindos da API viram blocos do editor */
export function blocosDosCampos(
  campos: { id_campo: number; tipo_campo?: string | null; label?: string | null; conteudo?: unknown }[],
  tipoPorId?: (idCampo: number) => string | undefined
): BlocoConteudo[] {
  return campos.map((c) => ({
    uid: generateUid(),
    tipo: String(c.tipo_campo || tipoPorId?.(c.id_campo) || "texto"),
    label: c.label || "",
    conteudo: (c.conteudo ?? "") as ValorCampo,
    id_campo: c.id_campo,
  }));
}

function Bloco({
  bloco,
  numero,
  quem,
  onMudar,
  onRemover,
}: {
  bloco: BlocoConteudo;
  numero: number;
  quem: string;
  onMudar: (m: Partial<BlocoConteudo>) => void;
  onRemover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bloco.uid });
  const info = INFO[bloco.tipo];
  const Componente = info?.componente;
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
          aria-label={`Arrastar "${bloco.label || info?.nome || "conteúdo"}" para mudar a ordem`}
          title="Arraste para mudar a ordem"
          {...attributes}
          {...listeners}
        >
          <Icone nome="arrastar" tamanho={18} />
        </button>
        <span className="ec-item__numero" aria-hidden>
          {numero}
        </span>
        <span className="ec-selo ec-selo--pergunta">
          {info && <Icone nome={info.icone} tamanho={12} />} {info?.nome || bloco.tipo}
        </span>
        <button
          type="button"
          className="ec-item__remover"
          onClick={onRemover}
          aria-label={`Remover "${bloco.label || info?.nome || "conteúdo"}"`}
          title="Remover"
        >
          <Icone nome="lixeira" tamanho={16} />
        </button>
      </div>
      <label className="ec-rotulo" htmlFor={`ec-bloco-${bloco.uid}`}>
        Título que {quem} vê
      </label>
      <input
        id={`ec-bloco-${bloco.uid}`}
        className="ec-input ec-input--enunciado"
        value={bloco.label}
        maxLength={255}
        onChange={(e) => onMudar({ label: e.target.value })}
        placeholder="Ex.: Aula 1 – O chamado"
      />
      {Componente && (
        <div className="ec-campo">
          <span className="ec-rotulo">Conteúdo</span>
          {info && <p className="ec-ajuda-tipo">{info.dica}</p>}
          <div className="ec-item__corpo field-wrapper">
            <Componente
              id={`bloco-${bloco.uid}`}
              name={`bloco_${bloco.uid}`}
              label=""
              value={bloco.conteudo}
              onChange={(v: ValorCampo) => onMudar({ conteudo: v })}
            />
          </div>
        </div>
      )}
    </li>
  );
}

export default function EditorBlocos({
  blocos,
  onChange,
  tiposDisponiveis,
  quem = "o aluno",
  onIndisponivel,
}: {
  blocos: BlocoConteudo[];
  onChange: (blocos: BlocoConteudo[]) => void;
  /** Tipos que o servidor permite (id_campo de cada um) */
  tiposDisponiveis: { id_campo: number; tipo_campo: string }[];
  /** "o aluno", "o líder"… para os textos de ajuda */
  quem?: string;
  onIndisponivel?: () => void;
}) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /** Clicou num tipo: o conteúdo entra no fim da lista já com o cursor no título dele */
  const adicionar = (tipo: string) => {
    const campo = tiposDisponiveis.find((c) => String(c.tipo_campo) === tipo);
    if (!campo) {
      onIndisponivel?.();
      return;
    }
    const novo: BlocoConteudo = { uid: generateUid(), tipo, label: "", conteudo: tipo === "numero" ? 0 : "", id_campo: campo.id_campo };
    onChange([...blocos, novo]);
    setTimeout(() => {
      const input = document.getElementById(`ec-bloco-${novo.uid}`) as HTMLInputElement | null;
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
    }, 80);
  };

  const aoSoltar = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onChange(arrayMove(blocos, blocos.findIndex((b) => b.uid === active.id), blocos.findIndex((b) => b.uid === over.id)));
  };

  const posicao = (id: unknown) => blocos.findIndex((b) => b.uid === id) + 1;
  const disponiveis = TIPOS_CONTEUDO.filter(
    (t) => tiposDisponiveis.length === 0 || tiposDisponiveis.some((c) => String(c.tipo_campo) === t.tipo)
  );

  return (
    <>
      {blocos.length === 0 ? (
        <div className="ec-vazio">
          <Icone nome="projecao" tamanho={30} />
          <p>Nenhum conteúdo ainda. Comece por um vídeo ou um texto logo abaixo.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensores}
          collisionDetection={closestCenter}
          onDragEnd={aoSoltar}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "Para mudar a ordem, aperte espaço ou Enter, use as setas e aperte espaço ou Enter de novo para soltar. Esc cancela.",
            },
            announcements: {
              onDragStart: () => "Conteúdo pego.",
              onDragOver: ({ over }) => (over ? `Sobre a posição ${posicao(over.id)}.` : undefined),
              onDragEnd: ({ over }) => (over ? `Solto na posição ${posicao(over.id)}.` : undefined),
              onDragCancel: () => "Cancelado. O conteúdo voltou ao lugar.",
            },
          }}
        >
          <SortableContext items={blocos.map((b) => b.uid)} strategy={verticalListSortingStrategy}>
            <ol className="ec-lista">
              {blocos.map((b, i) => (
                <Bloco
                  key={b.uid}
                  bloco={b}
                  numero={i + 1}
                  quem={quem}
                  onMudar={(m) => onChange(blocos.map((x) => (x.uid === b.uid ? { ...x, ...m } : x)))}
                  onRemover={() => onChange(blocos.filter((x) => x.uid !== b.uid))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className="ec-adicionar">
        <p className="ec-adicionar__titulo">
          Adicionar conteúdo <span>clique no tipo</span>
        </p>
        <div className="ec-adicionar__grade">
          {disponiveis.map((t) => (
            <button key={t.tipo} type="button" className="ec-tipo ec-tipo--pergunta" title={t.dica} onClick={() => adicionar(t.tipo)}>
              <Icone nome={t.icone} tamanho={18} />
              <span>
                <strong>{t.nome}</strong>
                <small>{t.resumo}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
