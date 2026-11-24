/**
 * QA de ponta a ponta dos EVENTOS do carrossel da home (Gerenciar Eventos) pela API.
 * Precisa do backend rodando em http://localhost:3001 e do banco local.
 * Uso: npm run qa:eventos
 * Cria eventos "QA …" e apaga tudo no final (inclusive as imagens enviadas).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import knex from "../src/database/index.js";
import { gerarToken } from "../src/services/authService.js";

const API = "http://localhost:3001/api";
const UPLOADS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");
const falhas = [];
let oks = 0;
const ok = (cond, nome, detalhe = "") => {
  if (cond) {
    oks++;
    console.log(`OK     ${nome}`);
  } else {
    falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
    console.log(`FALHA  ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  }
};

let token;
async function api(metodo, caminho, corpo) {
  const ehForm = corpo instanceof FormData;
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, ...(ehForm ? {} : { "Content-Type": "application/json" }) },
    body: corpo === undefined ? undefined : ehForm ? corpo : JSON.stringify(corpo),
  });
  let bruto = null;
  try {
    bruto = await r.json();
  } catch {
    /* sem corpo */
  }
  return { status: r.status, bruto };
}
const resumo = (r) => `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 160)}`;

/** PNG 1x1 válido */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
async function enviarImagem(nome = "qa.png", tipo = "image/png", conteudo = PNG) {
  const fd = new FormData();
  fd.append("imagem", new Blob([conteudo], { type: tipo }), nome);
  return api("POST", "/evento/upload", fd);
}
const arquivoExiste = (url) => !!url && fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));

