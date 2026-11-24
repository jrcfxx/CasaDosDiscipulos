/**
 * "Exportar PDF" das telas visuais (escala, mapa, organograma, relatórios): gera e baixa um
 * arquivo .pdf de verdade.
 *
 * Como funciona: aplica na página o mesmo layout limpo da impressão (as regras @media print do
 * site — sem menus, botões e flutuantes), fotografa o conteúdo (#main-content) e divide a imagem em
 * páginas A4 sem cortar cartões, dias ou linhas de tabela no meio. Um aviso cobre a tela enquanto isso.
 *
 * A foto usa html-to-image (SVG): quem desenha o texto é o próprio navegador, então a fonte da marca
 * (Montserrat) sai igual à tela. (O html2canvas media as palavras errado com essa fonte e as juntava.)
 * As bibliotecas (html-to-image e jsPDF) só são baixadas no clique.
 */

export interface OpcoesPdf {
  paisagem?: boolean;
  /** Elemento a exportar (padrão: o conteúdo principal da página) */
  alvo?: HTMLElement | null;
}

/** Elementos que não devem ser cortados no meio entre uma página e outra */
const BLOCOS_INTEIROS = [
  "tr",
  ".agenda-dia",
  ".agenda-evento",
  ".minha-card",
  ".semana-bloco",
  ".semana-coluna",
  ".mes-dia",
  ".rel-kpis",
  ".staff-card",
  ".organograma-no",
  ".escala-area-card",
  "section",
  "article",
  "header",
].join(",");

/** Margem da página em pontos (1 pt = 1/72 pol.) */
const MARGEM = 22;

export function nomeArquivoPdf(nome: string): string {
  const limpo = nome.replace(/[<>:"/\\|?*]+/g, " ").replace(/\s+/g, " ").trim() || "documento";
  return `${limpo}.pdf`;
}

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
 * Onde cortar: a maior borda de bloco que cabe na página (e não muito acima, para não desperdiçar
 * página). Sem borda boa, corta na altura máxima.
 */
export function escolherCorte(inicio: number, alturaPagina: number, bordas: number[], total: number): number {
  const limite = inicio + alturaPagina;
  if (limite >= total) return total;
  let melhor = -1;
  for (const b of bordas) {
    if (b > inicio + alturaPagina * 0.45 && b <= limite && b > melhor) melhor = b;
  }
  return melhor > 0 ? melhor : limite;
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
    #main-content { padding-top: 16px !important; }`;
  const scrollAntes = window.scrollY;

  try {
    document.head.appendChild(estilo);
    document.body.classList.add("gerando-pdf");
    await carregarImagens(alvo);
    if (document.fonts?.ready) await document.fonts.ready;
    // Dá tempo de o layout de PDF ser aplicado (setTimeout, não requestAnimationFrame: em aba
    // em segundo plano o rAF não dispara e a geração ficaria parada)
    await new Promise((ok) => setTimeout(ok, 60));

    // Bordas dos blocos, em px relativos ao topo do conteúdo
    const topo = alvo.getBoundingClientRect().top;
    const bordas = Array.from(alvo.querySelectorAll<HTMLElement>(BLOCOS_INTEIROS))
      .filter((el) => el.offsetParent !== null)
      .flatMap((el) => {
        const r = el.getBoundingClientRect();
        return [r.top - topo, r.bottom - topo];
      });

    const altura = alvo.scrollHeight;
    // Sem passar de ~28 mil pixels de altura (limite de canvas dos navegadores)
    const escala = Math.max(1, Math.min(2, 28000 / Math.max(1, altura)));
    // SVG -> imagem -> canvas feito aqui (o toCanvas da biblioteca espera um requestAnimationFrame,
    // que não dispara se a pessoa trocar de aba durante a geração)
    const largura = alvo.offsetWidth;
    const svg = await toSvg(alvo, {
      width: largura,
      height: altura,
      backgroundColor: fundo,
      cacheBust: false,
      // A margem automática (centralização) empurrava a imagem para a direita e cortava o lado
      style: { margin: "0" },
      ...(fontes ? { fontEmbedCSS: fontes } : { skipFonts: true }),
      // Elementos marcados como "só na tela" ficam de fora
      filter: (no) => !(no instanceof HTMLElement && no.classList.contains("no-print")),
    });
    const imagem = new Image();
    await new Promise<void>((ok, erro) => {
      imagem.onload = () => ok();
      imagem.onerror = () => erro(new Error("Não foi possível montar a imagem do PDF"));
      imagem.src = svg;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(largura * escala);
    canvas.height = Math.round(altura * escala);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);

    const pdf = new jsPDF({ orientation: opcoes.paisagem ? "landscape" : "portrait", unit: "pt", format: "a4" });
    const larguraPag = pdf.internal.pageSize.getWidth();
    const alturaPag = pdf.internal.pageSize.getHeight();
    const larguraUtil = larguraPag - MARGEM * 2;
    const alturaUtil = alturaPag - MARGEM * 2;
    // Cabe na largura; se a página for "baixa" demais para a largura, ajusta pela altura
    const ptPorPx = larguraUtil / canvas.width;
    const alturaPaginaPx = alturaUtil / ptPorPx;
    const fatorBordas = canvas.height / Math.max(1, altura);
    const bordasPx = bordas.map((b) => b * fatorBordas).sort((a, b) => a - b);
    const [r, g, b] = (fundo.match(/\d+/g) || ["2", "2", "2"]).map(Number);

    let inicio = 0;
    let pagina = 0;
    while (inicio < canvas.height - 1) {
      const fim = escolherCorte(inicio, alturaPaginaPx, bordasPx, canvas.height);
      const fatia = document.createElement("canvas");
      fatia.width = canvas.width;
      fatia.height = Math.ceil(fim - inicio);
      fatia.getContext("2d")!.drawImage(canvas, 0, inicio, canvas.width, fatia.height, 0, 0, canvas.width, fatia.height);

      if (pagina > 0) pdf.addPage();
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, larguraPag, alturaPag, "F");
      pdf.addImage(fatia.toDataURL("image/jpeg", 0.9), "JPEG", MARGEM, MARGEM, larguraUtil, fatia.height * ptPorPx);
      inicio = fim;
      pagina++;
    }

    pdf.setProperties({ title: nomeArquivo, creator: "Casa dos Discípulos" });
    pdf.save(nomeArquivoPdf(nomeArquivo));
  } finally {
    estilo.remove();
    document.body.classList.remove("gerando-pdf");
    window.scrollTo(0, scrollAntes);
    tirarAviso();
  }
}
