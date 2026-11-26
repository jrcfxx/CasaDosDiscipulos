import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { colisaoEscala, centralizarNoCursor, estiloOverlay } from "./colisaoEscala";
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
import {
  SlotInstrumento,
  SlotMembro,
  VisualizacaoDia,
} from "../../services/escalaService";
import {
  ParalelismoMapa,
  permiteParalelismoMinisterios,
} from "../../utils/ministerioParalelismo";
import { faixaHorario, formatarTelefone, plural, rotuloStatus } from "../../utils/escalaDatas";
import Icone, { existeIcone } from "../ui/Icone";
import { agruparPorArea, iconeDaArea } from "../../utils/slotsPorArea";

export interface MoverUnificadoPayload {
  membroEscalaOrigemId: number;
  escalaDestinoId: number;
  instrumentoDestino: string;
  id_escala_area: number;
}

interface Props {
  visao: VisualizacaoDia;
  podeEditar: boolean;
  paralelismoMapa?: ParalelismoMapa;
  onMover: (payload: MoverUnificadoPayload) => Promise<void>;
  onEscalar: (eventoId: number, slot: SlotInstrumento) => void;
  onAbrirEvento: (eventoId: number) => void;
  onCopiarDia?: () => void;
  onTemplates?: () => void;
  onEditarMembro?: (membro: SlotMembro, areaNome: string) => void;
  onRemoverMembro?: (membro: SlotMembro) => void;
}