const criados = [];
async function main() {
  const admin = await knex("usuario").where({ id_usuario: 182 }).first(); // admin de teste local
  token = gerarToken(admin);

  console.log("\n== 1. Upload de imagem");
  let up = await enviarImagem();
  ok(up.status === 200 && /^\/uploads\//.test(up.bruto?.imagem_url || ""), "imagem válida sobe", resumo(up));
  const img1 = up.bruto?.imagem_url;
  let r = await enviarImagem("x.txt", "text/plain", Buffer.from("oi"));
  ok(r.status === 400, "arquivo que não é imagem: 400", resumo(r));

  console.log("\n== 2. Criação e validação");
  r = await api("POST", "/evento", { titulo: "QA Sem imagem" });
  ok(r.status === 400, "sem imagem: 400", resumo(r));
  r = await api("POST", "/evento", { titulo: "QA Img externa", imagem_url: "javascript:alert(1)" });
  ok(r.status === 400, "imagem com endereço perigoso: 400", resumo(r));
  r = await api("POST", "/evento", { titulo: "QA Img inexistente", imagem_url: "/uploads/nao-existe.png" });
  ok(r.status === 400, "imagem que não foi enviada: 400", resumo(r));
  r = await api("POST", "/evento", { titulo: "QA " + "x".repeat(300), imagem_url: img1 });
  ok(r.status === 400, "título longo demais: 400 (não 500)", resumo(r));
  r = await api("POST", "/evento", { titulo: "QA Ativo texto", imagem_url: img1, ativo: "talvez" });
  ok(r.status === 400, "ativo inválido: 400", resumo(r));

  const antes = await api("GET", "/evento");
  const maiorOrdem = Math.max(0, ...(antes.bruto || []).map((e) => Number(e.ordem) || 0));
  r = await api("POST", "/evento", { titulo: "  QA Evento A  ", descricao: "  desc  ", imagem_url: img1 });
  ok(r.status === 201, "evento válido é criado", resumo(r));
  const a = r.bruto;
  criados.push(a?.id_evento);
  ok(a?.titulo === "QA Evento A" && a?.descricao === "desc", "título e descrição sem espaços nas pontas", JSON.stringify([a?.titulo, a?.descricao]));
  ok(Number(a?.ordem) === maiorOrdem + 1, "evento novo entra no fim do carrossel", `${a?.ordem} vs ${maiorOrdem + 1}`);
  up = await enviarImagem();
  const imgB = up.bruto?.imagem_url;
  r = await api("POST", "/evento", { titulo: "QA Evento B", imagem_url: imgB, ordem: 1 });
  const b = r.bruto;
  criados.push(b?.id_evento);
  ok(Number(b?.ordem) === Number(a?.ordem) + 1, "a \"ordem\" enviada é ignorada: o carrossel é ordenado arrastando", String(b?.ordem));

  console.log("\n== 3. Edição");
  r = await api("PUT", `/evento/${a?.id_evento}`, { ativo: false });
  ok(r.status === 200 && !r.bruto?.ativo && r.bruto?.titulo === "QA Evento A", "desativar só com {ativo:false}", resumo(r));
  r = await api("PUT", `/evento/${a?.id_evento}`, { titulo: "" });
  ok(r.status === 200, "título vazio é permitido (é opcional)", resumo(r));
  up = await enviarImagem();
  const img2 = up.bruto?.imagem_url;
  r = await api("PUT", `/evento/${a?.id_evento}`, { imagem_url: img2 });
  ok(r.status === 200 && r.bruto?.imagem_url === img2, "trocar a imagem", resumo(r));
  ok(!arquivoExiste(img1), "a imagem antiga é apagada do servidor ao trocar");
  r = await api("PUT", `/evento/999999`, { ativo: true });
  ok(r.status === 404, "editar evento inexistente: 404", resumo(r));
  r = await api("PUT", `/evento/abc`, { ativo: true });
  ok(r.status === 400, "id inválido: 400", resumo(r));

  console.log("\n== 4. Reordenar arrastando");
  const todos = (await api("GET", "/evento")).bruto || [];
  const ids = todos.map((e) => e.id_evento);
  const invertido = [...ids].reverse();
  r = await api("PUT", "/evento/ordem", { ids: invertido });
  ok(r.status === 200, "salvar nova ordem", resumo(r));
  const depois = ((await api("GET", "/evento")).bruto || []).map((e) => e.id_evento);
  ok(JSON.stringify(depois) === JSON.stringify(invertido), "a lista volta na ordem salva", JSON.stringify(depois.slice(0, 5)));
  const ativos = ((await api("GET", "/evento/ativos")).bruto || []).map((e) => e.id_evento);
  ok(JSON.stringify(ativos) === JSON.stringify(invertido.filter((id) => ativos.includes(id))), "o carrossel da home segue a mesma ordem");
  r = await api("PUT", "/evento/ordem", { ids: invertido.slice(1) });
  ok(r.status === 400, "ordem faltando evento: 400", resumo(r));
  r = await api("PUT", "/evento/ordem", { ids: [...invertido, invertido[0]] });
  ok(r.status === 400, "ordem com evento repetido: 400", resumo(r));
  r = await api("PUT", "/evento/ordem", { ids: ids }); // volta como estava
  ok(r.status === 200, "voltar a ordem original", resumo(r));

  console.log("\n== 5. Exclusão");
  r = await api("DELETE", `/evento/${b?.id_evento}`);
  ok(r.status === 200 || r.status === 204, "excluir evento", resumo(r));
  ok(!arquivoExiste(imgB), "a imagem do evento excluído é apagada do servidor");
  r = await api("DELETE", `/evento/${b?.id_evento}`);
  ok(r.status === 404, "excluir de novo: 404", resumo(r));
}

main()
  .catch((e) => {
    falhas.push(`script parou: ${e.message}`);
    console.error("ERRO NO SCRIPT:", e);
  })
  .finally(async () => {
    const qa = await knex("evento").where("titulo", "like", "QA %").orWhereIn("id_evento", criados.filter(Boolean));
    for (const e of qa) {
      if (String(e.imagem_url).startsWith("/uploads/")) {
        fs.rmSync(path.join(UPLOADS, e.imagem_url.replace(/^\/uploads\//, "")), { force: true });
      }
    }
    await knex("evento").whereIn("id_evento", qa.map((e) => e.id_evento)).del();
    console.log(`\n${oks} OK, ${falhas.length} FALHA(S)`);
    for (const f of falhas) console.log(` - ${f}`);
    await knex.destroy();
    process.exit(falhas.length ? 1 : 0);
  });
