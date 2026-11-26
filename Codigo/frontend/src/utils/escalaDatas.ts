/**
 * Datas e textos das visões da Escala (dia, semana, mês, ano).
 * Tudo em data local (Brasília) no formato "AAAA-MM-DD", sem passar por UTC.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** Date → "AAAA-MM-DD" (data local) */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "AAAA-MM-DD" → Date ao meio-dia (evita pular de dia por fuso/horário de verão) */
export function deIso(data: string): Date {
  return new Date(`${data.slice(0, 10)}T12:00:00`);
}

export function somarDias(data: string, dias: number): string {
  const d = deIso(data);
  d.setDate(d.getDate() + dias);
  return toIsoDate(d);
}

/** Domingo da semana da data (o calendário começa no domingo) */
export function inicioSemana(data: string | Date): string {
  const d = typeof data === "string" ? deIso(data) : new Date(data);
  d.setDate(d.getDate() - d.getDay());
  return toIsoDate(d);
}

/**
 * Data de referência compartilhada pelas visões: ao trocar de Mês para Dia/Semana
 * (e vice-versa) todas mostram o mesmo período.
 */
export interface ReferenciaEscala {
  ano: number;
  mes: number; // 1–12
  dataDia: string;
  dataSemana: string;
}

export function referenciaDe(data: string): ReferenciaEscala {
  const d = deIso(data);
  return {
    ano: d.getFullYear(),
    mes: d.getMonth() + 1,
    dataDia: toIsoDate(d),
    dataSemana: inicioSemana(d),
  };
}

/** Ao ir para um mês: hoje se for o mês atual, senão o dia 1 */
export function dataDoMes(ano: number, mes: number, hoje: Date = new Date()): string {
  if (hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes) return toIsoDate(hoje);
  return `${ano}-${pad(mes)}-01`;
}

const STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  concluida: "Concluída",
};

export function rotuloStatus(status?: string | null): string {
  if (!status) return "";
  return STATUS[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/** plural(1, "evento") → "1 evento"; plural(3, "pessoa") → "3 pessoas" */
export function plural(n: number, singular: string, pluralForma?: string): string {
  return `${n} ${n === 1 ? singular : pluralForma || `${singular}s`}`;
}

/** "31975472748" → "(31) 97547-2748" (10 ou 11 dígitos); outros formatos ficam como vieram */
export function formatarTelefone(tel?: string | null): string {
  const d = String(tel || "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(tel || "");
}

/** Evento que termina depois da meia-noite (ex.: vigília 23:30 – 02:00) */
export function terminaNoDiaSeguinte(horaInicio?: string | null, horaFim?: string | null): boolean {
  if (!horaInicio || !horaFim) return false;
  return horaFim.slice(0, 5) < horaInicio.slice(0, 5);
}

/** "19:00 – 21:00", "23:30 – 02:00 (dia seguinte)", "19:00" */
export function faixaHorario(horaInicio?: string | null, horaFim?: string | null): string {
  const ini = (horaInicio || "").slice(0, 5);
  const fim = (horaFim || "").slice(0, 5);
  if (!ini) return "";
  if (!fim) return ini;
  return `${ini} – ${fim}${terminaNoDiaSeguinte(ini, fim) ? " (dia seguinte)" : ""}`;
}