/** Conflito se a pessoa já está em outro ministério do evento sem paralelismo permitido. */
export function conflitoParalelismoNoEvento(
  membroAtivo: SlotMembro,
  slotDestino: SlotInstrumento,
  instrumentosDoEvento: SlotInstrumento[],
  mapa: ParalelismoMapa
): boolean {
  const outras = instrumentosDoEvento.flatMap((s) =>
    s.membros
      .filter(
        (m) =>
          m.usuario.id === membroAtivo.usuario.id &&
          m.membroEscalaId !== membroAtivo.membroEscalaId
      )
      .map(() => s.id_ministerio ?? null)
  );
  if (!outras.length) return false;
  return outras.some(
    (idMinOrigem) =>
      !permiteParalelismoMinisterios(idMinOrigem, slotDestino.id_ministerio, mapa)
  );
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `membro-${membro.membroEscalaId}`,
    data: { membro },
    disabled,
  });
  // O original fica no lugar (apagado); quem segue o ponteiro é o rótulo do DragOverlay
  const style = { opacity: isDragging ? 0.4 : 1 };
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
          <span className="quadro-chip-tel">{formatarTelefone(membro.usuario.telefone)}</span>
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
  instrumentosDoEvento,
  paralelismoMapa = {},
  podeEditar,
  compacto,
  onEscalar,
  onEditarMembro,
  onRemoverMembro,
  rotulo,
  sub,
}: {
  eventoId: number;
  slotKey: string;
  slot: SlotInstrumento;
  /** Nome exibido no lugar de slot.nome */
  rotulo?: string;
  /** Função dentro de uma área com várias funções (visual mais enxuto) */
  sub?: boolean;
  instrumentosDoEvento: SlotInstrumento[];
  paralelismoMapa?: ParalelismoMapa;
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
    !mesmoSlot &&
    conflitoParalelismoNoEvento(membroAtivo, slot, instrumentosDoEvento, paralelismoMapa);
  const invalido = isOver && (conflitoUsuario || (lotado && !mesmoSlot));
  const valido = isOver && !invalido && !!membroAtivo && !mesmoSlot;

  return (
    <div
      ref={setNodeRef}
      className={`quadro-slot ${valido ? "drop-over" : ""} ${invalido ? "drop-invalido" : ""} ${
        lotado ? "slot-lotado" : ""
      } ${compacto ? "compacto" : ""}${sub ? " quadro-slot--sub" : ""}`}
    >
      <div className="quadro-slot-header">
        <span>
          {existeIcone(slot.icone) && <Icone nome={slot.icone} tamanho={14} />} {rotulo ?? slot.nome}
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

/**
 * Funções do evento agrupadas por área: área com uma função só aparece como antes; área com várias
 * (Louvor: vocal, violão, bateria…) ganha um cabeçalho com o total e as funções aninhadas embaixo.
 */
export function SlotsPorArea({
  eventoId,
  entradas,
  instrumentosDoEvento,
  paralelismoMapa,
  podeEditar,
  compacto,
  onEscalar,
  onEditarMembro,
  onRemoverMembro,
}: {
  eventoId: number;
  entradas: [string, SlotInstrumento][];
  instrumentosDoEvento: SlotInstrumento[];
  paralelismoMapa?: ParalelismoMapa;
  podeEditar: boolean;
  compacto?: boolean;
  onEscalar: (slot: SlotInstrumento) => void;
  onEditarMembro?: (membro: SlotMembro, areaNome: string) => void;
  onRemoverMembro?: (membro: SlotMembro) => void;
}) {
  return (
    <>
      {agruparPorArea(entradas).map((g) => {
        const slotDrop = ([key, slot]: [string, SlotInstrumento], sub = false) => (
          <SlotDrop
            key={key}
            eventoId={eventoId}
            slotKey={key}
            slot={slot}
            rotulo={sub && slot.tipo === "_geral" ? "Sem função definida" : undefined}
            sub={sub}
            instrumentosDoEvento={instrumentosDoEvento}
            paralelismoMapa={paralelismoMapa}
            podeEditar={podeEditar}
            compacto={compacto}
            onEscalar={() => onEscalar(slot)}
            onEditarMembro={onEditarMembro}
            onRemoverMembro={onRemoverMembro}
          />
        );
        if (g.entradas.length === 1) {
          return (
            <section key={`area-${g.id_escala_area}`} className="quadro-area quadro-area--simples">
              {slotDrop(g.entradas[0])}
            </section>
          );
        }
        // "_geral" vazio dentro de área com funções não precisa aparecer (só ocupa espaço)
        const visiveis = g.entradas.filter(([, s]) => s.tipo !== "_geral" || s.membros.length > 0);
        const icone = iconeDaArea(g);
        return (
          <section
            key={`area-${g.id_escala_area}`}
            className={`quadro-area${compacto ? " compacto" : ""}`}
          >
            <header className="quadro-area__titulo">
              {existeIcone(icone) && <Icone nome={icone} tamanho={compacto ? 14 : 16} />}
              <span className="quadro-area__nome">{g.areaNome}</span>
              <span className="quadro-area__total">
                {g.atual}
                {g.limite != null ? `/${g.limite}` : ""}
              </span>
            </header>
            <div className="quadro-area__funcoes">{visiveis.map((e) => slotDrop(e, true))}</div>
          </section>
        );
      })}
    </>
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
  paralelismoMapa = {},
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

  const instrumentosPorEvento = useMemo(() => {
    const map = new Map<number, SlotInstrumento[]>();
    for (const ev of eventos) {
      map.set(ev.id, Object.values(ev.instrumentos || {}));
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
            {plural(visao.estatisticas.totalEventos, "evento")} ·{" "}
            {plural(visao.estatisticas.pessoasUnicas, "pessoa")}
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
          collisionDetection={colisaoEscala}
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
                    <span className="quadro-horario">{faixaHorario(ev.horaInicio, ev.horaFim)}</span>
                    {ev.totais && (
                      <span className="quadro-totais">
                        {ev.totais.vagasPreenchidas}/{ev.totais.vagasTotal} vagas preenchidas
                      </span>
                    )}
                  </div>
                  <span className={`status-badge status-${ev.status}`}>{rotuloStatus(ev.status)}</span>
                </header>
                <SlotsPorArea
                  eventoId={ev.id}
                  entradas={slotsOrdenados.get(ev.id) || []}
                  instrumentosDoEvento={instrumentosPorEvento.get(ev.id) || []}
                  paralelismoMapa={paralelismoMapa}
                  podeEditar={podeEditar}
                  onEscalar={(slot) => onEscalar(ev.id, slot)}
                  onEditarMembro={onEditarMembro}
                  onRemoverMembro={onRemoverMembro}
                />
              </article>
            ))}
          </div>
          {createPortal(
            <DragOverlay dropAnimation={null} modifiers={[centralizarNoCursor]} style={estiloOverlay}>
              {active ? <div className="dnd-overlay-chip">{active.usuario.nome}</div> : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      )}
    </section>
  );
};

export default EscalaQuadroUnificado;
