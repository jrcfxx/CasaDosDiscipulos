/**
 * Teste de integração do organograma (Staff) — banco de DESENVOLVIMENTO.
 * Conteúdo inicial, CRUD, ordenação, limite de níveis e permissões pela API.
 * Uso: node scripts/testStaff.js
 */
import express from "express";
import jwt from "jsonwebtoken";
import knex from "../src/database/index.js";
import StaffService, { PROFUNDIDADE_MAXIMA } from "../src/services/StaffService.js";
import staffRoutes from "../src/routes/staffRoutes.js";
import errorHandler from "../src/middlewares/errorHandler.js";
import { USER_TYPES } from "../src/utils/constants.js";

if (process.env.NODE_ENV === "production") {
  console.error("Não rode este teste em produção.");
  process.exit(1);
}

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "OK  " : "FAIL"} ${msg}`);
  if (!cond) falhas += 1;
};
const criados = [];
let configOriginal = null;

async function testeConteudoInicial() {
  const e = await StaffService.getEstrutura();
  const grupos = e.itens.map((i) => i.titulo);
  ok(Boolean(e.titulo), `título configurado ("${e.titulo}")`);
  ok(
    ["Diretoria Adm.", "Ministerial", "Apoio", "Células"].every((g) => grupos.includes(g)),
    `4 grupos do organograma (${grupos.join(", ")})`
  );
  const texto = JSON.stringify(e);
  ok(!texto.includes("Farol"), "célula Farol não aparece");
  const ministerial = e.itens.find((i) => i.titulo === "Ministerial");
  const pastoral = ministerial?.filhos.find((f) => f.titulo === "Pastoral");
  ok(pastoral?.filhos.length >= 6, "Pastoral tem os ministérios aninhados");
}

async function testeCrud() {
  const grupo = await StaffService.criarItem({ titulo: "  TESTE grupo  " });
  criados.push(grupo.id_staff_item);
  ok(grupo.titulo === "TESTE grupo" && grupo.id_pai === null, "cria grupo no topo (espaços removidos)");

  const a = await StaffService.criarItem({ id_pai: grupo.id_staff_item, titulo: "Função A", pessoas: "Fulano" });
  const b = await StaffService.criarItem({ id_pai: grupo.id_staff_item, titulo: "Função B", pessoas: "" });
  ok(b.ordem > a.ordem, "nova função entra no fim da lista");
  ok(b.pessoas === null, "pessoas vazio = a definir (null)");

  await StaffService.atualizarItem(a.id_staff_item, { pessoas: "Ciclano, Beltrano" });
  await StaffService.moverItem(b.id_staff_item, "cima");
  let g = (await StaffService.getEstrutura()).itens.find((i) => i.id_staff_item === grupo.id_staff_item);
  ok(g.filhos.map((f) => f.titulo).join(",") === "Função B,Função A", "mover para cima troca a ordem");
  ok(g.filhos[1].pessoas === "Ciclano, Beltrano", "edição das pessoas salva");
  await StaffService.moverItem(b.id_staff_item, "cima"); // já é o primeiro: não faz nada
  g = (await StaffService.getEstrutura()).itens.find((i) => i.id_staff_item === grupo.id_staff_item);
  ok(g.filhos[0].titulo === "Função B", "mover na ponta não quebra a ordem");

  // Limite de níveis
  let pai = b.id_staff_item;
  for (let nivel = 3; nivel <= PROFUNDIDADE_MAXIMA; nivel++) {
    pai = (await StaffService.criarItem({ id_pai: pai, titulo: `Nível ${nivel}` })).id_staff_item;
  }
  const erroNivel = await StaffService.criarItem({ id_pai: pai, titulo: "Fundo demais" }).catch((e) => e);
  ok(erroNivel?.statusCode === 400, `bloqueia acima de ${PROFUNDIDADE_MAXIMA} níveis`);

  const erroVazio = await StaffService.criarItem({ titulo: "   " }).catch((e) => e);
  ok(erroVazio?.statusCode === 400, "título vazio é recusado");

  // Excluir o grupo remove tudo dentro dele
  await StaffService.excluirItem(grupo.id_staff_item);
  criados.length = 0;
  const [{ n }] = await knex("staff_item").where("titulo", "like", "Nível %").orWhere("titulo", "like", "Função _").count({ n: "*" });
  ok(Number(n) === 0, "excluir grupo remove os itens de dentro");

  configOriginal = await StaffService.getEstrutura();
  const cfg = await StaffService.atualizarConfig({ titulo: "Staff TESTE", subtitulo: "" });
  ok(cfg.titulo === "Staff TESTE" && cfg.subtitulo === "", "título e subtítulo editáveis");
}

async function testePermissoes() {
  const app = express();
  app.use(express.json());
  app.use("/api/staff", staffRoutes);
  app.use(errorHandler);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/staff`;

  const token = async (tipo) => {
    const u = await knex("usuario").where({ tipo, ativo: true }).first();
    return u ? jwt.sign({ id_usuario: u.id_usuario, tipo }, process.env.JWT_SECRET, { expiresIn: "5m" }) : null;
  };
  const chamar = (metodo, caminho, tk, corpo) =>
    fetch(base + caminho, {
      method: metodo,
      headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });

  try {
    const publico = await chamar("GET", "/");
    ok(publico.status === 401, "visitante sem login NÃO vê o organograma (401)");
    const tkMembro = await token(USER_TYPES.MEMBER);
    if (tkMembro) {
      const visto = await chamar("GET", "/", tkMembro);
      ok(visto.status === 200 && (await visto.json()).itens?.length > 0, "membro logado visualiza o organograma");
    }
    const anon = await chamar("POST", "/itens", null, { titulo: "x" });
    ok(anon.status === 401, "sem login não edita (401)");
    for (const tipo of [USER_TYPES.MEMBER, USER_TYPES.LEADER]) {
      const tk = await token(tipo);
      if (!tk) continue;
      const r = await chamar("POST", "/itens", tk, { titulo: "x" });
      const r2 = await chamar("PUT", "/config", tk, { titulo: "x" });
      ok(r.status === 403 && r2.status === 403, `${tipo} só visualiza (403 ao editar)`);
    }
    const tkAdmin = await token(USER_TYPES.ADMIN);
    const criado = await chamar("POST", "/itens", tkAdmin, { titulo: "TESTE via API" });
    const corpo = await criado.json();
    if (corpo?.id_staff_item) criados.push(corpo.id_staff_item);
    ok(criado.status === 201, "admin cria pela API (201)");
    const invalido = await chamar("PUT", `/itens/${corpo.id_staff_item}/mover`, tkAdmin, { direcao: "lado" });
    ok(invalido.status === 400, "validação recusa direção inválida (400)");
  } finally {
    server.close();
  }
}

try {
  await testeConteudoInicial();
  await testeCrud();
  await testePermissoes();
} catch (e) {
  console.error("ERRO:", e);
  falhas += 1;
} finally {
  for (const id of criados) await knex("staff_item").where({ id_staff_item: id }).del().catch(() => {});
  if (configOriginal) {
    await StaffService.atualizarConfig({ titulo: configOriginal.titulo, subtitulo: configOriginal.subtitulo || "" }).catch(() => {});
  }
  await knex.destroy();
  console.log(falhas ? `\n${falhas} falha(s)` : "\nTodos os testes passaram.");
  process.exit(falhas ? 1 : 0);
}
