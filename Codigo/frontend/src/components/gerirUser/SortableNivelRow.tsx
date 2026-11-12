import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Nivel } from "./tipos";

/** Linha da tabela de níveis que pode ser arrastada para reordenar */
export default function SortableNivelRow({
  nivel,
  onEditar,
  onInativar,
  onReativar,
  onExcluir,
}: {
  nivel: Nivel;
  onEditar: (n: Nivel) => void;
  onInativar: (id: number) => void;
  onReativar: (id: number) => void;
  onExcluir: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: nivel.id_nivel });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  const inativo = !nivel.ativo;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${inativo ? "nivel-inativo" : ""} ${isDragging ? "nivel-dragging" : ""}`}
    >
      <td className="nivel-ordem-cell">
        <button
          type="button"
          className="nivel-drag-handle"
          title="Arrastar para reordenar"
          aria-label={`Arrastar nível ${nivel.nome}`}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <span className="nivel-ordem-num">{nivel.ordem}</span>
      </td>
      <td>
        {nivel.nome}
        {inativo && <span className="badge-inativo">Inativo</span>}
      </td>
      <td>{nivel.descricao || "-"}</td>
      <td className="acoes">
        <button className="btn-edit" onClick={() => onEditar(nivel)}>
          Editar
        </button>
        {inativo ? (
          <button className="btn-reativar" onClick={() => onReativar(nivel.id_nivel)}>
            Reativar
          </button>
        ) : (
          <button className="btn-delete" onClick={() => onInativar(nivel.id_nivel)}>
            Inativar
          </button>
        )}
        <button className="btn-excluir-nivel" onClick={() => onExcluir(nivel.id_nivel)}>
          Excluir
        </button>
      </td>
    </tr>
  );
}
