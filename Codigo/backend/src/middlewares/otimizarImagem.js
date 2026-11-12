import fs from "fs/promises";
import path from "path";

// Carregado sob demanda: se o binário nativo faltar, só a otimização é pulada
// (a API continua no ar e o upload é salvo como veio).
let sharpPromise = null;
const carregarSharp = () => {
  sharpPromise ??= import("sharp").then((m) => m.default).catch((err) => {
    console.error("[upload] sharp indisponível; imagens não serão otimizadas:", err?.message);
    return null;
  });
  return sharpPromise;
};

const OTIMIZAVEIS = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const EXT_OTIMIZAVEIS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/**
 * Reduz a imagem enviada (fotos de celular costumam ter 4–12 MB) para no máximo
 * `largura` px e recomprime: sem transparência → JPEG; com transparência → PNG.
 * Atualiza req.file (filename/path/size/mimetype) para os controllers salvarem o
 * caminho certo. GIF e arquivos que não são imagem passam intactos.
 * Se algo falhar, mantém o arquivo original (o upload nunca quebra por isso).
 */
export async function otimizarArquivoDeImagem(file, { largura = 1600, qualidade = 80 } = {}) {
  if (!file?.path) return file;
  const ext = path.extname(file.filename || "").toLowerCase();
  if (!OTIMIZAVEIS.has(file.mimetype) && !EXT_OTIMIZAVEIS.has(ext)) return file;

  const sharp = await carregarSharp();
  if (!sharp) return file;

  try {
    const original = await fs.readFile(file.path);
    const imagem = sharp(original, { failOn: "none" }).rotate(); // respeita a orientação EXIF
    const meta = await imagem.metadata();
    const redimensionada = imagem.resize({
      width: largura,
      height: largura,
      fit: "inside",
      withoutEnlargement: true,
    });

    const comTransparencia = Boolean(meta.hasAlpha);
    const saida = comTransparencia
      ? await redimensionada.png({ compressionLevel: 9, palette: true, quality: qualidade }).toBuffer()
      : await redimensionada.jpeg({ quality: qualidade, mozjpeg: true, progressive: true }).toBuffer();

    // Só troca se ficou menor (imagens já otimizadas permanecem como estão)
    if (saida.length >= original.length) return file;

    const novaExt = comTransparencia ? ".png" : ".jpg";
    const novoNome = `${path.basename(file.filename, path.extname(file.filename))}${novaExt}`;
    const novoPath = path.join(path.dirname(file.path), novoNome);

    await fs.writeFile(novoPath, saida);
    if (path.resolve(novoPath) !== path.resolve(file.path)) {
      await fs.unlink(file.path).catch(() => {}); // ex.: .png sem transparência virou .jpg
    }

    file.filename = novoNome;
    file.path = novoPath;
    file.size = saida.length;
    file.mimetype = comTransparencia ? "image/png" : "image/jpeg";
  } catch (err) {
    console.error("[upload] Não foi possível otimizar a imagem:", err?.message || err);
  }
  return file;
}

/** Middleware Express: usar logo depois do multer (upload.single(...)) */
export const otimizarImagem =
  (opcoes = {}) =>
  async (req, res, next) => {
    if (req.file) await otimizarArquivoDeImagem(req.file, opcoes);
    next();
  };

export default otimizarImagem;
