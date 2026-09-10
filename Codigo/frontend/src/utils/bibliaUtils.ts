/**
 * Utilitários para referência bíblica em português
 * e busca de texto via API pública (bolls.life).
 */

export interface ReferenciaBiblica {
  livroNome: string;
  livroNumero: number;
  capitulo: number;
  versoInicio: number;
  versoFim: number;
  raw: string;
}

export interface VersiculoTexto {
  numero: number;
  texto: string;
}

export interface VersiculoResultado {
  referencia: string;
  versao: string;
  versiculos: VersiculoTexto[];
  textoCompleto: string;
}

/** Ordem canônica (1–66) usada pela API bolls.life */
const LIVROS: Array<{ num: number; nomes: string[] }> = [
  { num: 1, nomes: ["genesis", "gênesis", "gen", "gn"] },
  { num: 2, nomes: ["exodo", "êxodo", "ex", "exod"] },
  { num: 3, nomes: ["levitico", "levítico", "lv", "lev"] },
  { num: 4, nomes: ["numeros", "números", "nm", "num"] },
  { num: 5, nomes: ["deuteronomio", "deuteronômio", "dt", "deut"] },
  { num: 6, nomes: ["josue", "josué", "js", "jos"] },
  { num: 7, nomes: ["juizes", "juízes", "jz", "juiz"] },
  { num: 8, nomes: ["rute", "rt", "rut"] },
  { num: 9, nomes: ["1 samuel", "i samuel", "1sm", "1 sm", "1samuel"] },
  { num: 10, nomes: ["2 samuel", "ii samuel", "2sm", "2 sm", "2samuel"] },
  { num: 11, nomes: ["1 reis", "i reis", "1rs", "1 rs", "1reis"] },
  { num: 12, nomes: ["2 reis", "ii reis", "2rs", "2 rs", "2reis"] },
  { num: 13, nomes: ["1 cronicas", "1 crônicas", "i cronicas", "1cr", "1 cr"] },
  { num: 14, nomes: ["2 cronicas", "2 crônicas", "ii cronicas", "2cr", "2 cr"] },
  { num: 15, nomes: ["esdras", "ed", "esd"] },
  { num: 16, nomes: ["neemias", "ne", "nee"] },
  { num: 17, nomes: ["ester", "et", "est"] },
  { num: 18, nomes: ["jo", "jó"] },
  { num: 19, nomes: ["salmos", "salmo", "sl", "ps", "psalmos"] },
  { num: 20, nomes: ["proverbios", "provérbios", "pv", "prov"] },
  { num: 21, nomes: ["eclesiastes", "ec", "ecl"] },
  { num: 22, nomes: ["cantares", "cantico", "cântico", "ct", "canticos"] },
  { num: 23, nomes: ["isaias", "isaías", "is", "isa"] },
  { num: 24, nomes: ["jeremias", "jr", "jer"] },
  { num: 25, nomes: ["lamentacoes", "lamentações", "lm", "lam"] },
  { num: 26, nomes: ["ezequiel", "ez", "eze"] },
  { num: 27, nomes: ["daniel", "dn", "dan"] },
  { num: 28, nomes: ["oseias", "oséias", "os", "ose"] },
  { num: 29, nomes: ["joel", "jl"] },
  { num: 30, nomes: ["amos", "amós", "am"] },
  { num: 31, nomes: ["obadias", "ob"] },
  { num: 32, nomes: ["jonas", "jonás", "jn", "jon"] },
  { num: 33, nomes: ["miqueias", "mq", "miq"] },
  { num: 34, nomes: ["naum", "na"] },
  { num: 35, nomes: ["habacuque", "hc", "hab"] },
  { num: 36, nomes: ["sofonias", "sf", "sof"] },
  { num: 37, nomes: ["ageu", "ag"] },
  { num: 38, nomes: ["zacarias", "zc", "zac"] },
  { num: 39, nomes: ["malaquias", "ml", "mal"] },
  { num: 40, nomes: ["mateus", "mt", "mat"] },
  { num: 41, nomes: ["marcos", "mc", "mar"] },
  { num: 42, nomes: ["lucas", "lc", "luc"] },
  { num: 43, nomes: ["joao", "joão"] },
  { num: 44, nomes: ["atos", "at", "atos dos apostolos"] },
  { num: 45, nomes: ["romanos", "rm", "rom"] },
  { num: 46, nomes: ["1 corintios", "1 coríntios", "i corintios", "1co", "1 co"] },
  { num: 47, nomes: ["2 corintios", "2 coríntios", "ii corintios", "2co", "2 co"] },
  { num: 48, nomes: ["galatas", "gálatas", "gl", "gal"] },
  { num: 49, nomes: ["efesios", "efésios", "ef", "efe"] },
  { num: 50, nomes: ["filipenses", "fp", "fil"] },
  { num: 51, nomes: ["colossenses", "cl", "col"] },
  { num: 52, nomes: ["1 tessalonicenses", "i tessalonicenses", "1ts", "1 ts"] },
  { num: 53, nomes: ["2 tessalonicenses", "ii tessalonicenses", "2ts", "2 ts"] },
  { num: 54, nomes: ["1 timoteo", "1 timóteo", "i timoteo", "1tm", "1 tm"] },
  { num: 55, nomes: ["2 timoteo", "2 timóteo", "ii timoteo", "2tm", "2 tm"] },
  { num: 56, nomes: ["tito", "tt"] },
  { num: 57, nomes: ["filemom", "fm", "flm"] },
  { num: 58, nomes: ["hebreus", "hb", "heb"] },
  { num: 59, nomes: ["tiago", "tg", "tia"] },
  { num: 60, nomes: ["1 pedro", "i pedro", "1pe", "1 pe"] },
  { num: 61, nomes: ["2 pedro", "ii pedro", "2pe", "2 pe"] },
  { num: 62, nomes: ["1 joao", "1 joão", "i joao", "1jo", "1 jo"] },
  { num: 63, nomes: ["2 joao", "2 joão", "ii joao", "2jo", "2 jo"] },
  { num: 64, nomes: ["3 joao", "3 joão", "iii joao", "3jo", "3 jo"] },
  { num: 65, nomes: ["judas", "jd"] },
  { num: 66, nomes: ["apocalipse", "ap", "apoc"] },
];

