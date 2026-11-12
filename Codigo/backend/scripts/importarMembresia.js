/**
 * Reorganiza o banco com os dados reais da igreja.
 *
 * O que faz (tudo numa transação: se algo falhar, nada muda):
 *   1. APAGA os dados de todas as tabelas, exceto a estrutura que guarda imagens ou foi
 *      cadastrada à mão: células, eventos (carrossel), Staff, ministérios e site_config.
 *      Os arquivos de imagem em uploads/ não são tocados.
 *   2. Recria os níveis da Escola de Discipulado (Discipulado 1 a 9, Liderança Cristã, + de Deus).
 *   3. Importa os membros do arquivo JSON (senha inicial = telefone, só números).
 *   4. Liga os líderes de ministério da planilha e religa, pelo nome, os líderes/membros
 *      das células e os membros dos ministérios que existiam antes.
 *
 * Os dados pessoais NÃO ficam no Git (repositório público): o JSON fica em dados/ (ignorado).
 * Formato: ver scripts/membresia.exemplo.json
 *
 * Uso:
 *   node scripts/importarMembresia.js dados/membresia.json              # simulação, não grava
 *   node scripts/importarMembresia.js dados/membresia.json --confirmar  # grava
 *   # no servidor, lendo o arquivo da máquina host pela entrada padrão:
 *   docker compose exec -T backend node scripts/importarMembresia.js - --confirmar < membresia.json
 *
 * Depois, crie o administrador: npm run admin:setup (ver scripts/setupAdmin.js).
 */
import fs from "node:fs";
import bcrypt from "bcrypt";
import knex from "../src/database/index.js";
import { normalizarTelefone } from "../src/utils/formatUtils.js";

/** Tabelas cujos dados são mantidos */
const MANTER = new Set([
  "knex_migrations",
  "knex_migrations_lock",
  "celula",
  "evento",
  "staff_item",
  "site_config",
  "ministerio",
  "ministerio_paralelismo",
]);

const FUNDAMENTOS = "Fundamentos";
const DESPERTAR = "Despertar";
const ROMPER = "Romper";

/** Níveis da Escola de Discipulado (ordem = progressão) */
export const NIVEIS = [
  { nome: "Discipulado 1 – Ser Casa", fase: FUNDAMENTOS, descricao: "Através deste módulo você poderá conhecer a nossa Casa e se preparar para o batismo. Aqui também você que está vindo de outras congregações poderá fazer um check-up da sua vida espiritual." },
  { nome: "Discipulado 2 – Intensa devoção", fase: FUNDAMENTOS, descricao: "Como um discípulo fiel a Cristo, a sua vida devocional é prioridade máxima. Através deste módulo você poderá aprofundar e ativar sua vida devocional." },
  { nome: "Discipulado 3 – O discípulo e a Cruz", fase: FUNDAMENTOS, descricao: "Não existe vida cristã sem a cruz. Por meio deste estudo você entenderá como a cruz opera em sua vida trazendo libertação e amadurecimento espiritual." },
  { nome: "Discipulado 4 – Seguindo o Mestre", fase: FUNDAMENTOS, descricao: "Ser discípulo é o que nascemos pra ser. Entender a diferença de uma vida religiosa e viver o discipulado fará uma verdadeira revolução na sua vida!" },
  { nome: "Discipulado 5 – Dons e ministérios", fase: DESPERTAR, descricao: "Você nasceu com um propósito e desde o ventre da sua mãe você já foi marcado para servir a Deus através dos seus dons e ministérios. Você já sabe como Deus quer usar você?" },
  { nome: "Discipulado 6 – Uma igreja para a cidade", fase: DESPERTAR, descricao: "A natureza geme, clama pela manifestação dos filhos de Deus. Você carrega a resposta à mensagem mais revolucionária de todos os tempos. Venha aprender sobre evangelismo e a obra missionária." },
  { nome: "Discipulado 7 – Reino e batalha espiritual", fase: DESPERTAR, descricao: "O Reino de Deus já foi estabelecido! É de suma importância aprendermos sobre os fundamentos do Reino de Deus e como o mundo espiritual funciona. Venha ser equipado como um soldado de Cristo." },
  { nome: "Discipulado 8 – Introdução à escatologia", fase: DESPERTAR, descricao: "Há uma bênção para aquele que lê e se aprofunda no livro do Apocalipse. Venha mergulhar nesta fonte profética para os últimos dias." },
  { nome: "Discipulado 9 – Liderando um pequeno grupo", fase: DESPERTAR, descricao: "Preparação para liderar um pequeno grupo." },
  { nome: "Liderança Cristã", fase: ROMPER, descricao: "Através deste curso você será formado para liderar em sua geração. Prepare-se para servir com excelência." },
  { nome: "+ de Deus", fase: ROMPER, descricao: "Cursos sobre várias áreas da espiritualidade e maturidade cristã. Fique atento: sempre novidades por aqui!" },
];

