import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  EventoUnificado,
  VisualizacaoMes,
  VisualizacaoSemana,
  VisaoAno,
  EscalaEvento,
  SlotInstrumento,
  SlotMembro,
} from "../../services/escalaService";
import { SlotDrop, payloadDeDrop, MoverUnificadoPayload } from "./EscalaQuadroUnificado";

function formatarHora(s: string) {
  return s || "";
}

function formatarDataHora(s: string) {
  return new Date(s).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SemanaEventoCard({
  ev,
  idsNoEvento,
  podeEditar,
  expandido,
  onToggleExpandir,
  onAbrirEvento,
  onEscalar,
}: {
  ev: EventoUnificado;
  idsNoEvento: number[];
  podeEditar: boolean;
  expandido: boolean;
  onToggleExpandir: (id: number) => void;
  onAbrirEvento: (id: number) => void;
  onEscalar?: (eventoId: number, slot: SlotInstrumento) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `evento-semana-${ev.id}`,
    data: { eventoId: ev.id, evento: ev },
  });
  const slots = Object.entries(ev.instrumentos || {})
    .sort((a, b) => (a[1].ordem || 0) - (b[1].ordem || 0))
    .filter(([, slot]) => slot.membros.length > 0);
  const nomesPreview = slots
    .flatMap(([, slot]) => slot.membros.map((m) => m.usuario.nome.split(" ")[0]))
    .slice(0, 3);
  const resto = Math.max(0, ev.totais.totalPessoas - nomesPreview.length);

  return (
    <article
      ref={setNodeRef}
      className={`semana-evento tipo-${ev.tipo} ${isOver ? "drop-over" : ""} ${
        expandido ? "expandido" : "recolhido"
      }`}
    >
      <div className="semana-evento-topo">
        <button
          type="button"
          className="semana-evento-titulo"
          onClick={() => onAbrirEvento(ev.id)}
        >
          <span>
            {ev.horaInicio} · {ev.totais.totalPessoas}p
          </span>
          <strong>{ev.nome}</strong>
        </button>
        <button
          type="button"
          className="semana-btn-expandir"
          aria-expanded={expandido}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpandir(ev.id);
          }}
        >
          {expandido ? "Recolher" : "Expandir"}
        </button>
      </div>
      {!expandido && nomesPreview.length > 0 && (
        <p className="semana-evento-preview">
          {nomesPreview.join(", ")}
          {resto > 0 ? ` +${resto}` : ""}
        </p>
      )}
      {expandido &&
        slots.map(([key, slot]) => (
          <SlotDrop
            key={key}
            eventoId={ev.id}
            slotKey={key}
            slot={slot}
            idsNoEvento={idsNoEvento}
            podeEditar={podeEditar}
            compacto
            onEscalar={() => onEscalar?.(ev.id, slot)}
          />
        ))}
      {expandido && slots.length === 0 && (
        <span className="semana-evento-vazio">Sem pessoas</span>
      )}
    </article>
  );
}

interface PropsComuns {
  onAbrirEvento: (id: number) => void;
}

export const EscalaVisaoDia: React.FC<
  PropsComuns & { eventos: EventoUnificado[]; data: string }
