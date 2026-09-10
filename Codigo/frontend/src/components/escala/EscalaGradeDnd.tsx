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
      className={`pessoa-item ${!disabled ? "arrastavel" : ""}`}
      {...(!disabled ? { ...listeners, ...attributes } : {})}
    >
      <div className="pessoa-info">
        <span className="pessoa-nome">{att.usuario_nome}</span>
        {att.detalhes && Object.keys(att.detalhes).length > 0 && (
          <DetalhesResumo detalhes={att.detalhes} nomeArea={areaNome} />
        )}
      </div>
      {!disabled && (
        <div className="pessoa-acoes">
          <button type="button" className="btn-editar-detalhes" onClick={onEditar} title="Editar">
            ✎
          </button>
          <button type="button" className="btn-remover" onClick={onRemover} title="Remover">
            ×
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
              <button type="button" className="btn-escalar-area" onClick={() => onEscalar(area.id_escala_area)}>
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
