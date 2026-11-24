/**
 * "Exportar PDF" das telas visuais (escala, mapa, organograma, relatórios): gera e baixa um
 * arquivo .pdf de verdade.
 *
 * Como funciona:
 *  1. aplica na página o layout limpo da impressão (as regras @media print do site: sem menus,
 *     botões e flutuantes) e "abre" as caixas que rolam de lado, para nada ser cortado nas laterais;
 *  2. fotografa o conteúdo (#main-content) com html-to-image (SVG: o próprio navegador desenha o
 *     texto, então a fonte da marca sai igual à tela);
 *  3. escolhe retrato ou paisagem e o tamanho que usam menos páginas com texto legível, e divide em
 *     páginas A4 só em alturas que não atravessam nenhum cartão, linha ou dia.
 * Um aviso cobre a tela enquanto isso. As bibliotecas só são baixadas no clique.
 */

import logoCasa from "../assets/logo_casa.png";

export interface OpcoesPdf {
  /** Orientação preferida em caso de empate (a escolha final é a que usa menos páginas) */
  paisagem?: boolean;
  /** Elemento a exportar (padrão: o conteúdo principal da página) */
  alvo?: HTMLElement | null;
}

/** Blocos que não podem ser cortados no meio (só os mais internos contam; ver blocosFolha) */
const BLOCOS_INTEIROS = [
  "tr",
  "li",
  "h1",
  "h2",
  "h3",
  "p",
  "img",
  ".agenda-evento",
  ".agenda-dia__data",
  ".minha-card",
  ".semana-evento",
  ".semana-dia-header",
  ".mes-dia",
  ".mes-celula",
  ".rel-kpi",
  ".staff-org__cartao",
  ".staff-org__grupo-titulo",
  ".escala-area-card",
  ".resposta-item",
  ".quadro-slot",
].join(",");

/**
 * Grupos que ficam inteiros na mesma página sempre que cabem numa página: a semana, o dia da
 * agenda, o mês de "Minhas escalas", a tabela do relatório, a coluna do organograma...
 * (Se o grupo sozinho for maior que uma página, ele é dividido entre cartões/linhas.)
 */
const GRUPOS_JUNTOS = [
  ".semana-bloco",
  ".agenda-dia",
  ".minhas-grupo",
  ".rel-kpis",
  ".rel-tabela-wrap",
  ".staff-org__grupo",
  ".escala-area-card",
  ".resposta-item",
  ".mes-dia",
  ".quadro-area",
].join(",");

/** Margem da página em pontos (1 pt = 1/72 pol.) */
const MARGEM = 24;
/** A4 em pontos */
const A4 = { curto: 595.28, longo: 841.89 };
/** Não amplia além do tamanho real (1 px de tela = 0,75 pt) */
const ESCALA_MAX = 0.75;
/** Menor escala para encaixar tudo numa página só (texto de 14 px vira ~6,3 pt) */
const ESCALA_MIN_UMA_PAGINA = 0.45;

