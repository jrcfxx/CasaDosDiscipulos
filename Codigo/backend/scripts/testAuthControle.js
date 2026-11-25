/**
 * Parte do testAuth.js: controle de acesso (sessões, bloqueio, 2FA, painel de segurança).
 * Recebe o contexto do teste principal (servidor de teste, helpers e limpeza).
 */
const SENHA = "Senha de teste 9";
const UA_WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
const UA_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1";

const pronto = (ctx) => ctx.criarUsuario({ senha: SENHA, trocar_senha: false });
const logar = (ctx, u, senha = SENHA, ua = UA_WINDOWS) =>
  ctx.chamar("POST", "/auth/login", null, { email: u.email, senha }, { "User-Agent": ua });

export async function testeSessoes(ctx) {
  const { chamar, ok, knex, bcrypt } = ctx;
  const u = await pronto(ctx);
  const a = await logar(ctx, u, SENHA, UA_WINDOWS);
  const hash = await knex("usuario").where({ id_usuario: u.id_usuario }).first("senha");
  ok(bcrypt.getRounds(hash.senha) === 12, "senha com custo antigo (10) é refeita com bcrypt custo 12 no login");

  const b = await logar(ctx, u, SENHA, UA_IPHONE);
  const lista = await chamar("GET", "/auth/sessoes", a.token);
  ok(lista.status === 200 && lista.corpo.length === 2, `lista os 2 aparelhos conectados (${lista.corpo.length})`);
  ok(lista.corpo.filter((s) => s.atual).length === 1, "marca qual é o aparelho atual");
  ok(lista.corpo.every((s) => !s.id_sessao && s.referencia), "o id real da sessão não sai para a tela");
  ok(lista.corpo.some((s) => s.dispositivo === "Safari no iPhone"), "descreve o aparelho (Safari no iPhone)");

  const notif = await knex("notificacao").where({ id_usuario: u.id_usuario, tipo: "seguranca" }).first();
  ok(notif?.titulo === "Novo acesso à sua conta", "avisa a pessoa quando entram por um aparelho novo");

  const outra = lista.corpo.find((s) => !s.atual);
  ok((await chamar("DELETE", `/auth/sessoes/${outra.referencia}`, a.token)).status === 200, "encerra o outro aparelho");
  ok((await chamar("GET", "/usuarios/perfil", b.token)).status === 401, "o aparelho encerrado cai na hora");
  ok((await chamar("GET", "/usuarios/perfil", a.token)).status === 200, "o aparelho atual continua");

  const alheio = await pronto(ctx);
  const c = await logar(ctx, alheio);
  const refAlheia = (await chamar("GET", "/auth/sessoes", c.token)).corpo[0].referencia;
  ok((await chamar("DELETE", `/auth/sessoes/${refAlheia}`, a.token)).status === 404, "não encerra sessão de outra pessoa");

  await logar(ctx, u);
  await logar(ctx, u);
  const outras = await chamar("POST", "/auth/sessoes/encerrar-outras", a.token);
  ok(outras.status === 200 && outras.corpo.encerradas === 2, "\"sair dos outros aparelhos\" encerra os demais");

  // Inatividade: sessão parada há mais de 7 dias cai
  await knex("sessao").where({ id_usuario: u.id_usuario }).whereNull("revogada_em")
    .update({ ultimo_uso: knex.raw("NOW() - INTERVAL 8 DAY") });
  const ociosa = await chamar("GET", "/usuarios/perfil", a.token);
  ok(ociosa.status === 401 && /inatividade/.test(ociosa.corpo.error || ""), "sessão parada há mais de 7 dias é encerrada por inatividade");

  // Desativar a conta derruba as sessões
  await chamar("PATCH", `/usuarios/${alheio.id_usuario}/toggle`, ctx.tkAdmin);
  ok((await chamar("GET", "/usuarios/perfil", c.token)).status === 401, "desativar a conta derruba as sessões dela");
  const reg = await knex("log_seguranca").where({ id_usuario: alheio.id_usuario, evento: "usuario_desativado" }).first();
  ok(reg?.id_ator, "desativação fica registrada com quem fez");
}

