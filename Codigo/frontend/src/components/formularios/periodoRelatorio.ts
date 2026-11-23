/** Atalhos de período do relatório de formulários, conforme a frequência */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function deIso(s: string): Date {
  const [a, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d, 12);
}

export interface Atalho {
  id: string;
  rotulo: string;
  inicio: string;
  fim: string;
}

/** O primeiro atalho é o padrão da frequência */
export function atalhosDoPeriodo(frequencia: string, hoje = new Date()): Atalho[] {
  const fim = isoLocal(hoje);
  const domingo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay(), 12);
  const semanas = (n: number): Atalho => {
    const d = new Date(domingo);
    d.setDate(d.getDate() - 7 * (n - 1));
    return { id: `s${n}`, rotulo: `Últimas ${n} semanas`, inicio: isoLocal(d), fim };
  };
  const meses = (n: number): Atalho => ({
    id: `m${n}`,
    rotulo: `Últimos ${n} meses`,
    inicio: isoLocal(new Date(hoje.getFullYear(), hoje.getMonth() - (n - 1), 1, 12)),
    fim,
  });
  const esteMes: Atalho = {
    id: "este-mes",
    rotulo: "Este mês",
    inicio: isoLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12)),
    fim,
  };
  const mesPassado: Atalho = {
    id: "mes-passado",
    rotulo: "Mês passado",
    inicio: isoLocal(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1, 12)),
    fim: isoLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 0, 12)),
  };
  const esteAno: Atalho = {
    id: "este-ano",
    rotulo: "Este ano",
    inicio: isoLocal(new Date(hoje.getFullYear(), 0, 1, 12)),
    fim,
  };

  switch (frequencia) {
    case "semanal":
      return [semanas(4), semanas(8), esteMes, mesPassado];
    case "quinzenal":
      return [meses(2), meses(3), meses(6)];
    case "mensal":
      return [meses(3), meses(6), esteAno];
    case "bimestral":
      return [meses(6), esteAno, meses(12)];
    default:
      return [esteMes, mesPassado, meses(3)];
  }
}

/** "Número de presentes" -> "presentes" */
export function rotuloCurto(label: string): string {
  return label.replace(/^(número|numero|quantidade|qtd\.?|total) de /i, "").toLowerCase();
}

/** "1 visitantes" -> "1 visitante" (só tira o "s" final quando o valor é 1) */
export function singularSeUm(rotulo: string, valor: string | number | null): string {
  return Number(String(valor ?? "").replace(",", ".")) === 1 ? rotulo.replace(/s$/, "") : rotulo;
}

/** "11 nov" */
export function formatarDiaMes(iso: string): string {
  const d = deIso(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** "hoje", "ontem", "há 12 dias" */
export function haQuantoTempo(iso: string, hoje = new Date()): string {
  const a = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12);
  const dias = Math.round((a.getTime() - deIso(iso).getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}