export function nomeArquivoPdf(nome: string): string {
  const limpo = nome.replace(/[<>:"/\\|?*]+/g, " ").replace(/\s+/g, " ").trim() || "documento";
  return `${limpo}.pdf`;
}

// ------------------------------------------------------------------ paginação (regras puras)

/**
 * Alturas onde dá para cortar a página sem partir nenhum bloco ao meio. Com colunas lado a lado
 * (organograma, semana), a borda de um cartão pode cair no meio de outro da coluna vizinha: só vale
 * um corte que não atravessa NENHUM bloco.
 */
export function cortesValidos(blocos: [number, number][], altura: number): number[] {
  const candidatos = new Set<number>([Math.round(altura)]);
  for (const [t, b] of blocos) {
    candidatos.add(Math.round(t));
    candidatos.add(Math.round(b));
  }
  return [...candidatos]
    .filter((y) => y > 0 && y <= altura)
    .filter((y) => !blocos.some(([t, b]) => t + 1 < y && y < b - 1))
    .sort((x, y) => x - y);
}

/** Melhor corte da página: o mais baixo que cabe, sem desperdiçar mais da metade da página */
export function escolherCorte(
  inicio: number,
  alturaPagina: number,
  cortes: number[],
  total: number,
  preenchimentoMinimo = 0.45
): number {
  const limite = inicio + alturaPagina;
  if (limite >= total) return total;
  let melhor = -1;
  for (const c of cortes) {
    if (c > inicio + alturaPagina * preenchimentoMinimo && c <= limite && c > melhor) melhor = c;
  }
  return melhor > 0 ? melhor : limite;
}

/**
 * Corte de cada página, em ordem de preferência:
 *  1. entre grupos inteiros (semana, dia...): aceita a página mais vazia para não partir o grupo;
 *  2. entre cartões/linhas (grupo maior que uma página);
 *  3. na altura máxima (nada melhor).
 */
export function escolherCorteEmCamadas(
  inicio: number,
  alturaPagina: number,
  cortesGrupos: number[],
  cortesFolhas: number[],
  total: number
): number {
  const limite = inicio + alturaPagina;
  if (limite >= total) return total;
  const porGrupo = escolherCorte(inicio, alturaPagina, cortesGrupos, total, 0.12);
  if (porGrupo < limite) return porGrupo;
  return escolherCorte(inicio, alturaPagina, cortesFolhas, total);
}

/** Fatias [início, fim) em px do conteúdo, uma por página */
export function paginar(
  altura: number,
  alturaPagina: number,
  cortes: number[],
  cortesGrupos: number[] = []
): [number, number][] {
  const fatias: [number, number][] = [];
  let inicio = 0;
  while (inicio < altura - 1 && fatias.length < 300) {
    const fim = cortesGrupos.length
      ? escolherCorteEmCamadas(inicio, alturaPagina, cortesGrupos, cortes, altura)
      : escolherCorte(inicio, alturaPagina, cortes, altura);
    fatias.push([inicio, fim]);
    inicio = fim;
  }
  return fatias;
}

/** Proporção (altura / largura) do cabeçalho e do rodapé, para reservar espaço em cada página */
export interface Moldura {
  cabecalho: number;
  rodape: number;
}

/** Espaço entre cabeçalho/rodapé e o conteúdo, em pt */
const ESPACO_MOLDURA = 10;

/** Alturas (pt) do cabeçalho e do rodapé numa página; o rodapé não passa de 18% da página */
export function alturasMoldura(larguraUtil: number, alturaPagina: number, moldura?: Moldura) {
  if (!moldura) return { cabecalho: 0, rodape: 0 };
  return {
    cabecalho: Math.min(larguraUtil * moldura.cabecalho, 64),
    rodape: moldura.rodape ? Math.min(larguraUtil * moldura.rodape, alturaPagina * 0.18) : 0,
  };
}

/** Altura útil para o conteúdo, descontando margens, cabeçalho e rodapé */
export function alturaParaConteudo(alturaPagina: number, larguraUtil: number, moldura?: Moldura): number {
  const m = alturasMoldura(larguraUtil, alturaPagina, moldura);
  return (
    alturaPagina -
    MARGEM * 2 -
    (m.cabecalho ? m.cabecalho + ESPACO_MOLDURA : 0) -
    (m.rodape ? m.rodape + ESPACO_MOLDURA : 0)
  );
}

export interface Layout {
  paisagem: boolean;
  /** pt do PDF por px do conteúdo */
  escala: number;
  fatias: [number, number][];
}

/**
 * Testa retrato e paisagem e fica com o que usa menos páginas; empate: o que deixa o conteúdo
 * maior; persistindo, a orientação preferida. Se passar só um pouco de uma página, reduz para
 * caber numa só (sem ficar abaixo de ESCALA_MIN_UMA_PAGINA).
 */
export function escolherLayout(
  largura: number,
  altura: number,
  folhas: [number, number][],
  preferePaisagem = false,
  grupos: [number, number][] = [],
  moldura?: Moldura
): Layout {
  const opcoes: Layout[] = [];
  const cortesFolhas = cortesValidos(folhas, altura);
  for (const paisagem of [false, true]) {
    const larguraUtil = (paisagem ? A4.longo : A4.curto) - MARGEM * 2;
    const alturaUtil = alturaParaConteudo(paisagem ? A4.curto : A4.longo, larguraUtil, moldura);
    const escala = Math.min(ESCALA_MAX, larguraUtil / largura);
    const alturaPagina = alturaUtil / escala;
    const gruposQueCabem = grupos.filter(([t, b]) => b - t <= alturaPagina);
    const cortesGrupos = gruposQueCabem.length ? cortesValidos([...folhas, ...gruposQueCabem], altura) : [];
    opcoes.push({ paisagem, escala, fatias: paginar(altura, alturaPagina, cortesFolhas, cortesGrupos) });
    const escalaUma = Math.min(escala, alturaUtil / altura);
    if (escalaUma >= ESCALA_MIN_UMA_PAGINA) opcoes.push({ paisagem, escala: escalaUma, fatias: [[0, altura]] });
  }
  opcoes.sort(
    (a, b) =>
      a.fatias.length - b.fatias.length ||
      b.escala - a.escala ||
      Number(b.paisagem === preferePaisagem) - Number(a.paisagem === preferePaisagem)
  );
  return opcoes[0];
}

// ------------------------------------------------------------------ preparação da página

/** Regras @media print do site, para aplicar durante a geração (sem duplicar o CSS) */
function regrasDeImpressao(): string {
  let css = "";
  for (const folha of Array.from(document.styleSheets)) {
    let regras: CSSRuleList;
    try {
      regras = folha.cssRules;
    } catch {
      continue; // folhas de outro domínio (Google Fonts) não podem ser lidas
    }
    for (const r of Array.from(regras)) {
      if (r instanceof CSSMediaRule && /\bprint\b/.test(r.media.mediaText)) {
        for (const dentro of Array.from(r.cssRules)) {
          if (!(dentro instanceof CSSPageRule)) css += dentro.cssText + "\n";
        }
      }
    }
  }
  return css;
}

/** Fotos com loading="lazy" fora da tela ainda não carregaram: força antes de fotografar */
async function carregarImagens(raiz: HTMLElement) {
  const imgs = Array.from(raiz.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.loading === "lazy") img.loading = "eager";
      if (img.complete && img.naturalWidth) return;
      await Promise.race([img.decode().catch(() => undefined), new Promise((ok) => setTimeout(ok, 4000))]);
    })
  );
}