/** Minúsculas, sem acento, só letras: usado para comparar nomes */
export function tokensNome(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !["de", "da", "do", "dos", "das"].includes(t));
}

/**
 * Acha, entre os novos usuários, a mesma pessoa de um nome antigo.
 * Casa se o primeiro nome e mais um nome coincidirem; ou, se o antigo tem um nome só
 * (ou não houver outro em comum), se o primeiro nome for único entre os novos.
 */
export function casarPorNome(nomeAntigo, novos) {
  const [primeiro, ...resto] = tokensNome(nomeAntigo);
  if (!primeiro) return null;
  const mesmoPrimeiro = novos.filter((n) => tokensNome(n.nome)[0] === primeiro);
  const fortes = mesmoPrimeiro.filter((n) => {
    const t = tokensNome(n.nome);
    return resto.some((r) => t.includes(r));
  });
  if (fortes.length === 1) return fortes[0];
  if (fortes.length === 0 && mesmoPrimeiro.length === 1) return mesmoPrimeiro[0];
  return null;
}

function validar(pessoas) {
  const erros = [];
  const emails = new Map();
  pessoas.forEach((p, i) => {
    const onde = `#${i + 1} ${p.nome || "(sem nome)"}`;
    if (!p.nome?.trim()) erros.push(`${onde}: sem nome`);
    const email = String(p.email || "").trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) erros.push(`${onde}: e-mail inválido "${p.email}"`);
    if (emails.has(email)) erros.push(`${onde}: e-mail repetido com ${emails.get(email)}`);
    emails.set(email, p.nome);
    if (!["membro", "lider"].includes(p.tipo)) erros.push(`${onde}: tipo deve ser "membro" ou "lider"`);
    if (!(Number.isInteger(p.discipulado) && p.discipulado >= 1 && p.discipulado <= NIVEIS.length)) {
      erros.push(`${onde}: discipulado deve ser 1 a ${NIVEIS.length}`);
    }
    const digitos = String(p.telefone || "").replace(/\D/g, "");
    if (digitos.length < 6) erros.push(`${onde}: telefone (senha inicial) precisa de ao menos 6 dígitos`);
  });
  return erros;
}

async function lerEntrada(caminho) {
  if (caminho === "-") {
    const partes = [];
    for await (const parte of process.stdin) partes.push(parte);
    return Buffer.concat(partes).toString("utf8");
  }
  return fs.readFileSync(caminho, "utf8");
}