export async function testeBloqueio(ctx) {
  const { chamar, ok, knex, sufixo } = ctx;
  const u = await pronto(ctx);
  const erros = [];
  for (let i = 0; i < 5; i += 1) erros.push(await logar(ctx, u, `errada-${i}`));
  ok(erros.slice(0, 4).every((r) => r.status === 401), "4 senhas erradas: resposta normal");
  ok(erros[4].status === 429 && /15 minutos/.test(erros[4].corpo.error || ""), "5ª senha errada pausa a conta por 15 minutos");
  ok((await logar(ctx, u)).status === 429, "durante o bloqueio, nem a senha certa entra");

  // E-mail sem conta tem o mesmo comportamento (não revela quem tem cadastro)
  const fantasma = { email: `fantasma.${sufixo}@exemplo.com` };
  const errosF = [];
  for (let i = 0; i < 5; i += 1) errosF.push(await logar(ctx, fantasma, `errada-${i}`));
  ok(errosF[4].status === 429 && errosF[4].corpo.error === erros[4].corpo.error, "e-mail sem conta \"bloqueia\" igual (não revela contas)");

  const bloqueio = await knex("log_seguranca").where({ id_usuario: u.id_usuario, evento: "conta_bloqueada" }).first();
  ok(bloqueio?.ip, "bloqueio fica no registro de segurança, com IP");
  const falhas = await knex("log_seguranca").where({ id_usuario: u.id_usuario, evento: "login", resultado: "falha" });
  ok(falhas.length === 5 && falhas.every((f) => !/errada/.test(f.detalhes || "")), "registra as 5 falhas sem guardar a senha digitada");

  const resumo = await chamar("GET", "/seguranca/resumo", ctx.tkAdmin);
  ok(resumo.corpo.contas_bloqueadas?.some((c) => c.id_usuario === u.id_usuario), "painel lista a conta bloqueada");
  ok((await chamar("POST", `/seguranca/usuarios/${u.id_usuario}/desbloquear`, ctx.tkAdmin)).status === 200, "admin libera a conta");
  ok((await logar(ctx, u)).status === 200, "depois de liberada, a senha certa entra");
}

