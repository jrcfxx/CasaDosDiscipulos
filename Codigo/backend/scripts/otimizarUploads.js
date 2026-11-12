/**
 * Otimiza as imagens JÁ enviadas em uploads/ (fotos de perfil, eventos, Fala Aí, campos).
 * Mantém o MESMO nome e formato de cada arquivo, para os links salvos no banco continuarem válidos.
 * Só substitui quando o resultado fica menor. GIF, PDF, áudio e vídeo não são tocados.
 *
 * Uso (no servidor):
 *   docker compose exec backend npm run uploads:otimizar
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");
const LARGURA = 1600;
const LARGURA_PERFIL = 600;

async function* listar(dir) {
  for (const entrada of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entrada.name);
    if (entrada.isDirectory()) yield* listar(p);
    else yield p;
  }
}

async function otimizar(arquivo) {
  const ext = path.extname(arquivo).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return null;
  const original = await fs.readFile(arquivo);
  const largura = arquivo.includes(`${path.sep}perfil${path.sep}`) ? LARGURA_PERFIL : LARGURA;
  let img = sharp(original, { failOn: "none" })
    .rotate()
    .resize({ width: largura, height: largura, fit: "inside", withoutEnlargement: true });
  if (ext === ".png") img = img.png({ compressionLevel: 9, palette: true, quality: 80 });
  else if (ext === ".webp") img = img.webp({ quality: 80 });
  else img = img.jpeg({ quality: 80, mozjpeg: true, progressive: true });
  const saida = await img.toBuffer();
  if (saida.length >= original.length) return [original.length, original.length];
  await fs.writeFile(arquivo, saida);
  return [original.length, saida.length];
}

let antes = 0;
let depois = 0;
let qtd = 0;
for await (const arquivo of listar(RAIZ)) {
  try {
    const r = await otimizar(arquivo);
    if (!r) continue;
    antes += r[0];
    depois += r[1];
    if (r[1] < r[0]) {
      qtd += 1;
      console.log(
        `${path.relative(RAIZ, arquivo)}: ${(r[0] / 1024).toFixed(0)} KB -> ${(r[1] / 1024).toFixed(0)} KB`
      );
    }
  } catch (err) {
    console.error(`Ignorado ${path.relative(RAIZ, arquivo)}: ${err.message}`);
  }
}
console.log(
  `\n${qtd} imagem(ns) otimizada(s): ${(antes / 1024 / 1024).toFixed(1)} MB -> ${(depois / 1024 / 1024).toFixed(1)} MB`
);