const NOMES_CANONICOS: Record<number, string> = {
  1: "Gênesis", 2: "Êxodo", 3: "Levítico", 4: "Números", 5: "Deuteronômio",
  6: "Josué", 7: "Juízes", 8: "Rute", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Reis", 12: "2 Reis", 13: "1 Crônicas", 14: "2 Crônicas", 15: "Esdras",
  16: "Neemias", 17: "Ester", 18: "Jó", 19: "Salmos", 20: "Provérbios",
  21: "Eclesiastes", 22: "Cânticos", 23: "Isaías", 24: "Jeremias", 25: "Lamentações",
  26: "Ezequiel", 27: "Daniel", 28: "Oséias", 29: "Joel", 30: "Amós",
  31: "Obadias", 32: "Jonas", 33: "Miquéias", 34: "Naum", 35: "Habacuque",
  36: "Sofonias", 37: "Ageu", 38: "Zacarias", 39: "Malaquias", 40: "Mateus",
  41: "Marcos", 42: "Lucas", 43: "João", 44: "Atos", 45: "Romanos",
  46: "1 Coríntios", 47: "2 Coríntios", 48: "Gálatas", 49: "Efésios", 50: "Filipenses",
  51: "Colossenses", 52: "1 Tessalonicenses", 53: "2 Tessalonicenses", 54: "1 Timóteo",
  55: "2 Timóteo", 56: "Tito", 57: "Filemom", 58: "Hebreus", 59: "Tiago",
  60: "1 Pedro", 61: "2 Pedro", 62: "1 João", 63: "2 João", 64: "3 João",
  65: "Judas", 66: "Apocalipse",
};

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function encontrarLivro(trecho: string): { num: number; nome: string } | null {
  const n = normalizar(trecho);
  // Prioriza nomes mais longos (ex.: "1 joao" antes de "joao")
  let melhor: { num: number; len: number } | null = null;
  for (const livro of LIVROS) {
    for (const alias of livro.nomes) {
      const a = normalizar(alias);
      if (n === a || n.startsWith(a + " ") || n.endsWith(" " + a) || n.includes(" " + a + " ")) {
        if (!melhor || a.length > melhor.len) {
          melhor = { num: livro.num, len: a.length };
        }
      }
      if (n === a && (!melhor || a.length >= melhor.len)) {
        melhor = { num: livro.num, len: a.length };
      }
    }
  }
  // Match por início do nome do livro no texto completo
  if (!melhor) {
    for (const livro of LIVROS) {
      for (const alias of livro.nomes) {
        const a = normalizar(alias);
        if (n.startsWith(a)) {
          if (!melhor || a.length > melhor.len) {
            melhor = { num: livro.num, len: a.length };
          }
        }
      }
    }
  }
  if (!melhor) return null;
  return { num: melhor.num, nome: NOMES_CANONICOS[melhor.num] };
}