export async function testeDoisFatores(ctx) {
  const { chamar, ok, knex, gerarCodigoTotp } = ctx;
  const u = await pronto(ctx);
  const tk = (await logar(ctx, u)).token;
  const ini = await chamar("POST", "/auth/2fa/iniciar", tk);
  ok(ini.status === 200 && /^data:image\/png;base64,/.test(ini.corpo.qrcode || "") && ini.corpo.segredo, "gera QR code e chave do 2FA");
  const guardado = await knex("usuario").where({ id_usuario: u.id_usuario }).first("totp_segredo");
  ok(guardado.totp_segredo && !guardado.totp_segredo.includes(ini.corpo.segredo), "segredo do 2FA fica criptografado no banco");
  ok((await chamar("POST", "/auth/2fa/ativar", tk, { codigo: "000000" })).status === 400, "código errado não ativa o 2FA");
  const at = await chamar("POST", "/auth/2fa/ativar", tk, { codigo: gerarCodigoTotp(ini.corpo.segredo) });
  ok(at.status === 200 && at.corpo.codigos_recuperacao?.length === 8, "ativa o 2FA e entrega 8 códigos de recuperação");
  ok((await chamar("GET", "/usuarios/perfil", tk)).status === 200, "a sessão que ativou continua");

  const passo1 = await logar(ctx, u);
  ok(passo1.status === 200 && passo1.corpo.precisa_2fa === true && !passo1.token, "com 2FA, a senha sozinha não cria sessão");
  ok(passo1.desafio, "a etapa do código fica num cookie HttpOnly temporário");
  const cookie2fa = { Cookie: passo1.desafio };
  ok((await chamar("POST", "/auth/login/2fa", null, { codigo: "123456" }, cookie2fa)).status === 400, "código errado é recusado");
  // Código do próximo intervalo de 30 s (o da ativação já foi usado)
  const codigo = gerarCodigoTotp(ini.corpo.segredo, Date.now() + 30000);
  const certo = await chamar("POST", "/auth/login/2fa", null, { codigo }, cookie2fa);
  ok(certo.status === 200 && certo.token, "código certo conclui o login");
  const repetido = await chamar("POST", "/auth/login/2fa", null, { codigo }, { Cookie: (await logar(ctx, u)).desafio });
  ok(repetido.status === 400, "o mesmo código não vale duas vezes");
  ok((await chamar("POST", "/auth/login/2fa", null, { codigo })).status === 401, "sem a etapa da senha, o código sozinho não entra");

  const rec = at.corpo.codigos_recuperacao[0];
  const comRec = await chamar("POST", "/auth/login/2fa", null, { codigo: rec.toUpperCase() }, { Cookie: (await logar(ctx, u)).desafio });
  ok(comRec.status === 200, "código de recuperação entra");
  const recDeNovo = await chamar("POST", "/auth/login/2fa", null, { codigo: rec }, { Cookie: (await logar(ctx, u)).desafio });
  ok(recDeNovo.status === 400, "código de recuperação só vale uma vez");
  const st = await chamar("GET", "/auth/2fa", comRec.token);
  ok(st.corpo.ativo === true && st.corpo.codigos_restantes === 7, "mostra quantos códigos de recuperação restam (7)");

  const semSenha = await chamar("POST", "/auth/2fa/desativar", comRec.token, { senha: "errada", codigo: at.corpo.codigos_recuperacao[1] });
  ok(semSenha.status === 400, "desligar o 2FA exige a senha");
  const sit = await chamar("GET", `/seguranca/usuarios/${u.id_usuario}`, ctx.tkAdmin);
  ok(sit.corpo.totp_ativo === true && sit.corpo.sessoes_ativas >= 1, "admin vê a situação de segurança da pessoa");
  ok((await chamar("DELETE", `/seguranca/usuarios/${u.id_usuario}/2fa`, ctx.tkAdmin)).status === 200, "admin remove o 2FA de quem perdeu o celular");
  ok((await chamar("GET", "/usuarios/perfil", comRec.token)).status === 401, "remover o 2FA derruba as sessões da pessoa");
  ok((await logar(ctx, u)).token, "sem 2FA, entra só com a senha");
}

export async function testePainel(ctx) {
  const { chamar, ok, knex } = ctx;
  const membro = await pronto(ctx);
  const tkMembro = (await logar(ctx, membro)).token;
  ok((await chamar("GET", "/seguranca/resumo", tkMembro)).status === 403, "membro não abre o painel de segurança");
  const negado = await knex("log_seguranca").where({ id_usuario: membro.id_usuario, evento: "acesso_negado" }).first();
  ok(negado && /seguranca/.test(negado.detalhes || ""), "tentativa de abrir área sem permissão vai para o registro");

  const r = await chamar("GET", "/seguranca/resumo", ctx.tkAdmin);
  ok(r.status === 200 && typeof r.corpo.ultimas_24h?.logins === "number", "admin vê o resumo de segurança");
  const ev = await chamar("GET", "/seguranca/eventos?evento=login&resultado=falha&porPagina=5", ctx.tkAdmin);
  ok(ev.status === 200 && ev.corpo.eventos.length > 0 && ev.corpo.eventos.every((e) => e.resultado === "falha"), "registro filtra falhas de login");
  const sess = await chamar("GET", "/seguranca/sessoes", ctx.tkAdmin);
  ok(sess.status === 200 && sess.corpo.length > 0 && sess.corpo.every((s) => !s.id_sessao), "admin lista sessões sem ver o id real");
}
