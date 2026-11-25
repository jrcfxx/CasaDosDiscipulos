/**
 * QA de ponta a ponta das LIÇÕES (Secretaria das Células) pela API.
 * Precisa do backend rodando em http://localhost:3001 e do banco local.
 * Uso: npm run qa:licoes
 * Cria lições "QA …" e apaga tudo no final.
 */
import "dotenv/config";
import knex from "../src/database/index.js";
import { tokenDeTeste, encerrarSessoesDeTeste } from "./sessaoTeste.js";

const API = "http://localhost:3001/api";
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
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  let bruto = null;
  try {
    bruto = await r.json();
  } catch {
    /* sem corpo */
  }
  return { status: r.status, bruto };
}
const resumo = (r) => `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 180)}`;

async function main() {
  const admin = await knex("usuario").where({ id_usuario: 182 }).first(); // admin de teste local
  token = await tokenDeTeste(admin);
  const T = Object.fromEntries((await knex("campo_personalizado")).map((c) => [c.tipo_campo, c.id_campo]));

  console.log("\n== 1. Criação e validação");
  let r = await api("POST", "/licao", { titulo: "  ab " , campos: [{ id_campo: T.texto, label: "A", conteudo: "x" }] });
  ok(r.status === 400, "título curto: 400", resumo(r));
  r = await api("POST", "/licao", { titulo: "QA Sem conteúdo", campos: [] });
  ok(r.status === 400, "lição sem conteúdo: 400", resumo(r));
  r = await api("POST", "/licao", { titulo: "QA Vazio", campos: [{ id_campo: T.texto, label: "Versículo", conteudo: "  " }] });
  ok(r.status === 400, "conteúdo em branco: 400", resumo(r));
  r = await api("POST", "/licao", { titulo: "QA Vídeo ruim", campos: [{ id_campo: T.video, label: "Aula", conteudo: "youtube" }] });
  ok(r.status === 400, "vídeo sem link completo: 400", resumo(r));
  r = await api("POST", "/licao", {
    titulo: "QA Repetido",
    campos: [{ id_campo: T.texto, label: "Aula", conteudo: "a" }, { id_campo: T.texto, label: " aula ", conteudo: "b" }],
  });
  ok(r.status === 400, "títulos repetidos: 400", resumo(r));
  r = await api("POST", "/licao", {
    titulo: "  QA Lição 1  ",
    descricao: " desc ",
    campos: [
      { id_campo: T.texto, label: "Versículo", conteudo: "João 3:16" },
      { id_campo: T.video, label: "Aula", conteudo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    ],
  });
  ok(r.status === 201, "lição válida é criada", resumo(r));
  const l = r.bruto;
  ok(l?.titulo === "QA Lição 1" && l?.descricao === "desc", "título e descrição sem espaços nas pontas", JSON.stringify([l?.titulo, l?.descricao]));
  ok(l?.campos?.map((c) => c.label).join("|") === "Versículo|Aula", "conteúdos na ordem", JSON.stringify(l?.campos?.map((c) => c.label)));

  console.log("\n== 2. Edição");
  r = await api("PUT", `/licao/${l?.id_licao}`, { ativo: false });
  ok(r.status === 200 && r.bruto?.campos?.length === 2, "desativar só com {ativo:false} não apaga o conteúdo", resumo(r));
  r = await api("PUT", `/licao/${l?.id_licao}`, {
    campos: [
      { id_campo: T.video, label: "Aula", conteudo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      { id_campo: T.texto, label: "Versículo", conteudo: "João 3:16" },
    ],
  });
  ok(r.status === 200 && r.bruto?.campos?.map((c) => c.label).join("|") === "Aula|Versículo", "reordenar os conteúdos", resumo(r));
  r = await api("PUT", `/licao/${l?.id_licao}`, { campos: [] });
  ok(r.status === 400, "deixar a lição sem conteúdo: 400", resumo(r));
  r = await api("PUT", `/licao/999999`, { ativo: true });
  ok(r.status === 404, "editar lição inexistente: 404", resumo(r));
  r = await api("PUT", `/licao/abc`, { ativo: true });
  ok(r.status === 400, "id inválido: 400", resumo(r));

  console.log("\n== 2b. Lição inativa some para os líderes");
  const lider = await knex("usuario").where({ id_usuario: 170 }).first(); // líder de teste local
  const tokenAdmin = token;
  token = await tokenDeTeste(lider);
  const trocarAntes = lider.trocar_senha;
  await knex("usuario").where({ id_usuario: 170 }).update({ trocar_senha: 0 });
  try {
    r = await api("GET", "/licao");
    ok(r.status === 200 && !(r.bruto || []).some((x) => x.id_licao === l?.id_licao), "lista do líder não traz lição inativa", resumo(r));
    r = await api("GET", `/licao/${l?.id_licao}`);
    ok(r.status === 404, "líder abrindo lição inativa: 404", resumo(r));
  } finally {
    await knex("usuario").where({ id_usuario: 170 }).update({ trocar_senha: trocarAntes });
    token = tokenAdmin;
  }

  console.log("\n== 3. Exclusão");
  r = await api("DELETE", `/licao/${l?.id_licao}`);
  ok(r.status === 200 || r.status === 204, "excluir lição", resumo(r));
  r = await api("DELETE", `/licao/${l?.id_licao}`);
  ok(r.status === 404, "excluir de novo: 404", resumo(r));
}

main()
  .catch((e) => {
    falhas.push(`script parou: ${e.message}`);
    console.error("ERRO NO SCRIPT:", e);
  })
  .finally(async () => {
    const ids = (await knex("licao").where("titulo", "like", "QA %").select("id_licao")).map((x) => x.id_licao);
    if (ids.length) {
      await knex("licao_campo").whereIn("id_licao", ids).del();
      await knex("licao").whereIn("id_licao", ids).del();
    }
    console.log(`\n${oks} OK, ${falhas.length} FALHA(S)`);
    for (const f of falhas) console.log(` - ${f}`);
    await encerrarSessoesDeTeste();
    await knex.destroy();
    process.exit(falhas.length ? 1 : 0);
  });