> = ({ eventos, data, onAbrirEvento }) => (
  <section className="escala-visao-dia">
    <h3 className="escala-lista-titulo">
      {new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })}
    </h3>
    {eventos.length === 0 ? (
      <p className="escala-vazio">Nenhum evento neste dia.</p>
    ) : (
      <ul className="escala-lista-eventos">
        {eventos.map((ev) => (
          <li key={ev.id} className="escala-item-evento">
            <button type="button" className="escala-item-evento-btn" onClick={() => onAbrirEvento(ev.id)}>
              <span className="ev-data">
                {formatarHora(ev.horaInicio)}
                {ev.horaFim ? ` – ${formatarHora(ev.horaFim)}` : ""}
              </span>
              <span className="ev-titulo">{ev.nome}</span>
              <span className="ev-meta">{ev.totais.totalPessoas} pessoas</span>
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export const EscalaVisaoSemana: React.FC<
  PropsComuns & {
    visao: VisualizacaoSemana;
    onAbrirDia?: (data: string) => void;
    podeEditar?: boolean;
    onMover?: (payload: MoverUnificadoPayload) => Promise<void>;
    onEscalar?: (eventoId: number, slot: SlotInstrumento) => void;
    onCopiarSemana?: () => void;
  }
> = ({ visao, onAbrirEvento, onAbrirDia, podeEditar, onMover, onEscalar, onCopiarSemana }) => {
  const [active, setActive] = useState<SlotMembro | null>(null);
  const [expandidos, setExpandidos] = useState<Set<number>>(() => new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const todosIdsEventos = useMemo(
    () => (visao.dias || []).flatMap((d) => d.eventos.map((e) => e.id)),
    [visao.dias]
  );

  const idsPorEvento = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const dia of visao.dias || []) {
      for (const ev of dia.eventos) {
        map.set(
          ev.id,
          Object.values(ev.instrumentos || {}).flatMap((s) => s.membros.map((m) => m.usuario.id))
        );
      }
    }
    return map;
  }, [visao.dias]);

  const todosExpandidos =
    todosIdsEventos.length > 0 && todosIdsEventos.every((id) => expandidos.has(id));

  const toggleExpandir = (id: number) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandirOuRecolherTudo = () => {
    if (todosExpandidos) {
      setExpandidos(new Set());
    } else {
      setExpandidos(new Set(todosIdsEventos));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActive(null);
    if (!onMover) return;
    const membro = event.active.data.current?.membro as SlotMembro | undefined;
    const dest = event.over?.data.current as
      | { eventoId: number; slot?: SlotInstrumento; evento?: EventoUnificado }
      | undefined;
    if (!membro || !dest) return;
    let slot = dest.slot;
    if (!slot && dest.evento) {
      const slots = Object.values(dest.evento.instrumentos || {});
      slot =
        slots.find((s) => s.tipo === membro.tipoSlot) ||
        slots.find((s) => s.id_escala_area === membro.id_escala_area) ||
        slots[0];
    }
    if (!slot) return;
    if (membro.id_escala_area === slot.id_escala_area && membro.tipoSlot === slot.tipo) {
      return;
    }
    await onMover(payloadDeDrop(membro, { eventoId: dest.eventoId, slot }));
  };

  return (
    <section className="escala-visao-semana">
      <div className="quadro-toolbar">
        <p className="quadro-stats">
          {visao.estatisticas?.totalEventos ?? 0} eventos · {visao.estatisticas?.pessoasUnicas ?? 0} pessoas
          únicas
        </p>
        <div className="quadro-toolbar-actions">
          {todosIdsEventos.length > 0 && (
            <button type="button" className="btn-mapa" onClick={expandirOuRecolherTudo}>
              {todosExpandidos ? "Recolher tudo" : "Expandir tudo"}
            </button>
          )}
          {onCopiarSemana && (
            <button type="button" className="btn-mapa" onClick={onCopiarSemana}>
              Copiar semana
            </button>
          )}
        </div>
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActive((e.active.data.current?.membro as SlotMembro) || null)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActive(null)}
      >
        <div className="semana-grade">
          {(visao.dias || []).map((dia) => (
            <div key={dia.data} className="semana-coluna">
              <header className="semana-dia-header">
                <button
                  type="button"
                  className="link-evento"
                  onClick={() => onAbrirDia?.(dia.data)}
                >
                  {dia.diaDaSemana.slice(0, 3)} {String(dia.diaNumero).padStart(2, "0")}
                </button>
              </header>
              <div className="semana-dia-body">
                {dia.eventos.map((ev) => (
                  <SemanaEventoCard
                    key={ev.id}
                    ev={ev}
                    idsNoEvento={idsPorEvento.get(ev.id) || []}
                    podeEditar={!!podeEditar}
                    expandido={expandidos.has(ev.id)}
                    onToggleExpandir={toggleExpandir}
                    onAbrirEvento={onAbrirEvento}
                    onEscalar={onEscalar}
                  />
                ))}
                {dia.eventos.length === 0 && <span className="semana-vazio">—</span>}
              </div>
            </div>
          ))}
        </div>
        <DragOverlay>
          {active ? <div className="dnd-overlay-chip">{active.usuario.nome}</div> : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
};

export const EscalaVisaoMesUnificada: React.FC<{
  visao: VisualizacaoMes;
  onAbrirDia: (data: string) => void;
  onAbrirEvento: (id: number) => void;
}> = ({ visao, onAbrirDia, onAbrirEvento }) => {
  const primeiro = visao.dias?.[0];
  const offset = primeiro
    ? new Date(`${primeiro.data}T12:00:00`).getDay()
    : 0;
  const stats = visao.estatisticas;
  return (
    <section className="escala-visao-mes-unificada">
      <div className="calendario-dias-semana">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <span key={d} className="dia-semana">
            {d}
          </span>
        ))}
      </div>
      <div className="calendario-grid">
        {Array.from({ length: offset }, (_, i) => (
          <div key={`e-${i}`} className="calendario-celula vazio" />
        ))}
        {(visao.dias || []).map((dia) => (
          <div
            key={dia.data}
            className={`calendario-celula clicavel ${dia.temEventos ? "tem-evento" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => onAbrirDia(dia.data)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAbrirDia(dia.data);
              }
            }}
          >
            <span className="dia-numero">{dia.diaNumero}</span>
            {dia.temEventos && (
              <div className="dia-eventos">
                {dia.eventos.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    className={`dia-evento-nome tipo-${ev.tipo}`}
                    title={ev.nome}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAbrirEvento(ev.id);
                    }}
                  >
                    {ev.horaInicio} {ev.nome} ({ev.totalPessoas}p)
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {stats && (
        <div className="mes-estatisticas">
          <h3>Estatísticas do mês</h3>
          <ul>
            <li>Total de eventos: {stats.totalEventos}</li>
            <li>Pessoas únicas: {stats.pessoasUnicas}</li>
            {stats.pessoaMaisEscalada && (
              <li>
                Mais escalada: {stats.pessoaMaisEscalada.nome} ({stats.pessoaMaisEscalada.totalEscalas}x)
              </li>
            )}
            {stats.instrumentosMaisUsados?.[0] && (
              <li>
                Slot mais usado: {stats.instrumentosMaisUsados[0].instrumento || stats.instrumentosMaisUsados[0].tipo}{" "}
                ({stats.instrumentosMaisUsados[0].quantidade})
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
};

export const EscalaVisaoAnoPainel: React.FC<
  PropsComuns & {
    visao: VisaoAno;
    onSelecionarMes: (mes: number) => void;
  }
> = ({ visao, onSelecionarMes, onAbrirEvento }) => {
  const MESES = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return (
    <section className="escala-visao-ano">
      <div className="ano-grade">
        {visao.meses.map((m) => (
          <button
            key={m.mes}
            type="button"
            className={`ano-mes-card ${m.total_eventos > 0 ? "tem-eventos" : ""}`}
            onClick={() => onSelecionarMes(m.mes)}
          >
            <span className="ano-mes-nome">{MESES[m.mes - 1]}</span>
            <span className="ano-mes-total">{m.total_eventos} eventos</span>
            <ul className="ano-mes-lista">
              {m.eventos.slice(0, 3).map((ev: EscalaEvento) => (
                <li key={ev.id_escala_evento}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAbrirEvento(ev.id_escala_evento);
                    }}
                  >
                    {formatarDataHora(ev.data_hora)} — {ev.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </section>
  );
};