/**
 * Caixas que rolam de lado na tela (tabelas largas, semana) são abertas e o conteúdo é alargado
 * para caber tudo: assim nada é cortado nas laterais. Devolve a função que desfaz.
 */
function abrirConteudoLargo(alvo: HTMLElement): () => void {
  const desfazer: (() => void)[] = [];
  const definir = (el: HTMLElement, prop: string, valor: string) => {
    const antes = el.style.getPropertyValue(prop);
    const prioridade = el.style.getPropertyPriority(prop);
    el.style.setProperty(prop, valor, "important");
    desfazer.push(() => el.style.setProperty(prop, antes, prioridade));
  };
  for (let volta = 0; volta < 3; volta++) {
    const caixa = alvo.getBoundingClientRect();
    let necessario = alvo.scrollWidth;
    for (const el of Array.from(alvo.querySelectorAll<HTMLElement>("*"))) {
      if (el.scrollWidth <= el.clientWidth + 1) continue;
      if (!/(auto|scroll|hidden|clip)/.test(getComputedStyle(el).overflowX)) continue;
      const r = el.getBoundingClientRect();
      necessario = Math.max(necessario, r.left - caixa.left + el.scrollWidth + (caixa.right - r.right));
      definir(el, "overflow", "visible");
    }
    if (necessario <= alvo.offsetWidth + 1) break;
    definir(alvo, "width", `${Math.ceil(necessario)}px`);
    definir(alvo, "max-width", "none");
  }
  return () => desfazer.reverse().forEach((f) => f());
}

