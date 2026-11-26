import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  EventoUnificado,
  SlotInstrumento,
  SlotMembro,
  UsuarioParaEscalar,
  MoverMembroPayload,
} from "../../services/escalaService";
import { centralizarNoCursor, estiloOverlay } from "./colisaoEscala";
import "../../style/escalaPlanilha.css";

/**
 * Escala em formato de planilha (como o Excel que a equipe usava):
 * uma linha por evento (data), uma coluna por função, o nome dentro da célula.
 *
 * - Clique numa célula → escolhe as pessoas digitando o nome (Enter adiciona).
 * - Setas / Tab / Enter navegam entre as células sem tirar a mão do teclado.
 * - Ctrl+C / Ctrl+V copia as pessoas de uma célula para outra. Delete limpa a célula.
 * - Arraste um nome para outra célula para trocar de data ou de função.
 */

export interface PlanilhaProps {
  eventos: EventoUnificado[];
  podeEditar: boolean;
  /** Ministérios escolhidos no filtro da barra (nomes das áreas); vazio = todos */
  areasVisiveis?: string[];
  /** Título de evento mostrado; "" = todos */
  filtroEvento: string;
  onFiltroEvento: (t: string) => void;
  carregarCandidatos: (eventoId: number, areaNome: string) => Promise<UsuarioParaEscalar[]>;
  onAdicionar: (eventoId: number, slot: SlotInstrumento, idUsuario: number) => Promise<boolean>;
  onRemover: (evento: EventoUnificado, membros: SlotMembro[]) => Promise<void>;
  onMover: (payload: MoverMembroPayload) => Promise<void>;
  onAbrirEvento: (id: number) => void;
  onAviso: (msg: string, tipo?: "info" | "success" | "error") => void;
}

interface Coluna {
  key: string;
  areaNome: string;
  tipo: string;
  nome: string;
}

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const chaveColuna = (s: SlotInstrumento) => `${s.areaNome.trim().toLowerCase()}::${s.tipo}`;