/**
 * Interpreta referências como:
 * - "Salmos 23:1"
 * - "João 3:16"
 * - "1 Coríntios 13:4-7"
 * - "Salmos 23" (capítulo inteiro — busca 1–5 por padrão limitado no service)
 */
export function parseReferenciaBiblica(input: string): ReferenciaBiblica | null {
  const raw = input.trim();
  if (!raw || raw.length < 3) return null;

  // Captura: (livro) (capítulo)[:verso[-versoFim]]
  const m = raw.match(
    /^(.+?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?\s*$/i
  );
  if (!m) return null;

  const livro = encontrarLivro(m[1]);
  if (!livro) return null;

  const capitulo = parseInt(m[2], 10);
  const versoInicio = m[3] ? parseInt(m[3], 10) : 1;
  const versoFim = m[4] ? parseInt(m[4], 10) : m[3] ? versoInicio : versoInicio;

  if (!capitulo || !versoInicio || versoFim < versoInicio) return null;

  return {
    livroNome: livro.nome,
    livroNumero: livro.num,
    capitulo,
    versoInicio,
    versoFim: Math.min(versoFim, versoInicio + 20), // limite de segurança
    raw,
  };
}

function limparHtml(texto: string): string {
  return texto
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const VERSAO_PADRAO = "NVIPT";
const VERSAO_LABEL = "NVI";

export async function buscarVersiculo(
  referenciaTexto: string,
  signal?: AbortSignal
): Promise<VersiculoResultado | null> {
  const parsed = parseReferenciaBiblica(referenciaTexto);
  if (!parsed) return null;

  const { livroNumero, capitulo, versoInicio, versoFim, livroNome } = parsed;

  // Capítulo completo (sem verso): busca capítulo e pega primeiros versos
  const semVersoExplicito = !/:\d/.test(referenciaTexto);

  const url = `https://bolls.life/get-text/${VERSAO_PADRAO}/${livroNumero}/${capitulo}/`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error("Não foi possível buscar o versículo");
  }

  const data = (await res.json()) as Array<{ verse: number; text: string }>;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Versículo não encontrado");
  }

  let inicio = versoInicio;
  let fim = versoFim;
  if (semVersoExplicito) {
    inicio = 1;
    fim = Math.min(3, data.length);
  }

  const selecionados = data
    .filter((v) => v.verse >= inicio && v.verse <= fim)
    .map((v) => ({
      numero: v.verse,
      texto: limparHtml(v.text),
    }));

  if (selecionados.length === 0) {
    throw new Error("Versículo não encontrado neste capítulo");
  }

  const refFmt =
    selecionados.length === 1
      ? `${livroNome} ${capitulo}:${selecionados[0].numero}`
      : `${livroNome} ${capitulo}:${selecionados[0].numero}-${selecionados[selecionados.length - 1].numero}`;

  const textoCompleto = selecionados.map((v) => v.texto).join(" ");

  return {
    referencia: refFmt,
    versao: VERSAO_LABEL,
    versiculos: selecionados,
    textoCompleto,
  };
}

export function formatarVersiculoParaConteudo(resultado: VersiculoResultado): string {
  const corpo =
    resultado.versiculos.length === 1
      ? `“${resultado.versiculos[0].texto}”`
      : resultado.versiculos
          .map((v) => `${v.numero} “${v.texto}”`)
          .join("\n");

  return `${corpo}\n— ${resultado.referencia} (${resultado.versao})`;
}
