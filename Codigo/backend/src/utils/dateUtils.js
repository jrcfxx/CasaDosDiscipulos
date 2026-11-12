/**
 * Utilitários de data para MySQL / escala
 */

/**
 * Horários da escala são "de parede" (horário de Brasília), sem fuso.
 * O processo Node roda com TZ=America/Sao_Paulo e o MySQL devolve DATETIME
 * como Date no fuso local; por isso Date é sempre formatado com getters locais
 * (nunca toISOString, que converteria para UTC).
 */
const pad2 = (n) => String(n).padStart(2, "0");

/** Date → "YYYY-MM-DD HH:mm:ss" no fuso local do processo */
export function formatarDatetimeLocal(value) {
  if (!value) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  );
}

/** Converte data para formato MySQL DATETIME (YYYY-MM-DD HH:mm:ss) — preserva hora local */
export function toMysqlDatetime(value) {
  if (!value) return value;
  if (value instanceof Date) return formatarDatetimeLocal(value);
  const s = String(value).trim();
  // Texto sem fuso ("2026-11-20 19:00" / "2026-11-20T19:00") já é horário de parede
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
  const m = s.replace("T", " ").match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?/);
  if (m && !temFuso) return `${m[1]} ${m[2]}:${m[3]}:00`;
  return formatarDatetimeLocal(new Date(s));
}

/** Formata data/hora para exibição pt-BR */
export function formatarDataHoraPtBr(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Início do dia (YYYY-MM-DD 00:00:00) */
export function inicioDoDia(dataStr) {
  const d = String(dataStr).slice(0, 10);
  return `${d} 00:00:00`;
}

/** Fim do dia (YYYY-MM-DD 23:59:59) */
export function fimDoDia(dataStr) {
  const d = String(dataStr).slice(0, 10);
  return `${d} 23:59:59`;
}

/** Adiciona dias a uma data YYYY-MM-DD */
export function adicionarDias(dataStr, dias) {
  const d = new Date(`${String(dataStr).slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Desloca um datetime MySQL por delta de milissegundos */
export function deslocarDatetime(value, deltaMs) {
  const t = new Date(value).getTime() + deltaMs;
  return toMysqlDatetime(new Date(t));
}
