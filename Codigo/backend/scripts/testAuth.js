/**
 * Teste de integração da autenticação — banco de DESENVOLVIMENTO.
 * Cadastro público fechado, primeiro acesso com troca obrigatória, regras de senha,
 * sessões derrubadas ao trocar/redefinir a senha e login sem revelar contas.
 * Cria e apaga seus próprios usuários. Uso: node scripts/testAuth.js
 */
import express from "express";
import bcrypt from "bcrypt";
import knex from "../src/database/index.js";
import authRoutes from "../src/routes/authRoutes.js";
import usuarioRoutes from "../src/routes/usuarioRoutes.js";
import ModuloRoutes from "../src/routes/ModuloRoutes.js";
import errorHandler from "../src/middlewares/errorHandler.js";
import { gerarToken } from "../src/services/authService.js";
import { validarNovaSenha } from "../src/utils/senha.js";

if (process.env.NODE_ENV === "production") {
  console.error("Não rode este teste em produção.");
  process.exit(1);
}

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "OK  " : "FAIL"} ${msg}`);
  if (!cond) falhas += 1;
};

const sufixo = Date.now();
const criados = [];

async function criarUsuario(dados) {
  const [id] = await knex("usuario").insert({
    nome: "Teste Auth",
    email: `teste.auth.${sufixo}.${criados.length}@exemplo.com`,
    tipo: "membro",
    ativo: true,
    lider_celula: false,
    ...dados,
    senha: await bcrypt.hash(dados.senha, 10),
  });
  criados.push(id);
  return knex("usuario").where({ id_usuario: id }).first();
}

function testeRegrasDeSenha() {
  const pessoa = { telefone: "31999990000", email: "maria@exemplo.com" };
  ok(validarNovaSenha("curta", pessoa) !== null, "senha com menos de 8 caracteres é recusada");
  ok(validarNovaSenha("31999990000", pessoa) !== null, "o próprio telefone é recusado como senha");
  ok(validarNovaSenha("12345678", pessoa) !== null, "sequência numérica é recusada");
  ok(validarNovaSenha("aaaaaaaa", pessoa) !== null, "caractere repetido é recusado");
  ok(validarNovaSenha("maria@exemplo.com", pessoa) !== null, "o próprio e-mail é recusado");
  ok(validarNovaSenha("Casa da Fé 2026", pessoa) === null, "senha boa é aceita");
}

async function testeApi() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/usuarios", usuarioRoutes);
  app.use("/api/modulo", ModuloRoutes);
  app.use(errorHandler);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;
  // Token da sessão vem no cookie HttpOnly "cd_sessao" (Set-Cookie); aqui é reenviado como Bearer
  const lerSetCookie = (r) => (r.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("cd_sessao=")) ?? null;
  const chamar = async (metodo, caminho, tk, corpo, extras = {}) => {
    const r = await fetch(base + caminho, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
        ...extras,
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const setCookie = lerSetCookie(r);
    const token = setCookie ? decodeURIComponent(setCookie.split(";")[0].split("=").slice(1).join("=")) : null;
    return { status: r.status, corpo: await r.json().catch(() => ({})), token, setCookie };
  };

  try {
    // Cadastro público fechado
    const reg = await chamar("POST", "/auth/register", null, { nome: "Intruso", email: "x@x.com", senha: "12345678" });
    ok(reg.status === 404, `cadastro público não existe mais (${reg.status})`);

    // Primeiro acesso: senha = telefone, troca obrigatória
    const novo = await criarUsuario({ senha: "31988887777", telefone: "31988887777", trocar_senha: true });
    const login = await chamar("POST", "/auth/login", null, { email: novo.email, senha: "31988887777" });
    ok(login.status === 200 && login.corpo.usuario?.trocar_senha === true, "login informa que precisa criar senha");
    ok(!login.corpo.token, "o token NÃO vem no corpo da resposta (JavaScript da página não o vê)");
    ok(/HttpOnly/i.test(login.setCookie || "") && /SameSite=Strict/i.test(login.setCookie || "") && /Path=\/api/i.test(login.setCookie || ""),
      "sessão em cookie HttpOnly, SameSite=Strict, só para /api");
    const tk1 = login.token;

    const bloqueado = await chamar("GET", "/modulo/active", tk1);
    ok(bloqueado.status === 403 && bloqueado.corpo.codigo === "TROCAR_SENHA", "com senha provisória, o resto do sistema fica bloqueado (403 TROCAR_SENHA)");
    const perfil = await chamar("GET", "/usuarios/perfil", tk1);
    ok(perfil.status === 200, "perfil continua acessível para montar a tela de nova senha");

    const fraca = await chamar("POST", "/auth/senha", tk1, { senhaAtual: "31988887777", novaSenha: "31988887777" });
    ok(fraca.status === 400, "não aceita o telefone como nova senha");
    const atualErrada = await chamar("POST", "/auth/senha", tk1, { senhaAtual: "errada", novaSenha: "Nova senha forte 1" });
    ok(atualErrada.status === 400, "exige a senha atual correta");

    const troca = await chamar("POST", "/auth/senha", tk1, { senhaAtual: "31988887777", novaSenha: "Nova senha forte 1" });
    ok(troca.status === 200 && troca.token && troca.corpo.usuario?.trocar_senha === false, "troca a senha e recebe sessão nova");
    const tk2 = troca.token;

    const antigo = await chamar("GET", "/usuarios/perfil", tk1);
    ok(antigo.status === 401, "token anterior à troca deixa de valer (401)");
    const liberado = await chamar("GET", "/modulo/active", tk2);
    ok(liberado.status === 200, "com a senha própria, o sistema é liberado");

    // Login não revela contas: e-mail inexistente e senha errada dão a mesma resposta
    const semConta = await chamar("POST", "/auth/login", null, { email: `ninguem.${sufixo}@exemplo.com`, senha: "qualquer1" });
    const senhaErrada = await chamar("POST", "/auth/login", null, { email: novo.email, senha: "qualquer1" });
    ok(semConta.status === 401 && semConta.corpo.error === senhaErrada.corpo.error, "e-mail inexistente e senha errada têm a mesma resposta");
    const inativo = await criarUsuario({ senha: "Senha boa 123", ativo: false });
    const inativoErrada = await chamar("POST", "/auth/login", null, { email: inativo.email, senha: "errada123" });
    ok(inativoErrada.corpo.error === senhaErrada.corpo.error, "conta desativada não é revelada a quem não sabe a senha");

    // Admin redefine a senha: gera temporária, derruba sessões e obriga nova troca
    const admin = await knex("usuario").where({ tipo: "administrador", ativo: true }).first();
    const tkAdmin = gerarToken(admin);
    const membroTk = gerarToken({ ...novo, sessao_versao: 1 });
    const naoAdmin = await chamar("POST", `/usuarios/${novo.id_usuario}/redefinir-senha`, membroTk);
    ok(naoAdmin.status === 403, "membro não redefine senha de ninguém");
    const red = await chamar("POST", `/usuarios/${novo.id_usuario}/redefinir-senha`, tkAdmin);
    ok(red.status === 200 && /^[A-Za-z0-9]{10}$/.test(red.corpo.senha_temporaria || ""), "admin recebe uma senha temporária de 10 caracteres");
    const depois = await chamar("GET", "/usuarios/perfil", tk2);
    ok(depois.status === 401, "sessão aberta cai quando o admin redefine a senha");
    const comTemp = await chamar("POST", "/auth/login", null, { email: novo.email, senha: red.corpo.senha_temporaria });
    ok(comTemp.status === 200 && comTemp.corpo.usuario?.trocar_senha === true, "entrar com a temporária obriga criar nova senha");

    // Perfil: e-mail só muda com a senha atual; foto só do próprio servidor
    const tk3 = (await chamar("POST", "/auth/senha", comTemp.token, { senhaAtual: red.corpo.senha_temporaria, novaSenha: "Outra senha forte 2" })).token;
    const semSenha = await chamar("PUT", "/usuarios/perfil", tk3, { email: `trocado.${sufixo}@exemplo.com` });
    ok(semSenha.status === 400, "trocar o e-mail sem a senha atual é recusado");
    const comSenha = await chamar("PUT", "/usuarios/perfil", tk3, { email: `trocado.${sufixo}@exemplo.com`, senhaAtual: "Outra senha forte 2" });
    ok(comSenha.status === 200 && comSenha.corpo.email === `trocado.${sufixo}@exemplo.com`, "trocar o e-mail com a senha atual funciona");
    const fotoExterna = await chamar("PUT", "/usuarios/perfil", tk3, { foto: "https://rastreador.exemplo/pixel.gif" });
    ok(fotoExterna.status === 400, "foto de perfil com URL externa é recusada");

    // Sessão por cookie (como o navegador usa) e proteção CSRF
    const cookie = { Cookie: `cd_sessao=${encodeURIComponent(tk3)}` };
    const leituraCookie = await chamar("GET", "/usuarios/perfil", null, null, cookie);
    ok(leituraCookie.status === 200, "o cookie de sessão autentica as leituras");
    const csrf = await chamar("PUT", "/usuarios/perfil", null, { nome: "Teste Auth CSRF" }, cookie);
    ok(csrf.status === 403, "alteração via cookie SEM o cabeçalho X-Requested-With é bloqueada (CSRF)");
    const comCabecalho = await chamar("PUT", "/usuarios/perfil", null, { nome: "Teste Auth Cookie" }, { ...cookie, "X-Requested-With": "XMLHttpRequest" });
    ok(comCabecalho.status === 200 && comCabecalho.corpo.nome === "Teste Auth Cookie", "alteração via cookie COM o cabeçalho funciona");

    const sair = await chamar("POST", "/auth/logout", null, null, cookie);
    ok(sair.status === 200 && /cd_sessao=;/.test(sair.setCookie || "") , "logout apaga o cookie de sessão");

    const convertido = await chamar("POST", "/auth/sessao", tk3, null);
    ok(convertido.status === 200 && convertido.token === tk3, "token antigo (Bearer) é convertido em cookie sem novo login");
    const semBearer = await chamar("POST", "/auth/sessao", null, null, { ...cookie, "X-Requested-With": "XMLHttpRequest" });
    ok(semBearer.status === 400, "conversão exige o token antigo no cabeçalho");
  } finally {
    server.close();
  }
}

try {
  testeRegrasDeSenha();
  await testeApi();
} catch (err) {
  console.error("Erro:", err);
  falhas += 1;
} finally {
  if (criados.length) await knex("usuario").whereIn("id_usuario", criados).del();
  await knex.destroy();
  console.log(falhas ? `\n${falhas} falha(s)` : "\nTodos os testes de autenticação passaram.");
  process.exit(falhas ? 1 : 0);
}
