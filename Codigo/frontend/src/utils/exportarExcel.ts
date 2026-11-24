/**
 * Exportação para Excel (.xlsx) dos relatórios do sistema.
 * A biblioteca (exceljs) só é baixada quando alguém clica em "Exportar Excel".
 */

export type TipoColuna = "texto" | "numero" | "data" | "percentual";

export interface ColunaExcel<T> {
  titulo: string;
  valor: (linha: T) => string | number | Date | null | undefined;
  tipo?: TipoColuna;
  /** Largura em caracteres; sem ela, ajusta pelo conteúdo */
  largura?: number;
}

export interface AbaExcel<T = unknown> {
  nome: string;
  colunas: ColunaExcel<T>[];
  linhas: T[];
  /** Linhas de texto acima da tabela (título, período, filtros) */
  cabecalho?: string[];
}

const PETROLEO = "FF00444C";

/** Nome de aba válido no Excel: até 31 caracteres, sem : \ / ? * [ ] */
export function nomeDeAba(nome: string, usados: Set<string>): string {
  let base = nome.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "Planilha";
  let n = 2;
  let final = base;
  while (usados.has(final.toLowerCase())) {
    const sufixo = ` (${n++})`;
    final = base.slice(0, 31 - sufixo.length) + sufixo;
  }
  usados.add(final.toLowerCase());
  base = final;
  return base;
}

/** Nome de arquivo seguro: "Relatório de Célula – nov 2026.xlsx" */
export function nomeDeArquivo(nome: string, extensao: string): string {
  const limpo = nome.replace(/[<>:"/\\|?*]+/g, " ").replace(/\s+/g, " ").trim() || "relatorio";
  return `${limpo}.${extensao}`;
}

/** "2026-11-23" -> Date (meia-noite local) para o Excel tratar como data */
function comoData(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    if (v.length > 10) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    const [a, m, d] = v.split("-").map(Number);
    return new Date(a, m - 1, d);
  }
  return null;
}

function comoNumero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Valor da célula conforme o tipo da coluna (números e datas viram números/datas de verdade no Excel) */
export function valorDaCelula(v: unknown, tipo: TipoColuna = "texto"): string | number | Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (tipo === "numero" || tipo === "percentual") return comoNumero(v) ?? String(v);
  if (tipo === "data") return comoData(v) ?? String(v);
  return String(v);
}

export async function exportarExcel(nomeArquivo: string, abas: AbaExcel<never>[] | AbaExcel<unknown>[]): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Casa dos Discípulos";
  wb.created = new Date();
  const usados = new Set<string>();

  for (const aba of abas as AbaExcel<unknown>[]) {
    const ws = wb.addWorksheet(nomeDeAba(aba.nome, usados));
    let linhaTitulo = 1;
    for (const [i, texto] of (aba.cabecalho || []).entries()) {
      const r = ws.getRow(i + 1);
      r.getCell(1).value = texto;
      r.font = i === 0 ? { bold: true, size: 14, color: { argb: PETROLEO } } : { color: { argb: "FF5F6668" } };
      linhaTitulo = i + 3; // uma linha em branco antes da tabela
    }

    const cab = ws.getRow(linhaTitulo);
    aba.colunas.forEach((c, i) => {
      const cel = cab.getCell(i + 1);
      cel.value = c.titulo;
      cel.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PETROLEO } };
      cel.alignment = { vertical: "middle", wrapText: true };
    });
    cab.height = 22;

    aba.linhas.forEach((linha, li) => {
      const r = ws.getRow(linhaTitulo + 1 + li);
      aba.colunas.forEach((c, ci) => {
        const cel = r.getCell(ci + 1);
        cel.value = valorDaCelula(c.valor(linha), c.tipo);
        if (c.tipo === "data" && cel.value instanceof Date) {
          cel.numFmt = (c.valor(linha) as string)?.length > 10 ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy";
        }
        if (c.tipo === "percentual" && typeof cel.value === "number") cel.numFmt = '0"%"';
        cel.alignment = { vertical: "top", wrapText: c.tipo === "texto" || !c.tipo };
      });
    });

    // Largura: a pedida, ou pelo maior conteúdo (entre 8 e 60 caracteres)
    aba.colunas.forEach((c, ci) => {
      if (c.largura) {
        ws.getColumn(ci + 1).width = c.largura;
        return;
      }
      const maior = aba.linhas.reduce<number>((m, l) => {
        const v = c.valor(l);
        const t = v instanceof Date ? 10 : String(v ?? "").length;
        return Math.max(m, t);
      }, c.titulo.length);
      ws.getColumn(ci + 1).width = Math.min(60, Math.max(8, maior + 2));
    });

    // Cabeçalho fixo ao rolar e filtro em cada coluna
    ws.views = [{ state: "frozen", ySplit: linhaTitulo }];
    if (aba.colunas.length && aba.linhas.length) {
      ws.autoFilter = {
        from: { row: linhaTitulo, column: 1 },
        to: { row: linhaTitulo + aba.linhas.length, column: aba.colunas.length },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  baixar(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    nomeDeArquivo(nomeArquivo, "xlsx")
  );
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
