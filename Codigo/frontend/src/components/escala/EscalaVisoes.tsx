import React, { useMemo, useState } from "react";
import { colisaoEscala } from "./colisaoEscala";
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
import { ParalelismoMapa } from "../../utils/ministerioParalelismo";
import { faixaHorario, plural, tituloSemana, toIsoDate } from "../../utils/escalaDatas";

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
  paralelismoMapa,
  podeEditar,
  expandido,
  onToggleExpandir,
  onAbrirEvento,
  onEscalar,
}: {
  ev: EventoUnificado;
  paralelismoMapa: ParalelismoMapa;
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
  // Expandido mostra TODAS as áreas (inclusive vazias): são onde o líder solta as pessoas
  const slots = Object.entries(ev.instrumentos || {}).sort((a, b) => (a[1].ordem || 0) - (b[1].ordem || 0));
  const nomesPreview = slots
    .flatMap(([, slot]) => slot.membros.map((m) => m.usuario.nome.split(" ")[0]))
    .slice(0, 3);
  const resto = Math.max(0, ev.totais.totalPessoas - nomesPreview.length);

  return (
    <article
      ref={setNodeRef}
      className={`semana-evento tipo-${ev.tipo} status-${ev.status} ${isOver ? "drop-over" : ""} ${
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
            {faixaHorario(ev.horaInicio, ev.horaFim)} · {plural(ev.totais.totalPessoas, "pessoa")}
          </span>
          <strong>{ev.nome}</strong>
          {ev.status === "rascunho" && <em className="evento-rascunho-tag">Rascunho</em>}
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
            instrumentosDoEvento={Object.values(ev.instrumentos || {})}
            paralelismoMapa={paralelismoMapa}
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

/**
 * Área de destino ao soltar sobre o card de um evento: mesmo ministério e mesma função de origem;
 * senão o mesmo ministério; senão nenhuma (o líder escolhe abrindo o evento).
 */
export function slotCompativel(
  slotsDestino: SlotInstrumento[],
  origem: SlotInstrumento | undefined,
  membro: SlotMembro
): SlotInstrumento | undefined {
  const mesmoMinisterio = (s: SlotInstrumento) =>
    origem?.id_ministerio != null
      ? s.id_ministerio === origem.id_ministerio
      : !!origem && s.areaNome === origem.areaNome;
  return (
    slotsDestino.find((s) => mesmoMinisterio(s) && s.tipo === (membro.tipoSlot || origem?.tipo)) ||
    slotsDestino.find((s) => mesmoMinisterio(s) && s.tipo === "_geral") ||
    slotsDestino.find((s) => mesmoMinisterio(s))
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

/**
 * Semanas em sequência (o líder escolhe o intervalo de datas). Todas ficam no MESMO quadro de
 * arrastar: dá para levar uma pessoa de um evento para outro em qualquer semana do intervalo.
 */
export const EscalaVisaoSemana: React.FC<
  PropsComuns & {
    semanas: VisualizacaoSemana[];
    onAbrirDia?: (data: string) => void;
    podeEditar?: boolean;
    paralelismoMapa?: ParalelismoMapa;
    onMover?: (payload: MoverUnificadoPayload) => Promise<void>;
    onEscalar?: (eventoId: number, slot: SlotInstrumento) => void;
    onCopiarSemana?: (dataInicio: string) => void;
    /** Mensagem quando soltar sobre o card não tem área compatível */
    onAviso?: (msg: string) => void;
  }
> = ({
  semanas,
  onAbrirEvento,
  onAbrirDia,
  podeEditar,
  paralelismoMapa = {},
  onMover,
  onEscalar,
  onCopiarSemana,
  onAviso,
}) => {
  const todosDias = useMemo(() => semanas.flatMap((s) => s.dias || []), [semanas]);
  const totalEventos = todosDias.reduce((n, d) => n + d.eventos.length, 0);
  const pessoasUnicas = useMemo(() => {
    const ids = new Set<number>();
    for (const d of todosDias)
      for (const e of d.eventos)
        for (const s of Object.values(e.instrumentos || {})) for (const m of s.membros) ids.add(m.usuario.id);
    return ids.size;
  }, [todosDias]);
  const [active, setActive] = useState<SlotMembro | null>(null);
  const [expandidos, setExpandidos] = useState<Set<number>>(() => new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const hoje = toIsoDate(new Date());

  const todosIdsEventos = useMemo(
    () => todosDias.flatMap((d) => d.eventos.map((e) => e.id)),
    [todosDias]
  );

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
      // Soltou sobre o card (evento recolhido): vai para o MESMO ministério de origem.
      // Antes caía na primeira área do evento, que podia ser de outro ministério.
      const origem = todosDias
        .flatMap((d) => d.eventos)
        .flatMap((e) => Object.values(e.instrumentos || {}))
        .find((s) => s.membros.some((m) => m.membroEscalaId === membro.membroEscalaId));
      slot = slotCompativel(Object.values(dest.evento.instrumentos || {}), origem, membro);
      if (!slot) {
        onAviso?.(
          origem
            ? `${dest.evento.nome} não tem a área ${origem.areaNome}. Expanda o evento e solte sobre a área desejada.`
            : "Expanda o evento e solte sobre a área desejada."
        );
        return;
      }
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
          {plural(semanas.length, "semana")} · {plural(totalEventos, "evento")} ·{" "}
          {plural(pessoasUnicas, "pessoa", "pessoas")}
          {podeEditar && totalEventos > 0 && (
            <span className="quadro-dica"> · Expanda os eventos e arraste as pessoas entre eles</span>
          )}
        </p>
        <div className="quadro-toolbar-actions">
          {todosIdsEventos.length > 0 && (
            <button type="button" className="esc-btn esc-btn--fantasma" onClick={expandirOuRecolherTudo}>
              {todosExpandidos ? "Recolher tudo" : "Expandir tudo"}
            </button>
          )}
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={colisaoEscala}
        onDragStart={(e) => setActive((e.active.data.current?.membro as SlotMembro) || null)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActive(null)}
      >
        {semanas.map((semana) => (
        <section key={semana.dataInicio} className="semana-bloco" aria-label={tituloSemana(semana.dataInicio)}>
          <header className="semana-bloco__topo">
            <h3 className="semana-bloco__titulo">{tituloSemana(semana.dataInicio)}</h3>
            {onCopiarSemana && (
              <button
                type="button"
                className="esc-btn esc-btn--fantasma semana-bloco__copiar"
                onClick={() => onCopiarSemana(semana.dataInicio)}
              >
                Copiar semana
              </button>
            )}
          </header>
        <div className="semana-grade">
          {(semana.dias || []).map((dia) => (
            <div
              key={dia.data}
              className={`semana-coluna${dia.data === hoje ? " hoje" : ""}${dia.data < hoje ? " passado" : ""}`}
            >
              <header className="semana-dia-header">
                <button
                  type="button"
                  className="link-evento"
                  onClick={() => onAbrirDia?.(dia.data)}
                  aria-label={`Abrir ${dia.diaDaSemana} ${dia.diaNumero}${dia.data === hoje ? " (hoje)" : ""}`}
                >
                  <span className="semana-dia-nome">{dia.diaDaSemana.slice(0, 3)}</span>
                  <span className="semana-dia-numero">{dia.diaNumero}</span>
                </button>
              </header>
              <div className="semana-dia-body">
                {dia.eventos.map((ev) => (
                  <SemanaEventoCard
                    key={ev.id}
                    ev={ev}
                    paralelismoMapa={paralelismoMapa}
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
        </section>
        ))}
        <DragOverlay>
          {active ? <div className="dnd-overlay-chip">{active.usuario.nome}</div> : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
};

const DIAS_SEMANA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MAX_EVENTOS_CELULA = 3;

/** Calendário mensal interativo (grade 7×N) */
export const EscalaVisaoMesCalendario: React.FC<{
  visao: VisualizacaoMes;
  onAbrirDia: (data: string) => void;
  onAbrirEvento: (id: number) => void;
}> = ({ visao, onAbrirDia, onAbrirEvento }) => {
  const hoje = toIsoDate(new Date());
  const offset = useMemo(() => {
    const primeiro = visao.dias?.[0]?.data;
    if (!primeiro) return 0;
    return new Date(`${primeiro}T12:00:00`).getDay();
  }, [visao.dias]);

  const celulas = useMemo(() => {
    const vazios = Array.from({ length: offset }, (_, i) => ({ key: `vazio-${i}`, vazio: true as const }));
    const dias = (visao.dias || []).map((d) => ({
      key: d.data,
      vazio: false as const,
      dia: d,
    }));
    return [...vazios, ...dias];
  }, [visao.dias, offset]);

  return (
    <section className="escala-calendario" aria-label={`Calendário de ${visao.mesNome} ${visao.ano}`}>
      <div className="calendario-dias-semana">
        {DIAS_SEMANA_CURTO.map((d) => (
          <div key={d} className="dia-semana">
            {d}
          </div>
        ))}
      </div>
      <div className="calendario-grid">
        {celulas.map((cel) => {
          if (cel.vazio) {
            return <div key={cel.key} className="calendario-celula vazio" aria-hidden />;
          }
          const { dia } = cel;
          const eventos = dia.eventos || [];
          const visiveis = eventos.slice(0, MAX_EVENTOS_CELULA);
          const resto = eventos.length - visiveis.length;
          const ehHoje = dia.data === hoje;
          const passado = dia.data < hoje;
          return (
            <div
              key={cel.key}
              className={`calendario-celula ${dia.temEventos ? "tem-evento clicavel" : "clicavel"}${
                ehHoje ? " hoje" : ""
              }${passado ? " passado" : ""}`}
              onClick={() => onAbrirDia(dia.data)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onAbrirDia(dia.data);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${dia.diaDaSemana} ${dia.diaNumero}${ehHoje ? " (hoje)" : ""}${
                dia.temEventos ? `, ${plural(dia.totalEventos, "evento")}` : ""
              }`}
            >
              <span className="dia-numero">{dia.diaNumero}</span>
              {/* No celular os nomes não cabem: mostra só a quantidade */}
              {dia.temEventos && (
                <span className="dia-contagem" aria-hidden>
                  {dia.totalEventos}
                </span>
              )}
              {visiveis.length > 0 && (
                <div className="dia-eventos">
                  {visiveis.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      className={`dia-evento-nome tipo-${ev.tipo || "outro"} status-${ev.status || "publicada"}`}
                      title={`${ev.horaInicio ? `${ev.horaInicio.slice(0, 5)} · ` : ""}${ev.nome}${
                        ev.status === "rascunho" ? " (rascunho)" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbrirEvento(ev.id);
                      }}
                    >
                      {ev.horaInicio ? `${ev.horaInicio.slice(0, 5)} ` : ""}
                      {ev.nome}
                    </button>
                  ))}
                  {resto > 0 && (
                    <span className="dia-evento-mais">+{resto} mais</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {visao.estatisticas && (
        <p className="calendario-resumo">
          {plural(visao.estatisticas.totalEventos, "evento")} ·{" "}
          {plural(visao.estatisticas.pessoasUnicas, "pessoa única", "pessoas únicas")}
        </p>
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
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const agora = new Date();
  const mesAtual = agora.getMonth() + 1;
  const anoAtual = agora.getFullYear();
  return (
    <section className="escala-visao-ano">
      <div className="ano-grade">
        {visao.meses.map((m) => {
          const atual = m.mes === mesAtual && visao.ano === anoAtual;
          return (
            // Card é um contêiner: o botão do mês e os botões dos eventos ficam lado a lado
            // (botão dentro de botão é HTML inválido e confunde clique e leitor de tela)
            <div
              key={m.mes}
              className={`ano-mes-card ${m.total_eventos > 0 ? "tem-eventos" : ""}${atual ? " atual" : ""}`}
            >
              <button type="button" className="ano-mes-abrir" onClick={() => onSelecionarMes(m.mes)}>
                <span className="ano-mes-nome">{MESES[m.mes - 1]}</span>
                <span className="ano-mes-total">
                  {m.total_eventos > 0 ? plural(m.total_eventos, "evento") : "Sem eventos"}
                </span>
              </button>
              {m.eventos.length > 0 && (
                <ul className="ano-mes-lista">
                  {m.eventos.slice(0, 3).map((ev: EscalaEvento) => (
                    <li key={ev.id_escala_evento}>
                      <button type="button" onClick={() => onAbrirEvento(ev.id_escala_evento)}>
                        {formatarDataHora(ev.data_hora)} — {ev.titulo}
                        {ev.status === "rascunho" ? " (rascunho)" : ""}
                      </button>
                    </li>
                  ))}
                  {m.eventos.length > 3 && (
                    <li>
                      <button type="button" className="ano-mes-mais" onClick={() => onSelecionarMes(m.mes)}>
                        + {m.eventos.length - 3} no mês
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