/** Só os blocos mais internos: um "li" que contém uma sub-lista inteira não pode travar os cortes */
/** Posição (topo, base) dos grupos que devem ficar inteiros numa página */
function medirGrupos(alvo: HTMLElement): [number, number][] {
  const topo = alvo.getBoundingClientRect().top;
  return Array.from(alvo.querySelectorAll<HTMLElement>(GRUPOS_JUNTOS))
    .filter((el) => el.offsetParent !== null && el.getBoundingClientRect().height > 0)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return [r.top - topo, r.bottom - topo] as [number, number];
    });
}

function blocosFolha(alvo: HTMLElement): [number, number][] {
  const todos = Array.from(alvo.querySelectorAll<HTMLElement>(BLOCOS_INTEIROS)).filter(
    (el) => el.offsetParent !== null && el.getBoundingClientRect().height > 0
  );
  const conjunto = new Set(todos);
  const topo = alvo.getBoundingClientRect().top;
  return todos
    .filter((el) => !Array.from(el.querySelectorAll<HTMLElement>(BLOCOS_INTEIROS)).some((f) => conjunto.has(f)))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return [r.top - topo, r.bottom - topo] as [number, number];
    });
}

function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((ok, erro) => {
    const fr = new FileReader();
    fr.onload = () => ok(fr.result as string);
    fr.onerror = () => erro(fr.error);
    fr.readAsDataURL(blob);
  });
}

let cacheFontes: Promise<string | null> | null = null;

/**
 * CSS das fontes da marca (Google Fonts) com os arquivos embutidos, só do subconjunto "latin"
 * (que já tem á, ç, ã...). Sem isso a biblioteca baixava todos os subconjuntos de todas as fontes
 * a cada PDF e levava ~25 s. Fica em cache para os próximos PDFs. Se falhar, o PDF sai com a
 * fonte padrão (texto continua certo).
 */
function cssDasFontes(): Promise<string | null> {
  if (!cacheFontes) {
    cacheFontes = (async () => {
      const link = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
      if (!link) return null;
      const css = await (await fetch(link.href)).text();
      const blocos = css.split(/(?=\/\*\s*[\w-]+\s*\*\/)/).filter((b) => /^\/\*\s*latin\s*\*\//.test(b));
      const urls = [...new Set(blocos.flatMap((b) => [...b.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1])))];
      const dados = new Map(
        await Promise.all(urls.map(async (u) => [u, await blobParaDataUrl(await (await fetch(u)).blob())] as const))
      );
      return blocos.map((b) => b.replace(/url\((https:[^)]+)\)/g, (_, u: string) => `url(${dados.get(u)})`)).join("\n");
    })().catch(() => {
      cacheFontes = null; // tenta de novo no próximo PDF
      return null;
    });
  }
  return cacheFontes;
}

type ToSvg = (typeof import("html-to-image"))["toSvg"];