async function main() {
  const caminho = process.argv[2];
  const confirmar = process.argv.includes("--confirmar");
  if (!caminho) throw new Error("Informe o arquivo: node scripts/importarMembresia.js dados/membresia.json [--confirmar]");

  const pessoas = JSON.parse(await lerEntrada(caminho));
  if (!Array.isArray(pessoas) || pessoas.length === 0) throw new Error("O arquivo deve ser uma lista de pessoas");
  const erros = validar(pessoas);
  if (erros.length) throw new Error("Corrija o arquivo:\n  " + erros.join("\n  "));

  // Vínculos atuais, para religar pelo nome depois da limpeza
  const antes = {
    celulaLider: await knex("celula_lider as cl")
      .join("usuario as u", "u.id_usuario", "cl.id_usuario")
      .join("celula as c", "c.id_celula", "cl.id_celula")
      .select("cl.id_celula", "cl.principal", "u.nome", "c.nome as celula"),
    celulaMembro: await knex("usuario_celula as uc")
      .join("usuario as u", "u.id_usuario", "uc.id_usuario")
      .select("uc.*", "u.nome"),
    ministerioMembro: await knex("usuario_ministerio as um")
      .join("usuario as u", "u.id_usuario", "um.id_usuario")
      .select("um.id_ministerio", "u.nome"),
  };

  const tabelas = (await knex.raw("SHOW TABLES"))[0].map((linha) => Object.values(linha)[0]);
  const limpar = tabelas.filter((t) => !MANTER.has(t));

  console.log(confirmar ? "== IMPORTANDO (grava no banco) ==" : "== SIMULAÇÃO (nada será gravado; use --confirmar) ==");
  console.log(`Banco: ${process.env.DB_NAME || "(padrão)"} em ${process.env.DB_HOST || "localhost"}`);
  console.log(`\nTabelas mantidas: ${tabelas.filter((t) => MANTER.has(t)).join(", ")}`);
  console.log(`Tabelas apagadas (${limpar.length}): ${limpar.join(", ")}`);

  const senhas = new Map();
  for (const p of pessoas) {
    senhas.set(p, await bcrypt.hash(String(p.telefone).replace(/\D/g, ""), 10));
  }

  const resumo = await knex.transaction(async (trx) => {
    await trx.raw("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const t of limpar) await trx(t).del();
    } finally {
      await trx.raw("SET FOREIGN_KEY_CHECKS = 1");
    }

    // Níveis
    const idNivel = [];
    for (const [i, n] of NIVEIS.entries()) {
      const [id] = await trx("nivel").insert({
        nome: n.nome,
        descricao: `${n.fase} — ${n.descricao}`,
        ordem: i + 1,
        ativo: true,
      });
      idNivel.push(id);
    }

    // Ministérios: usa os existentes pelo nome; cria os que faltarem
    const ministerios = await trx("ministerio").select("id_ministerio", "nome");
    const idMinisterio = new Map(ministerios.map((m) => [tokensNome(m.nome).join(" "), m.id_ministerio]));
    const criados = [];
    async function ministerioPorNome(nome) {
      const chave = tokensNome(nome).join(" ");
      if (!idMinisterio.has(chave)) {
        const [{ ordem = 0 } = {}] = await trx("ministerio").max({ ordem: "ordem" });
        const [id] = await trx("ministerio").insert({ nome, ativo: true, ordem: Number(ordem) + 1 });
        idMinisterio.set(chave, id);
        criados.push(nome);
      }
      return idMinisterio.get(chave);
    }

    // Usuários
    const novos = [];
    const avisos = [];
    for (const p of pessoas) {
      const lideraMinisterio = (p.ministerios_lider || []).length > 0;
      const telefone = normalizarTelefone(p.telefone);
      if (!telefone) avisos.push(`${p.nome}: telefone "${p.telefone}" fora do padrão, ficou sem telefone (a senha continua sendo esses dígitos)`);
      const [id] = await trx("usuario").insert({
        nome: p.nome.trim(),
        email: p.email.trim().toLowerCase(),
        senha: senhas.get(p),
        tipo: p.tipo,
        telefone,
        id_nivel: idNivel[p.discipulado - 1],
        lider_celula: p.tipo === "lider" && !!p.lider_celula,
        lider_ministerio: lideraMinisterio,
        ativo: true,
        pontuacao: 0,
      });
      novos.push({ id_usuario: id, nome: p.nome });
      for (const m of p.ministerios_lider || []) {
        const idM = await ministerioPorNome(m);
        await trx("ministerio_lider").insert({ id_ministerio: idM, id_usuario: id });
        await trx("usuario_ministerio").insert({ id_ministerio: idM, id_usuario: id }).onConflict().ignore();
      }
    }

    // Religa vínculos antigos pelo nome
    const religados = { celulaLider: [], semLider: [] };
    for (const v of antes.celulaLider) {
      const u = casarPorNome(v.nome, novos);
      if (u) {
        await trx("celula_lider").insert({ id_celula: v.id_celula, id_usuario: u.id_usuario, principal: v.principal }).onConflict().ignore();
        await trx("usuario").where({ id_usuario: u.id_usuario }).update({ tipo: "lider", lider_celula: true });
        religados.celulaLider.push(`${v.celula}: ${v.nome} -> ${u.nome}`);
      } else {
        religados.semLider.push(`${v.celula}: ${v.nome} (não está na planilha)`);
      }
    }
    let membrosCelula = 0;
    for (const v of antes.celulaMembro) {
      const u = casarPorNome(v.nome, novos);
      if (!u) continue;
      const { id_usuario_celula: _id, id_usuario: _u, nome: _n, ...resto } = v;
      await trx("usuario_celula").insert({ ...resto, id_usuario: u.id_usuario }).onConflict().ignore();
      membrosCelula++;
    }
    let membrosMinisterio = 0;
    for (const v of antes.ministerioMembro) {
      const u = casarPorNome(v.nome, novos);
      if (!u) continue;
      await trx("usuario_ministerio").insert({ id_ministerio: v.id_ministerio, id_usuario: u.id_usuario }).onConflict().ignore();
      membrosMinisterio++;
    }

    const celulasSemLider = await trx("celula as c")
      .leftJoin("celula_lider as cl", "cl.id_celula", "c.id_celula")
      .whereNull("cl.id_celula_lider")
      .pluck("c.nome");

    const resumo = { novos, criados, avisos, religados, membrosCelula, membrosMinisterio, celulasSemLider };
    if (!confirmar) {
      // Simulação: desfaz tudo
      const erro = new Error("simulacao");
      erro.resumo = resumo;
      throw erro;
    }
    return resumo;
  }).catch((e) => {
    if (e.message === "simulacao") return e.resumo;
    throw e;
  });

  const porNivel = {};
  for (const p of pessoas) porNivel[NIVEIS[p.discipulado - 1].nome] = (porNivel[NIVEIS[p.discipulado - 1].nome] || 0) + 1;
  console.log(`\nNíveis criados: ${NIVEIS.length}`);
  for (const [n, q] of Object.entries(porNivel)) console.log(`  ${n}: ${q} pessoa(s)`);
  console.log(`\nUsuários importados: ${resumo.novos.length} (${pessoas.filter((p) => p.tipo === "lider").length} líderes)`);
  if (resumo.criados.length) console.log(`Ministérios criados: ${resumo.criados.join(", ")}`);
  console.log(`\nLíderes de célula religados:\n  ${resumo.religados.celulaLider.join("\n  ") || "(nenhum)"}`);
  if (resumo.religados.semLider.length) console.log(`Líderes antigos não encontrados:\n  ${resumo.religados.semLider.join("\n  ")}`);
  if (resumo.celulasSemLider.length) console.log(`Células sem líder agora: ${resumo.celulasSemLider.join(", ")}`);
  console.log(`Membros de célula religados: ${resumo.membrosCelula} | membros de ministério religados: ${resumo.membrosMinisterio}`);
  const provisorios = pessoas.filter((p) => p.email_provisorio);
  if (provisorios.length) console.log(`\nE-mails provisórios (trocar quando souber o real):\n  ${provisorios.map((p) => `${p.nome}: ${p.email}`).join("\n  ")}`);
  if (resumo.avisos.length) console.log(`\nAvisos:\n  ${resumo.avisos.join("\n  ")}`);
  console.log(
    confirmar
      ? "\n✅ Importação concluída. Senha inicial de cada pessoa = telefone (só números).\n   Agora crie o administrador: npm run admin:setup"
      : "\nNada foi gravado. Rode de novo com --confirmar para aplicar."
  );
}

main()
  .then(() => knex.destroy())
  .catch(async (err) => {
    console.error("Erro:", err.message);
    await knex.destroy();
    process.exit(1);
  });
