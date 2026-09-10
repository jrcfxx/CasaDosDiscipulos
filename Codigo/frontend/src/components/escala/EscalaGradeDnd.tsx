import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  EscalaAtribuicao,
  EscalaEventoCompleto,
} from "../../services/escalaService";
import { DetalhesResumo } from "../AtribuicaoDetalhesForm";

interface EscalaGradeDndProps {
  evento: EscalaEventoCompleto;
  podeEditar: boolean;
  onMover: (idAtribuicao: number, idAreaDestino: number) => Promise<void>;
  onEscalar: (areaId: number) => void;
  onEditar: (att: EscalaAtribuicao, areaNome: string) => void;
  onRemover: (att: EscalaAtribuicao) => void;
}

function IconDrag() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="17" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 20h9" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRemove() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function iniciais(nome?: string) {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function PessoaChip({
  att,
  areaNome,
  disabled,
  onEditar,
  onRemover,
}: {
  att: EscalaAtribuicao;
  areaNome: string;
  disabled: boolean;
  onEditar: () => void;
  onRemover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `attr-${att.id_escala_atribuicao}`,
    data: { atribuicao: att },
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`pessoa-item ${!disabled ? "arrastavel" : ""} ${isDragging ? "arrastando" : ""}`}
    >
      {!disabled && (
        <button
          type="button"
          className="pessoa-drag"
          title="Arrastar"
          aria-label={`Arrastar ${att.usuario_nome}`}
          {...listeners}
          {...attributes}
        >
          <IconDrag />
        </button>
      )}
      <span className="pessoa-avatar" aria-hidden>
        {iniciais(att.usuario_nome)}
      </span>
      <div className="pessoa-info">
        <span className="pessoa-nome">{att.usuario_nome}</span>
        {att.detalhes && Object.keys(att.detalhes).length > 0 && (
          <DetalhesResumo detalhes={att.detalhes} nomeArea={areaNome} />
        )}
      </div>
      {!disabled && (
        <div className="pessoa-acoes">
          <button
            type="button"
            className="pessoa-acao"
            onClick={onEditar}
            title="Editar detalhes"
            aria-label={`Editar ${att.usuario_nome}`}
          >
            <IconEdit />
          </button>
          <button
            type="button"
            className="pessoa-acao pessoa-acao--perigo"
            onClick={onRemover}
            title="Remover da escala"
            aria-label={`Remover ${att.usuario_nome}`}
          >
            <IconRemove />
          </button>
        </div>
      )}
    </li>
  );
}

function AreaDropZone({
  area,
  children,
}: {
  area: { id_escala_area: number; nome: string; podeGerenciar?: boolean };
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `area-${area.id_escala_area}`,
    data: { area },
    disabled: !area.podeGerenciar,
  });

  return (
    <div
      ref={setNodeRef}
      className={`escala-area-card ${isOver ? "drop-over" : ""} ${area.podeGerenciar ? "" : "somente-leitura"}`}
    >
      {children}
    </div>
  );
}

const EscalaGradeDnd: React.FC<EscalaGradeDndProps> = ({
  evento,
  podeEditar,
  onMover,
  onEscalar,
  onEditar,
  onRemover,
}) => {
  const [activeAtt, setActiveAtt] = useState<EscalaAtribuicao | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const areas = useMemo(() => evento.areas || [], [evento.areas]);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveAtt(null);
    const { active, over } = event;
    if (!over) return;
    const att = active.data.current?.atribuicao as EscalaAtribuicao | undefined;
    const areaDestino = over.data.current?.area as { id_escala_area: number } | undefined;
    if (!att || !areaDestino) return;
    if (att.id_escala_area === areaDestino.id_escala_area) return;
    await onMover(att.id_escala_atribuicao, areaDestino.id_escala_area);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => {
        const att = e.active.data.current?.atribuicao as EscalaAtribuicao | undefined;
        setActiveAtt(att || null);
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveAtt(null)}
    >
      <div className="escala-dashboard-areas">
        {areas.map((area) => (
          <AreaDropZone key={area.id_escala_area} area={area}>
            <div className="area-card-header">
              <h4>{area.nome}</h4>
              <span className="area-count">{area.atribuicoes?.length ?? 0}</span>
            </div>
            <ul className="area-pessoas">
              {(area.atribuicoes || []).map((a) => (
                <PessoaChip
                  key={a.id_escala_atribuicao}
                  att={a}
                  areaNome={area.nome}
                  disabled={!podeEditar || !area.podeGerenciar}
                  onEditar={() => onEditar(a, area.nome)}
                  onRemover={() => onRemover(a)}
                />
              ))}
              {(!area.atribuicoes || area.atribuicoes.length === 0) && (
                <li className="pessoa-vazio">Ninguém escalado</li>
              )}
            </ul>
            {podeEditar && area.podeGerenciar && (
              <button
                type="button"
                className="btn-escalar-area"
                onClick={() => onEscalar(area.id_escala_area)}
              >
                + Escalar
              </button>
            )}
          </AreaDropZone>
        ))}
      </div>
      <DragOverlay>
        {activeAtt ? (
          <div className="dnd-overlay-chip">{activeAtt.usuario_nome}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default EscalaGradeDnd;
