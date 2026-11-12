import path from "path";

/**
 * Regras de segurança dos arquivos enviados.
 *
 * Os arquivos ficam em /uploads, no MESMO domínio do site, e o token de login fica no
 * localStorage. Um arquivo que o navegador abra como página (HTML, SVG, XML...) poderia
 * rodar script e roubar a sessão. Por isso:
 *   1. no envio, a EXTENSÃO precisa estar na lista (o tipo MIME vem do navegador e é falsificável);
 *   2. na entrega, só extensões desta lista são servidas, com cabeçalhos que impedem execução.
 */
export const EXTENSOES_IMAGEM = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
export const EXTENSOES_MIDIA = [".mp3", ".wav", ".ogg", ".m4a", ".mp4", ".webm"];
export const EXTENSOES_DOCUMENTO = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".txt", ".csv", ".rtf", ".odt", ".ods", ".odp",
  ".zip", ".rar", ".7z",
];
export const EXTENSOES_PERMITIDAS = new Set([
  ...EXTENSOES_IMAGEM,
  ...EXTENSOES_MIDIA,
  ...EXTENSOES_DOCUMENTO,
]);

export const extensaoDe = (nome) => path.extname(String(nome || "")).toLowerCase();

/** true se a extensão do arquivo enviado está na lista informada */
export const extensaoPermitida = (nome, lista = EXTENSOES_PERMITIDAS) =>
  (lista instanceof Set ? lista : new Set(lista)).has(extensaoDe(nome));

const INLINE = new Set([...EXTENSOES_IMAGEM, ...EXTENSOES_MIDIA, ".pdf"]);

/**
 * Middleware para a rota estática /uploads: recusa extensões fora da lista e
 * envia cabeçalhos que impedem o navegador de executar qualquer conteúdo.
 */
export function protegerUploads(req, res, next) {
  const ext = extensaoDe(decodeURIComponent(req.path));
  if (!EXTENSOES_PERMITIDAS.has(ext)) {
    return res.status(404).end();
  }
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Mesmo que algo escape, o documento abre isolado e sem script
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox"
  );
  if (!INLINE.has(ext)) {
    // Documentos (Word, planilhas, zip, txt...) sempre baixam em vez de abrir no navegador
    res.setHeader("Content-Disposition", "attachment");
  }
  next();
}