function semAcento(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Colunas na ordem em que as áreas/funções aparecem nos eventos */
function montarColunas(eventos: EventoUnificado[]): Coluna[] {
  const cols = new Map<string, Coluna & { comGente: boolean; unica: boolean }>();
  for (const ev of eventos) {
    const slots = Object.values(ev.instrumentos || {}).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    const porArea = new Map<number, SlotInstrumento[]>();
    for (const s of slots) porArea.set(s.id_escala_area, [...(porArea.get(s.id_escala_area) || []), s]);
    for (const s of slots) {
      const key = chaveColuna(s);
      const unica = (porArea.get(s.id_escala_area) || []).length === 1;
      const atual = cols.get(key);
      if (atual) {
        atual.comGente ||= s.membros.length > 0;
        atual.unica &&= unica;
        continue;
      }
      cols.set(key, {
        key,
        areaNome: s.areaNome,
        tipo: s.tipo,
        nome: s.tipo === "_geral" ? (unica ? s.areaNome : "Outros") : s.nome,
        comGente: s.membros.length > 0,
        unica,
      });
    }
  }
  // "_geral" ao lado de funções definidas só aparece se alguém está nele
  const lista = [...cols.values()].filter((c) => c.tipo !== "_geral" || c.unica || c.comGente);
  // Agrupa as colunas da mesma área lado a lado, mantendo a ordem de chegada
  const ordemArea: string[] = [];
  for (const c of lista) if (!ordemArea.includes(c.areaNome)) ordemArea.push(c.areaNome);
  return ordemArea.flatMap((a) =>
    lista
      .filter((c) => c.areaNome === a)
      .sort((x, y) => (x.tipo === "_geral" ? 1 : 0) - (y.tipo === "_geral" ? 1 : 0))
      .map(({ key, areaNome, tipo, nome }) => ({ key, areaNome, tipo, nome }))
  );
}

/** "Samuel" ou, se houver dois Samuéis no período, "Samuel A." e "Samuel S." */
function apelidos(eventos: EventoUnificado[]) {
  const porPrimeiro = new Map<string, Map<number, string>>();
  for (const ev of eventos)
    for (const s of Object.values(ev.instrumentos || {}))
      for (const m of s.membros) {
        const partes = m.usuario.nome.trim().split(/\s+/);
        const p = partes[0];
        if (!porPrimeiro.has(p)) porPrimeiro.set(p, new Map());
        porPrimeiro.get(p)!.set(m.usuario.id, m.usuario.nome);
      }
  const nomes = new Map<number, string>();
  for (const [primeiro, pessoas] of porPrimeiro) {
    for (const [id, completo] of pessoas) {
      if (pessoas.size === 1) nomes.set(id, primeiro);
      else {
        const partes = completo.trim().split(/\s+/);
        const ultimo = partes.length > 1 ? partes[partes.length - 1] : "";
        nomes.set(id, ultimo ? `${primeiro} ${ultimo[0].toUpperCase()}.` : primeiro);
      }
    }
  }
  return nomes;
}

/* ---------------------------------------------------------------- Nome arrastável */

function NomeArrastavel({
  membro,
  apelido,
  podeArrastar,
}: {
  membro: SlotMembro;
  apelido: string;
  podeArrastar: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pl-membro-${membro.membroEscalaId}`,
    data: { membro },
    disabled: !podeArrastar,
  });
  // Sem transform no original: quem segue o ponteiro é só o rótulo do DragOverlay (pequeno)
  return (
    <span
      ref={setNodeRef}
      className={`pl-nome${podeArrastar ? " pl-nome--arrastavel" : ""}${isDragging ? " pl-nome--origem" : ""}`}
      title={membro.usuario.nome}
      {...(podeArrastar ? { ...listeners, ...attributes, role: undefined, tabIndex: -1 } : {})}
    >
      {apelido}
    </span>
  );
}

/* ---------------------------------------------------------------- Célula */

interface CelulaProps {
  ev: EventoUnificado;
  col: Coluna;
  slot: SlotInstrumento | undefined;
  apelidos: Map<number, string>;
  podeEditar: boolean;
  selecionada: boolean;
  /** Ponto de entrada do Tab quando nada está selecionado */
  focavel: boolean;
  salvando: boolean;
  linha: number;
  coluna: number;
  onSelecionar: (linha: number, coluna: number, abrir: boolean) => void;
}

const Celula = React.memo(function Celula({
  ev,
  col,
  slot,
  apelidos: nomes,
  podeEditar,
  selecionada,
  focavel,
  salvando,
  linha,
  coluna,
  onSelecionar,
}: CelulaProps) {
  const editavel = !!slot && podeEditar && slot.podeGerenciar;
  const { setNodeRef, isOver, active } = useDroppable({
    id: `pl-cel-${ev.id}-${col.key}`,
    data: { eventoId: ev.id, slot },
    disabled: !editavel,
  });
  const membroAtivo = active?.data.current?.membro as SlotMembro | undefined;
  const mesmoLugar =
    !!membroAtivo && !!slot && membroAtivo.id_escala_area === slot.id_escala_area && membroAtivo.tipoSlot === slot.tipo;
  const lotado = !!slot && slot.limite != null && slot.membros.length >= slot.limite;

  return (
    <td
      ref={setNodeRef}
      role="gridcell"
      data-linha={linha}
      data-coluna={coluna}
      tabIndex={selecionada || focavel ? 0 : -1}
      aria-selected={selecionada}
      aria-label={`${col.nome}, ${ev.nome} ${ev.data.split("-").reverse().slice(0, 2).join("/")}: ${
        slot ? (slot.membros.map((m) => m.usuario.nome).join(", ") || "vazio") : "não se aplica"
      }`}
      className={[
        "pl-cel",
        !slot ? "pl-cel--na" : "",
        editavel ? "pl-cel--editavel" : "",
        selecionada ? "pl-cel--sel" : "",
        isOver && !mesmoLugar ? (lotado ? "pl-cel--drop-cheio" : "pl-cel--drop") : "",
        salvando ? "pl-cel--salvando" : "",
      ].join(" ")}
      onMouseDown={(e) => {
        // Arrastar um nome não deve abrir o editor
        if ((e.target as HTMLElement).closest(".pl-nome--arrastavel")) return;
        onSelecionar(linha, coluna, false);
      }}
      onClick={() => onSelecionar(linha, coluna, true)}
      onFocus={(e) => {
        if (!selecionada && e.target === e.currentTarget) onSelecionar(linha, coluna, false);
      }}
    >
      {!slot ? (
        <span className="pl-na" aria-hidden>
          •
        </span>
      ) : (
        <div className="pl-nomes">
          {slot.membros.map((m) => (
            <NomeArrastavel
              key={m.membroEscalaId}
              membro={m}
              apelido={nomes.get(m.usuario.id) || m.usuario.nome}
              podeArrastar={editavel}
            />
          ))}
          {slot.membros.length === 0 && editavel && <span className="pl-vazio">+</span>}
        </div>
      )}
    </td>
  );
});

/* ---------------------------------------------------------------- Editor (popover) */

function EditorCelula({
  anchor,
  ev,
  col,
  slot,
  carregarCandidatos,
  onAlternar,
  onFechar,
  onNavegar,
}: {
  anchor: HTMLElement;
  ev: EventoUnificado;
  col: Coluna;
  slot: SlotInstrumento;
  carregarCandidatos: (eventoId: number, areaNome: string) => Promise<UsuarioParaEscalar[]>;
  onAlternar: (idUsuario: number, nome: string, adicionar: boolean) => Promise<void>;
  onFechar: (refocar?: boolean) => void;
  onNavegar: (dir: "baixo" | "direita" | "esquerda") => void;
}) {
  const [busca, setBusca] = useState("");
  const [candidatos, setCandidatos] = useState<UsuarioParaEscalar[] | null>(null);
  const [destaque, setDestaque] = useState(0);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; acima: boolean }>({ top: 0, left: 0, acima: false });
  const caixaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let vivo = true;
    setCandidatos(null);
    carregarCandidatos(ev.id, slot.areaNome)
      .then((l) => vivo && setCandidatos(l))
      .catch(() => vivo && setCandidatos([]));
    return () => {
      vivo = false;
    };
  }, [ev.id, slot.areaNome, carregarCandidatos]);

  // Posição junto da célula (abre para cima se não couber embaixo)
  useLayoutEffect(() => {
    const posicionar = () => {
      const r = anchor.getBoundingClientRect();
      const largura = 280;
      const altura = caixaRef.current?.offsetHeight || 340;
      const cabeEmbaixo = r.bottom + altura + 8 < window.innerHeight;
      setPos({
        top: cabeEmbaixo ? r.bottom + 4 : Math.max(8, r.top - altura - 4),
        left: Math.min(Math.max(8, r.left), window.innerWidth - largura - 8),
        acima: !cabeEmbaixo,
      });
    };
    posicionar();
    window.addEventListener("resize", posicionar);
    window.addEventListener("scroll", posicionar, true);
    return () => {
      window.removeEventListener("resize", posicionar);
      window.removeEventListener("scroll", posicionar, true);
    };
  }, [anchor, candidatos]);

  // Clique fora fecha
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (caixaRef.current?.contains(alvo) || anchor.contains(alvo)) return;
      // Diálogo de conflito/confirmação por cima: não fecha
      if ((alvo as HTMLElement).closest?.('[role="dialog"], [role="alertdialog"], .modal-overlay')) return;
      onFechar(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [anchor, onFechar]);

  const idsNaCelula = new Set(slot.membros.map((m) => m.usuario.id));
  const termo = semAcento(busca.trim());
  const filtrados = (candidatos || [])
    .filter((c) => !idsNaCelula.has(c.id_usuario))
    .filter((c) => !termo || semAcento(c.nome).split(/\s+/).some((p) => p.startsWith(termo)) || semAcento(c.nome).includes(termo));

  useEffect(() => setDestaque(0), [busca]);
  useEffect(() => {
    listaRef.current?.querySelector(".pl-op--destaque")?.scrollIntoView({ block: "nearest" });
  }, [destaque]);

  const alternar = async (id: number, nome: string, adicionar: boolean) => {
    if (ocupado) return;
    setOcupado(id);
    try {
      await onAlternar(id, nome, adicionar);
      if (adicionar) setBusca("");
    } finally {
      setOcupado(null);
      inputRef.current?.focus();
    }
  };

  const tecla = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onFechar();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((d) => Math.min(d + 1, Math.max(0, filtrados.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const alvo = filtrados[destaque];
      if (busca.trim() && alvo) alternar(alvo.id_usuario, alvo.nome, true);
      else if (!busca.trim()) onNavegar("baixo");
    } else if (e.key === "Tab") {
      e.preventDefault();
      onNavegar(e.shiftKey ? "esquerda" : "direita");
    } else if (e.key === "Backspace" && !busca && slot.membros.length) {
      // Backspace com a busca vazia tira o último nome (como num campo de tags)
      e.preventDefault();
      const ultimo = slot.membros[slot.membros.length - 1];
      alternar(ultimo.usuario.id, ultimo.usuario.nome, false);
    }
  };

  const lotado = slot.limite != null && slot.membros.length >= slot.limite;
  const [, m, d] = ev.data.split("-");

  return createPortal(
    <div
      ref={caixaRef}
      className={`pl-editor${pos.acima ? " pl-editor--acima" : ""}`}
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-label={`Escalar ${col.nome} em ${ev.nome}`}
      data-planilha-editor=""
    >
      <div className="pl-editor__topo">
        <strong>{col.nome}</strong>
        <span>
          {ev.nome} · {d}/{m}
          {slot.limite != null && (
            <em className={lotado ? "pl-editor__lotado" : ""}>
              {" "}
              · {slot.membros.length}/{slot.limite}
            </em>
          )}
        </span>
      </div>

      {slot.membros.length > 0 && (
        <ul className="pl-editor__atuais" aria-label="Escalados nesta célula">
          {slot.membros.map((mb) => (
            <li key={mb.membroEscalaId}>
              <span>{mb.usuario.nome}</span>
              <button
                type="button"
                aria-label={`Tirar ${mb.usuario.nome}`}
                title="Tirar da escala"
                disabled={ocupado === mb.usuario.id}
                onClick={() => alternar(mb.usuario.id, mb.usuario.nome, false)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        autoFocus
        className="pl-editor__busca"
        placeholder={lotado ? "Função completa — digite para trocar" : "Digite um nome…"}
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={tecla}
        aria-label="Buscar pessoa"
        aria-controls="pl-editor-lista"
        aria-activedescendant={filtrados[destaque] ? `pl-op-${filtrados[destaque].id_usuario}` : undefined}
      />

      <ul ref={listaRef} id="pl-editor-lista" className="pl-editor__lista" role="listbox">
        {candidatos === null && <li className="pl-editor__info">Carregando pessoas…</li>}
        {candidatos !== null && filtrados.length === 0 && (
          <li className="pl-editor__info">
            {busca ? "Ninguém com esse nome neste ministério." : "Todas as pessoas do ministério já estão aqui."}
          </li>
        )}
        {filtrados.map((c, i) => (
          <li
            key={c.id_usuario}
            id={`pl-op-${c.id_usuario}`}
            role="option"
            aria-selected={i === destaque}
            className={`pl-op${i === destaque ? " pl-op--destaque" : ""}${c.ja_escalado ? " pl-op--ja" : ""}`}
            onMouseEnter={() => setDestaque(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => alternar(c.id_usuario, c.nome, true)}
          >
            <span className="pl-op__nome">{c.nome}</span>
            {c.ja_escalado && (
              <span className="pl-op__ja">
                já em {c.areas_no_evento?.length ? c.areas_no_evento.join(", ") : "outra função"}
              </span>
            )}
            {ocupado === c.id_usuario && <span className="pl-op__spinner" aria-label="Salvando" />}
          </li>
        ))}
      </ul>
      <p className="pl-editor__dica">
        <kbd>Enter</kbd> adiciona · <kbd>Tab</kbd> próxima coluna · <kbd>Esc</kbd> fecha
      </p>
    </div>,
    document.body
  );
}

/* ---------------------------------------------------------------- Planilha */

const EscalaPlanilha: React.FC<PlanilhaProps> = ({
  eventos,
  podeEditar,
  areasVisiveis = [],
  filtroEvento,
  onFiltroEvento,
  carregarCandidatos,
  onAdicionar,
  onRemover,
  onMover,
  onAbrirEvento,
  onAviso,
}) => {
  const hoje = hojeIso();

  const titulos = useMemo(() => {
    const cont = new Map<string, number>();
    for (const ev of eventos) cont.set(ev.nome, (cont.get(ev.nome) || 0) + 1);
    return [...cont.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [eventos]);

  // Colunas só dos ministérios escolhidos no filtro da barra (vazio = todas)
  const filtroAreas = useMemo(() => new Set(areasVisiveis.map((a) => a.trim().toLowerCase())), [areasVisiveis]);
  const filtrandoAreas = filtroAreas.size > 0;

  const linhas = useMemo(() => {
    return eventos
      .filter((ev) => !filtroEvento || ev.nome === filtroEvento)
      .map((ev) => {
        if (!filtrandoAreas) return ev;
        const inst: Record<string, SlotInstrumento> = {};
        for (const [k, s] of Object.entries(ev.instrumentos || {}))
          if (filtroAreas.has(s.areaNome.trim().toLowerCase())) inst[k] = s;
        return { ...ev, instrumentos: inst };
      })
      .filter((ev) => !filtrandoAreas || Object.keys(ev.instrumentos).length > 0);
  }, [eventos, filtroEvento, filtroAreas, filtrandoAreas]);

  const colunas = useMemo(() => montarColunas(linhas), [linhas]);
  const nomes = useMemo(() => apelidos(eventos), [eventos]);

  // Célula de cada (evento, coluna)
  const mapaSlots = useMemo(() => {
    const m = new Map<string, SlotInstrumento>();
    for (const ev of linhas)
      for (const s of Object.values(ev.instrumentos || {})) m.set(`${ev.id}|${chaveColuna(s)}`, s);
    return m;
  }, [linhas]);
  const slotDe = useCallback((evId: number, colKey: string) => mapaSlots.get(`${evId}|${colKey}`), [mapaSlots]);

  const grupos = useMemo(() => {
    const g: { area: string; span: number }[] = [];
    for (const c of colunas) {
      const ult = g[g.length - 1];
      if (ult && ult.area === c.areaNome) ult.span += 1;
      else g.push({ area: c.areaNome, span: 1 });
    }
    return g;
  }, [colunas]);
  const mostrarGrupos = grupos.length > 1 || (grupos[0] && colunas.length > 1);

  /* ---------- seleção e teclado ---------- */
  const [sel, setSel] = useState<{ l: number; c: number } | null>(null);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState<Set<string>>(() => new Set());
  const [areaTransf, setAreaTransf] = useState<{ ids: { id: number; nome: string }[] } | null>(null);
  const tabelaRef = useRef<HTMLDivElement>(null);

  const celulaEl = useCallback(
    (l: number, c: number) =>
      tabelaRef.current?.querySelector<HTMLElement>(`[data-linha="${l}"][data-coluna="${c}"]`) || null,
    []
  );

  // Seleção fora da grade quando os filtros mudam
  useEffect(() => {
    setSel((s) => (s && (s.l >= linhas.length || s.c >= colunas.length) ? null : s));
  }, [linhas.length, colunas.length]);

  const focar = useCallback(
    (l: number, c: number) => {
      requestAnimationFrame(() => {
        const el = celulaEl(l, c);
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    },
    [celulaEl]
  );

  const podeEditarCel = useCallback(
    (l: number, c: number) => {
      const ev = linhas[l];
      const col = colunas[c];
      const s = ev && col ? slotDe(ev.id, col.key) : undefined;
      return !!s && podeEditar && s.podeGerenciar;
    },
    [linhas, colunas, slotDe, podeEditar]
  );

  const selecionar = useCallback(
    (l: number, c: number, abrir: boolean) => {
      const mesma = !!sel && sel.l === l && sel.c === c;
      if (!mesma) setSel({ l, c });
      if (abrir) setEditando(podeEditarCel(l, c));
      else if (!mesma) {
        setEditando(false);
        focar(l, c);
      }
    },
    [sel, podeEditarCel, focar]
  );

  const mover = useCallback(
    (dl: number, dc: number, abrir = false) => {
      if (!linhas.length || !colunas.length) return;
      const base = sel || { l: 0, c: 0 };
      let l = base.l + dl;
      let c = base.c + dc;
      if (c >= colunas.length) {
        c = 0;
        l += 1;
      } else if (c < 0) {
        c = colunas.length - 1;
        l -= 1;
      }
      l = Math.max(0, Math.min(linhas.length - 1, l));
      c = Math.max(0, Math.min(colunas.length - 1, c));
      setSel({ l, c });
      setEditando(abrir && podeEditarCel(l, c));
      focar(l, c);
    },
    [sel, linhas.length, colunas.length, podeEditarCel, focar]
  );

  const chaveSalvando = (evId: number, colKey: string) => `${evId}|${colKey}`;
  const marcarSalvando = (k: string, on: boolean) =>
    setSalvando((prev) => {
      const n = new Set(prev);
      if (on) n.add(k);
      else n.delete(k);
      return n;
    });

  const colarEm = async (l: number, c: number) => {
    if (!areaTransf) return;
    const ev = linhas[l];
    const col = colunas[c];
    const s = slotDe(ev.id, col.key);
    if (!s || !podeEditarCel(l, c)) return;
    const ja = new Set(s.membros.map((m) => m.usuario.id));
    const novos = areaTransf.ids.filter((p) => !ja.has(p.id));
    if (!novos.length) {
      onAviso("Essas pessoas já estão nesta célula.");
      return;
    }
    const k = chaveSalvando(ev.id, col.key);
    marcarSalvando(k, true);
    try {
      let ok = 0;
      for (const p of novos) if (await onAdicionar(ev.id, s, p.id)) ok += 1;
      if (ok) onAviso(`${ok === 1 ? novos[0].nome : `${ok} pessoas`} colado${ok > 1 ? "s" : ""} em ${col.nome}.`, "success");
    } finally {
      marcarSalvando(k, false);
    }
  };

  const limpar = async (l: number, c: number) => {
    const ev = linhas[l];
    const col = colunas[c];
    const s = slotDe(ev.id, col.key);
    if (!s || !s.membros.length || !podeEditarCel(l, c)) return;
    const original = eventos.find((e) => e.id === ev.id) || ev;
    await onRemover(original, s.membros);
  };

  const teclaGrade = (e: React.KeyboardEvent) => {
    if (editando) return;
    if ((e.target as HTMLElement).closest("input, select, button")) return;
    const ctrl = e.ctrlKey || e.metaKey;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        mover(1, 0);
        return;
      case "ArrowUp":
        e.preventDefault();
        mover(-1, 0);
        return;
      case "ArrowRight":
        e.preventDefault();
        mover(0, 1);
        return;
      case "ArrowLeft":
        e.preventDefault();
        mover(0, -1);
        return;
      case "Tab":
        if (!sel) return;
        e.preventDefault();
        mover(0, e.shiftKey ? -1 : 1);
        return;
      case "Enter":
      case "F2":
        if (sel && podeEditarCel(sel.l, sel.c)) {
          e.preventDefault();
          setEditando(true);
        }
        return;
      case "Delete":
      case "Backspace":
        if (sel) {
          e.preventDefault();
          limpar(sel.l, sel.c);
        }
        return;
      default:
    }
    if (ctrl && e.key.toLowerCase() === "c" && sel) {
      const s = slotDe(linhas[sel.l].id, colunas[sel.c].key);
      if (s) {
        e.preventDefault();
        setAreaTransf({ ids: s.membros.map((m) => ({ id: m.usuario.id, nome: m.usuario.nome })) });
        onAviso(
          s.membros.length
            ? `Copiado: ${s.membros.map((m) => nomes.get(m.usuario.id) || m.usuario.nome).join(", ")}. Selecione outra célula e use Ctrl+V.`
            : "Célula vazia."
        );
      }
      return;
    }
    if (ctrl && e.key.toLowerCase() === "v" && sel) {
      e.preventDefault();
      colarEm(sel.l, sel.c);
      return;
    }
    // Começar a digitar um nome abre o editor (como numa planilha)
    if (!ctrl && !e.altKey && e.key.length === 1 && /\S/.test(e.key) && sel && podeEditarCel(sel.l, sel.c)) {
      setEditando(true);
    }
  };

  /* ---------- arrastar ---------- */
  const [arrastando, setArrastando] = useState<SlotMembro | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fimArrasto = async (e: DragEndEvent) => {
    setArrastando(null);
    const membro = e.active.data.current?.membro as SlotMembro | undefined;
    const dest = e.over?.data.current as { eventoId: number; slot?: SlotInstrumento } | undefined;
    if (!membro || !dest?.slot) return;
    if (membro.id_escala_area === dest.slot.id_escala_area && membro.tipoSlot === dest.slot.tipo) return;
    const k = chaveSalvando(dest.eventoId, chaveColuna(dest.slot));
    marcarSalvando(k, true);
    try {
      await onMover({
        membroEscalaOrigemId: membro.membroEscalaId,
        escalaDestinoId: dest.eventoId,
        instrumentoDestino: dest.slot.tipo,
        id_escala_area: dest.slot.id_escala_area,
      });
    } finally {
      marcarSalvando(k, false);
    }
  };

  /* ---------- editor ---------- */
  const celSel = sel && linhas[sel.l] && colunas[sel.c] ? { ev: linhas[sel.l], col: colunas[sel.c] } : null;
  const slotSel = celSel ? slotDe(celSel.ev.id, celSel.col.key) : undefined;
  const ancora = editando && sel ? celulaEl(sel.l, sel.c) : null;

  const fecharEditor = useCallback(
    (refocar = true) => {
      setEditando(false);
      if (refocar && sel) focar(sel.l, sel.c);
    },
    [sel, focar]
  );

  const alternarPessoa = async (idUsuario: number, nome: string, adicionar: boolean) => {
    if (!celSel || !slotSel) return;
    const k = chaveSalvando(celSel.ev.id, celSel.col.key);
    marcarSalvando(k, true);
    try {
      if (adicionar) {
        await onAdicionar(celSel.ev.id, slotSel, idUsuario);
      } else {
        const m = slotSel.membros.find((x) => x.usuario.id === idUsuario);
        const original = eventos.find((e) => e.id === celSel.ev.id) || celSel.ev;
        if (m) await onRemover(original, [m]);
      }
    } catch {
      onAviso(`Não foi possível ${adicionar ? "escalar" : "tirar"} ${nome}.`, "error");
    } finally {
      marcarSalvando(k, false);
    }
  };

  /* ---------- render ---------- */
  let mesAnterior = "";
  const totalPreenchidas = colunas.length
    ? linhas.reduce((n, ev) => n + colunas.filter((c) => (slotDe(ev.id, c.key)?.membros.length || 0) > 0).length, 0)
    : 0;
  const totalCelulas = linhas.reduce((n, ev) => n + colunas.filter((c) => slotDe(ev.id, c.key)).length, 0);

  return (
    <section className="pl" aria-label="Escala em planilha">
      <div className="pl-filtros">
        {titulos.length > 1 && (
          <label className="pl-filtro-evento">
            <span>Eventos</span>
            <select value={filtroEvento} onChange={(e) => onFiltroEvento(e.target.value)}>
              <option value="">Todos ({eventos.length})</option>
              {titulos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {linhas.length === 0 ? (
        <p className="pl-vazio-tudo">
          {eventos.length === 0
            ? "Nenhum evento neste período. Crie os eventos (ou use “Copiar semana”) e volte aqui para preencher."
            : "Nenhum evento com esse filtro."}
        </p>
      ) : (
        <>
          <p className="pl-resumo">
            {linhas.length} {linhas.length === 1 ? "evento" : "eventos"} · {totalPreenchidas} de {totalCelulas} funções
            preenchidas
            {podeEditar && (
              <span className="pl-resumo__dica">
                {" "}
                · Clique numa célula e digite o nome. Arraste um nome para trocar de data ou função. Ctrl+C / Ctrl+V copia
                entre células.
              </span>
            )}
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={(e) => {
              setEditando(false);
              setArrastando((e.active.data.current?.membro as SlotMembro) || null);
            }}
            onDragEnd={fimArrasto}
            onDragCancel={() => setArrastando(null)}
            autoScroll={{ threshold: { x: 0.15, y: 0.15 } }}
          >
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div className="pl-rolagem" ref={tabelaRef} onKeyDown={teclaGrade}>
              <table className="pl-tabela" role="grid" aria-rowcount={linhas.length} aria-colcount={colunas.length + 1}>
                <thead>
                  {mostrarGrupos && (
                    <tr className="pl-grupos">
                      <th className="pl-canto" aria-hidden />
                      {grupos.map((g, i) => (
                        <th key={`${g.area}-${i}`} colSpan={g.span} scope="colgroup">
                          {g.area}
                        </th>
                      ))}
                    </tr>
                  )}
                  <tr className="pl-cabecalho">
                    <th className="pl-canto" scope="col">
                      Data
                    </th>
                    {colunas.map((c) => (
                      <th key={c.key} scope="col" title={`${c.areaNome} · ${c.nome}`}>
                        {c.nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((ev, l) => {
                    const [ano, mm, dd] = ev.data.split("-").map(Number);
                    const chaveMes = `${ano}-${mm}`;
                    const novoMes = chaveMes !== mesAnterior;
                    mesAnterior = chaveMes;
                    const dia = new Date(ano, mm - 1, dd).getDay();
                    const passado = ev.data < hoje;
                    return (
                      <React.Fragment key={ev.id}>
                        {novoMes && (
                          <tr className="pl-mes">
                            <th colSpan={colunas.length + 1} scope="rowgroup">
                              <span>
                                {MESES[mm - 1]} {ano}
                              </span>
                            </th>
                          </tr>
                        )}
                        <tr
                          className={`pl-linha${l % 2 ? " pl-linha--par" : ""}${passado ? " pl-linha--passada" : ""}${
                            ev.data === hoje ? " pl-linha--hoje" : ""
                          }`}
                        >
                          <th scope="row" className="pl-data">
                            <button type="button" onClick={() => onAbrirEvento(ev.id)} title="Abrir o evento">
                              <span className="pl-data__dia">
                                {dd}-{MESES_CURTOS[mm - 1]}
                                <small>
                                  {DIAS_CURTOS[dia]}
                                  {ev.horaInicio ? ` ${ev.horaInicio.slice(0, 5)}` : ""}
                                </small>
                              </span>
                              {(titulos.length > 1 && !filtroEvento) || ev.status === "rascunho" ? (
                                <span className="pl-data__evento">
                                  {titulos.length > 1 && !filtroEvento && ev.nome}
                                  {ev.status === "rascunho" && <em className="pl-rascunho">rascunho</em>}
                                </span>
                              ) : null}
                            </button>
                          </th>
                          {colunas.map((col, c) => (
                            <Celula
                              key={col.key}
                              ev={ev}
                              col={col}
                              slot={slotDe(ev.id, col.key)}
                              apelidos={nomes}
                              podeEditar={podeEditar}
                              selecionada={!!sel && sel.l === l && sel.c === c}
                              focavel={!sel && l === 0 && c === 0}
                              salvando={salvando.has(chaveSalvando(ev.id, col.key))}
                              linha={l}
                              coluna={c}
                              onSelecionar={selecionar}
                            />
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {createPortal(
              <DragOverlay dropAnimation={null} modifiers={[centralizarNoCursor]} style={estiloOverlay}>
                {arrastando ? (
                  <span className="pl-nome pl-nome--voando">
                    {nomes.get(arrastando.usuario.id) || arrastando.usuario.nome}
                  </span>
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </>
      )}

      {editando && ancora && celSel && slotSel && (
        <EditorCelula
          key={`${celSel.ev.id}-${celSel.col.key}`}
          anchor={ancora}
          ev={celSel.ev}
          col={celSel.col}
          slot={slotSel}
          carregarCandidatos={carregarCandidatos}
          onAlternar={alternarPessoa}
          onFechar={fecharEditor}
          onNavegar={(dir) => {
            if (dir === "baixo") mover(1, 0, false);
            else mover(0, dir === "direita" ? 1 : -1, true);
          }}
        />
      )}
    </section>
  );
};

export default EscalaPlanilha;
