import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Icone from "../ui/Icone";
import type { Nivel } from "./tipos";

/** Nível da caminhada (lista arrastável): posição, nome, descrição, pessoas e ações */
export default function SortableNivelRow({
  nivel,
  pessoas,
  onEditar,
  onInativar,
  onReativar,
  onExcluir,
}: {
  nivel: Nivel;
  /** Quantas pessoas estão neste nível */
  pessoas: number;
  onEditar: (n: Nivel) => void;
  onInativar: (id: number) => void;
  onReativar: (id: number) => void;
  onExcluir: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: nivel.id_nivel });
  const inativo = !nivel.ativo;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`gr-nivel${inativo ? " gr-nivel--inativo" : ""}${isDragging ? " gr-nivel--arrastando" : ""}`}
    >
      <button
        type="button"
        className="gr-nivel__alca"
        aria-label={`Mover ${nivel.nome}. Use espaço e as setas para mudar a posição.`}
        {...attributes}
        {...listeners}
      >
        <Icone nome="arrastar" tamanho={18} />
      </button>
      <span className="gr-nivel__ordem" aria-hidden>{nivel.ordem}</span>
      <div className="gr-nivel__texto">
        <span className="gr-nivel__nome">
          {nivel.nome}
          {inativo && <span className="gr-selo gr-selo--cinza">Inativo</span>}
        </span>
        {nivel.descricao && <span className="gr-nivel__desc">{nivel.descricao}</span>}
      </div>
      <span className="gr-nivel__pessoas" title="Pessoas neste nível">
        <Icone nome="equipe" tamanho={15} /> {pessoas}
        <span className="sr-only"> pessoa(s)</span>
      </span>
      <div className="gr-nivel__acoes">
        <button type="button" className="sc-btn sc-btn--contorno" onClick={() => onEditar(nivel)} aria-label={`Editar ${nivel.nome}`}>
          <Icone nome="editar" tamanho={15} /> Editar
        </button>
        {inativo ? (
          <button type="button" className="sc-btn sc-btn--contorno" onClick={() => onReativar(nivel.id_nivel)} aria-label={`Reativar ${nivel.nome}`}>
            Reativar
          </button>
        ) : (
          <button type="button" className="sc-btn sc-btn--contorno" onClick={() => onInativar(nivel.id_nivel)} aria-label={`Inativar ${nivel.nome}`}>
            Inativar
          </button>
        )}
        <button type="button" className="sc-btn sc-btn--perigo gr-so-icone" onClick={() => onExcluir(nivel.id_nivel)} aria-label={`Excluir ${nivel.nome}`}>
          <Icone nome="lixeira" tamanho={16} />
        </button>
      </div>
    </li>
  );
}
