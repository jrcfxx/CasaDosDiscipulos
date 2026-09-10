/**
 * Utilitários de data para MySQL / escala
 */

/** Converte data para formato MySQL DATETIME (YYYY-MM-DD HH:mm:ss) — preserva hora local */
export function toMysqlDatetime(value) {
  if (!value) return value;
  const s = String(value).trim().replace("T", " ");
  const m = s.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?/);
  if (m) return `${m[1]} ${m[2]}:${m[3]}:00`.slice(0, 19);
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 19).replace("T", " ");
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