/** Fotografa um elemento (SVG -> imagem -> canvas, sem depender de requestAnimationFrame) */
async function capturar(
  toSvg: ToSvg,
  el: HTMLElement,
  largura: number,
  altura: number,
  resolucao: number,
  fundo: string,
  fontes: string | null,
  estilo: Partial<CSSStyleDeclaration> = {}
): Promise<HTMLCanvasElement> {
  const svg = await toSvg(el, {
    width: largura,
    height: altura,
    backgroundColor: fundo,
    cacheBust: false,
    style: { margin: "0", ...estilo },
    ...(fontes ? { fontEmbedCSS: fontes } : { skipFonts: true }),
    filter: (no) => !(no instanceof HTMLElement && no.classList.contains("no-print")),
  });
  const imagem = new Image();
  await new Promise<void>((ok, erro) => {
    imagem.onload = () => ok();
    imagem.onerror = () => erro(new Error("Não foi possível montar a imagem do PDF"));
    imagem.src = svg;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(largura * resolucao);
  canvas.height = Math.round(altura * resolucao);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Cabeçalho de cada página: logo da Casa à esquerda; título e data à direita */
function montarCabecalho(titulo: string, fundo: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;left:-20000px;top:0;width:1000px;box-sizing:border-box;padding:14px 4px 14px;" +
    `display:flex;align-items:center;justify-content:space-between;gap:24px;background:${fundo};` +
    "border-bottom:1px solid rgba(235,235,235,.16);font-family:Montserrat,system-ui,sans-serif";
  const logo = document.createElement("img");
  logo.src = logoCasa;
  logo.alt = "Casa dos Discípulos";
  logo.style.cssText = "height:58px;width:auto;display:block";
  const textos = document.createElement("div");
  textos.style.cssText = "text-align:right;min-width:0";
  const t = document.createElement("div");
  t.textContent = titulo;
  t.style.cssText = "color:#ebebeb;font-weight:700;font-size:20px;line-height:1.25;letter-spacing:-.01em";
  const d = document.createElement("div");
  d.textContent = `Gerado em ${new Date().toLocaleDateString("pt-BR")}`;
  d.style.cssText = "color:#5fb2bf;font-size:13px;margin-top:4px;font-weight:600";
  textos.append(t, d);
  el.append(logo, textos);
  return el;
}

/** Aviso por cima da tela enquanto o layout de PDF está aplicado */
function mostrarAviso(): () => void {
  const aviso = document.createElement("div");
  aviso.setAttribute("role", "status");
  aviso.textContent = "Gerando PDF…";
  aviso.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;" +
    "background:rgba(2,2,2,.92);color:#ebebeb;font:600 1.05rem Montserrat,system-ui,sans-serif";
  document.body.appendChild(aviso);
  return () => aviso.remove();
}

// ------------------------------------------------------------------ geração

export async function exportarPdf(nomeArquivo: string, opcoes: OpcoesPdf = {}): Promise<void> {
  const alvo = opcoes.alvo ?? document.getElementById("main-content") ?? document.body;
  const [{ toSvg }, { jsPDF }, fontes] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
    cssDasFontes(),
  ]);

  const fundo = getComputedStyle(document.body).backgroundColor || "rgb(2, 2, 2)";
  const tirarAviso = mostrarAviso();
  const estilo = document.createElement("style");
  estilo.textContent = `${regrasDeImpressao()}
    #main-content { padding-top: 16px !important; padding-bottom: 16px !important; }`;
  const scrollAntes = window.scrollY;
  let desfazerLargura: () => void = () => {};

  try {
    // Rodapé: o mesmo do site (capturado antes do layout de impressão, que o esconde)
    const elRodape = document.querySelector<HTMLElement>(".cd-footer");
    const rodape =
      elRodape && elRodape.offsetHeight > 0
        ? await capturar(toSvg, elRodape, elRodape.offsetWidth, elRodape.offsetHeight, 2, fundo, fontes)
        : null;
    // Cabeçalho: logo + título + data
    const elCabecalho = montarCabecalho(nomeArquivo, fundo);
    document.body.appendChild(elCabecalho);
    const logoImg = elCabecalho.querySelector("img")!;
    await Promise.race([logoImg.decode().catch(() => undefined), new Promise((ok) => setTimeout(ok, 3000))]);
    const cabecalho = await capturar(toSvg, elCabecalho, 1000, elCabecalho.offsetHeight, 2, fundo, fontes, {
      position: "static",
      left: "0",
    });
    elCabecalho.remove();
    const moldura: Moldura = {
      cabecalho: cabecalho.height / cabecalho.width,
      rodape: rodape ? rodape.height / rodape.width : 0,
    };

    document.head.appendChild(estilo);
    document.body.classList.add("gerando-pdf");
    await carregarImagens(alvo);
    if (document.fonts?.ready) await document.fonts.ready;
    // setTimeout, não requestAnimationFrame: em aba em segundo plano o rAF não dispara
    await new Promise((ok) => setTimeout(ok, 60));
    desfazerLargura = abrirConteudoLargo(alvo);
    await new Promise((ok) => setTimeout(ok, 30));

    const largura = Math.max(alvo.scrollWidth, alvo.offsetWidth);
    const altura = alvo.scrollHeight;
    const layout = escolherLayout(largura, altura, blocosFolha(alvo), !!opcoes.paisagem, medirGrupos(alvo), moldura);

    // Resolução: ~2,4 px de imagem por pt do PDF, dentro dos limites de canvas dos navegadores
    const resolucao = Math.max(
      1,
      Math.min(2.5, layout.escala * 2.4 * 1.34, 28000 / Math.max(1, altura), Math.sqrt(90_000_000 / Math.max(1, largura * altura)))
    );

    const canvas = await capturar(toSvg, alvo, largura, altura, resolucao, fundo, fontes);

    const pdf = new jsPDF({ orientation: layout.paisagem ? "landscape" : "portrait", unit: "pt", format: "a4" });
    const larguraPag = pdf.internal.pageSize.getWidth();
    const alturaPag = pdf.internal.pageSize.getHeight();
    const larguraConteudo = largura * layout.escala;
    const x = (larguraPag - larguraConteudo) / 2; // centralizado na página
    const [r, g, b] = (fundo.match(/\d+/g) || ["2", "2", "2"]).map(Number);
    const larguraUtil = larguraPag - MARGEM * 2;
    const m = alturasMoldura(larguraUtil, alturaPag, moldura);
    const imgCabecalho = cabecalho.toDataURL("image/jpeg", 0.92);
    const imgRodape = rodape ? rodape.toDataURL("image/jpeg", 0.92) : null;
    const larguraRodape = rodape ? Math.min(larguraUtil, m.rodape / moldura.rodape) : 0;
    const larguraCabecalho = Math.min(larguraUtil, m.cabecalho / moldura.cabecalho);
    const topoConteudo = MARGEM + (m.cabecalho ? m.cabecalho + ESPACO_MOLDURA : 0);
    const total = layout.fatias.length;

    layout.fatias.forEach(([ini, fim], n) => {
      const fatia = document.createElement("canvas");
      fatia.width = canvas.width;
      fatia.height = Math.max(1, Math.round((fim - ini) * resolucao));
      fatia
        .getContext("2d")!
        .drawImage(canvas, 0, Math.round(ini * resolucao), canvas.width, fatia.height, 0, 0, canvas.width, fatia.height);
      if (n > 0) pdf.addPage();
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, larguraPag, alturaPag, "F");
      // Cabeçalho e rodapé: a mesma imagem em todas as páginas (o "alias" embute uma vez só no arquivo)
      pdf.addImage(imgCabecalho, "JPEG", (larguraPag - larguraCabecalho) / 2, MARGEM, larguraCabecalho, m.cabecalho, "cabecalho");
      pdf.addImage(fatia.toDataURL("image/jpeg", 0.9), "JPEG", x, topoConteudo, larguraConteudo, (fim - ini) * layout.escala);
      if (imgRodape) {
        pdf.addImage(imgRodape, "JPEG", (larguraPag - larguraRodape) / 2, alturaPag - MARGEM - m.rodape, larguraRodape, m.rodape, "rodape");
      }
      pdf.setFontSize(7);
      pdf.setTextColor(150, 158, 160);
      pdf.text(`Página ${n + 1} de ${total}`, larguraPag - MARGEM, alturaPag - 9, { align: "right" });
    });

    pdf.setProperties({ title: nomeArquivo, creator: "Casa dos Discípulos" });
    pdf.save(nomeArquivoPdf(nomeArquivo));
  } finally {
    desfazerLargura();
    estilo.remove();
    document.body.classList.remove("gerando-pdf");
    window.scrollTo(0, scrollAntes);
    tirarAviso();
  }
}
