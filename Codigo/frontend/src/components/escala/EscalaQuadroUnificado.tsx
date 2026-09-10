import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDndContext,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SlotInstrumento,
  SlotMembro,
  VisualizacaoDia,
} from "../../services/escalaService";

export interface MoverUnificadoPayload {
  membroEscalaOrigemId: number;
  escalaDestinoId: number;
  instrumentoDestino: string;
  id_escala_area: number;
}

interface Props {
  visao: VisualizacaoDia;
  podeEditar: boolean;
  onMover: (payload: MoverUnificadoPayload) => Promise<void>;
  onEscalar: (eventoId: number, slot: SlotInstrumento) => void;
  onAbrirEvento: (eventoId: number) => void;
  onCopiarDia?: () => void;
  onTemplates?: () => void;
  onEditarMembro?: (membro: SlotMembro, areaNome: string) => void;
  onRemoverMembro?: (membro: SlotMembro) => void;
}

function iniciais(nome?: string) {
  return (nome || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ChipPessoa({
  membro,
  disabled,
  compacto,
  onEditar,
  onRemover,
}: {
  membro: SlotMembro;
  disabled: boolean;
  compacto?: boolean;
  onEditar?: () => void;
  onRemover?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `membro-${membro.membroEscalaId}`,
    data: { membro },
    disabled,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`quadro-chip ${disabled ? "" : "arrastavel"} ${compacto ? "compacto" : ""}`}
      {...(!disabled ? { ...listeners, ...attributes } : {})}
    >
      <span className="quadro-chip-avatar">{iniciais(membro.usuario.nome)}</span>
      <span className="quadro-chip-info">
        <span className="quadro-chip-nome">
          {compacto ? membro.usuario.nome.split(" ")[0] : membro.usuario.nome}
        </span>
        {!compacto && membro.usuario.telefone && (
          <span className="quadro-chip-tel">{membro.usuario.telefone}</span>
        )}
      </span>
      {!compacto && (onEditar || onRemover) && (
        <span className="quadro-chip-acoes">
          {onEditar && (
            <button
              type="button"
              className="chip-acao"
              title="Editar"
              aria-label="Editar"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEditar();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M12 20h9" strokeLinecap="round" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {onRemover && (
            <button
              type="button"
              className="chip-acao perigo"
              title="Remover"
              aria-label="Remover"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemover();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </span>
      )}
    </div>
  );
}

export function SlotDrop({
  eventoId,
  slotKey,
  slot,
  idsNoEvento,
  podeEditar,
  compacto,
  onEscalar,
  onEditarMembro,
  onRemoverMembro,
}: {
  eventoId: number;
  slotKey: string;
  slot: SlotInstrumento;
  idsNoEvento: number[];
  podeEditar: boolean;
  compacto?: boolean;
  onEscalar: () => void;
  onEditarMembro?: (membro: SlotMembro, areaNome: string) => void;
  onRemoverMembro?: (membro: SlotMembro) => void;
}) {
  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${eventoId}-${slot.id_escala_area}-${slot.tipo}-${slotKey}`,
    data: { eventoId, slot, slotKey },
    disabled: !podeEditar || !slot.podeGerenciar,
  });
  const lotado = slot.limite != null && slot.atual >= slot.limite;
  const membroAtivo = active?.data.current?.membro as SlotMembro | undefined;
  const mesmoSlot =
    !!membroAtivo &&
    membroAtivo.id_escala_area === slot.id_escala_area &&
    (membroAtivo.tipoSlot || "") === slot.tipo;
  const conflitoUsuario =
    !!membroAtivo &&
    idsNoEvento.includes(membroAtivo.usuario.id) &&
    !slot.membros.some((m) => m.membroEscalaId === membroAtivo.membroEscalaId);
  const invalido = isOver && (conflitoUsuario || (lotado && !mesmoSlot));
  const valido = isOver && !invalido && !!membroAtivo && !mesmoSlot;

  return (
    <div
      ref={setNodeRef}
      className={`quadro-slot ${valido ? "drop-over" : ""} ${invalido ? "drop-invalido" : ""} ${
        lotado ? "slot-lotado" : ""
      } ${compacto ? "compacto" : ""}`}
    >
      <div className="quadro-slot-header">
        <span>
          {slot.icone} {slot.nome}
          {slot.limite != null ? ` (${slot.atual}/${slot.limite})` : ` (${slot.atual})`}
        </span>
        {isOver && invalido && <span className="drop-hint erro">Conflito</span>}
        {isOver && valido && <span className="drop-hint ok">Solte aqui</span>}
      </div>
      <div className="quadro-slot-membros">
        {slot.membros.map((m) => (
          <ChipPessoa
            key={m.membroEscalaId}
            membro={m}
            disabled={!podeEditar || !slot.podeGerenciar}
            compacto={compacto}
            onEditar={onEditarMembro ? () => onEditarMembro(m, slot.areaNome) : undefined}
            onRemover={onRemoverMembro ? () => onRemoverMembro(m) : undefined}
          />
        ))}
        {podeEditar && slot.podeGerenciar && !lotado && (
          <button type="button" className={`quadro-add ${compacto ? "compacto" : ""}`} onClick={onEscalar}>
            {compacto ? "+" : "+ Adicionar"}
          </button>
        )}
      </div>
    </div>
  );
}

export function payloadDeDrop(
  membro: SlotMembro,
  dest: { eventoId: number; slot: SlotInstrumento }
): MoverUnificadoPayload {
  return {
    membroEscalaOrigemId: membro.membroEscalaId,
    escalaDestinoId: dest.eventoId,
    instrumentoDestino: dest.slot.tipo,
    id_escala_area: dest.slot.id_escala_area,
  };
}

const EscalaQuadroUnificado: React.FC<Props> = ({
  visao,
  podeEditar,
  onMover,
  onEscalar,
  onAbrirEvento,
  onCopiarDia,
  onTemplates,
  onEditarMembro,
  onRemoverMembro,
}) => {
  const [active, setActive] = useState<SlotMembro | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const eventos = visao.eventos || [];

  const slotsOrdenados = useMemo(() => {
    const map = new Map<number, [string, SlotInstrumento][]>();
    for (const ev of eventos) {
      const entries = Object.entries(ev.instrumentos || {}).sort(
        (a, b) => (a[1].ordem || 0) - (b[1].ordem || 0)
      );
      map.set(ev.id, entries);
    }
    return map;
  }, [eventos]);

  const idsPorEvento = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const ev of eventos) {
      map.set(
        ev.id,
        Object.values(ev.instrumentos || {}).flatMap((s) => s.membros.map((m) => m.usuario.id))
      );
    }
    return map;
  }, [eventos]);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActive(null);
    const { active: act, over } = event;
    if (!over) return;
    const membro = act.data.current?.membro as SlotMembro | undefined;
    const dest = over.data.current as { eventoId: number; slot: SlotInstrumento } | undefined;
    if (!membro || !dest?.slot) return;
    if (membro.id_escala_area === dest.slot.id_escala_area) {
      const origemSlot = eventos
        .flatMap((e) => Object.values(e.instrumentos || {}))
        .find((s) => s.membros.some((m) => m.membroEscalaId === membro.membroEscalaId));
      if (origemSlot?.tipo === dest.slot.tipo) return;
    }
    await onMover(payloadDeDrop(membro, dest));
  };

  return (
    <section className="escala-quadro">
      <div className="quadro-toolbar">
        {visao.estatisticas && (
          <p className="quadro-stats">
            {visao.estatisticas.totalEventos} eventos · {visao.estatisticas.pessoasUnicas} pessoas
          </p>
        )}
        <div className="quadro-toolbar-actions">
          {onCopiarDia && (
            <button type="button" className="btn-mapa" onClick={onCopiarDia}>
              Copiar dia
            </button>
          )}
          {onTemplates && (
            <button type="button" className="btn-mapa" onClick={onTemplates}>
              Template
            </button>
          )}
        </div>
      </div>
      {eventos.length === 0 ? (
        <p className="escala-vazio">Nenhum evento neste dia. Crie um evento para montar a escala.</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActive((e.active.data.current?.membro as SlotMembro) || null)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActive(null)}
        >
          <div className="quadro-eventos">
            {eventos.map((ev) => (
              <article key={ev.id} className={`quadro-evento tipo-${ev.tipo} status-${ev.status}`}>
                <header className="quadro-evento-header">
                  <div>
                    <h3>
                      <button type="button" className="link-evento" onClick={() => onAbrirEvento(ev.id)}>
                        {ev.nome}
                      </button>
                    </h3>
                    <span className="quadro-horario">
                      {ev.horaInicio}
                      {ev.horaFim ? ` – ${ev.horaFim}` : ""}
                    </span>
                    {ev.totais && (
                      <span className="quadro-totais">
                        {ev.totais.vagasPreenchidas}/{ev.totais.vagasTotal} vagas
                      </span>
                    )}
                  </div>
                  <span className={`status-badge status-${ev.status}`}>{ev.status}</span>
                </header>
                {(slotsOrdenados.get(ev.id) || []).map(([key, slot]) => (
                  <SlotDrop
                    key={key}
                    eventoId={ev.id}
                    slotKey={key}
                    slot={slot}
                    idsNoEvento={idsPorEvento.get(ev.id) || []}
                    podeEditar={podeEditar}
                    onEscalar={() => onEscalar(ev.id, slot)}
                    onEditarMembro={onEditarMembro}
                    onRemoverMembro={onRemoverMembro}
                  />
                ))}
              </article>
            ))}
          </div>
          <DragOverlay>
            {active ? <div className="dnd-overlay-chip">{active.usuario.nome}</div> : null}
          </DragOverlay>
        </DndContext>
      )}
    </section>
  );
};

export default EscalaQuadroUnificado;
