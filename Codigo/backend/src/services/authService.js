import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import knex from "../database/index.js";
import UsuarioModel from "../models/UsuarioModel.js";
import NotificacaoModel from "../models/NotificacaoModel.js";
import { UnauthorizedError, ValidationError, TooManyRequestsError } from "../utils/AppError.js";
import { validarNovaSenha, gerarSenhaTemporaria } from "../utils/senha.js";
import { cifrar, decifrar } from "../utils/criptografia.js";
import {
  gerarSegredoTotp, verificarCodigoTotp, uriOtpAuth, gerarCodigosRecuperacao, hashCodigoRecuperacao,
} from "../utils/totp.js";
import SessaoService, { MOTIVOS_REVOGACAO } from "./SessaoService.js";
import RegistroSegurancaService, { EVENTOS, descreverDispositivo, userAgentDaRequisicao } from "./RegistroSegurancaService.js";

export const JWT_ALGORITMO = "HS256";
/** Custo do bcrypt. Senhas com custo menor são refeitas no próximo login (sem a pessoa perceber). */
export const BCRYPT_CUSTO = 12;
/** Prazo para digitar o código do 2FA depois de acertar a senha */
const DESAFIO_2FA_SEG = 5 * 60;

/**
 * Bloqueio temporário por senha errada (vale também para código 2FA errado):
 * a cada 5 erros seguidos a conta fica bloqueada — 15 min na 1ª vez, 1 hora a partir da 2ª.
 * Sem erros por 24 h a contagem recomeça. Acertar a senha zera.
 */
export const BLOQUEIO = Object.freeze({ tentativas: 5, minutos: 15, minutosReincidente: 60 });

// Hash fixo para comparar quando o e-mail não existe: o tempo de resposta fica igual
// e não dá para descobrir quais e-mails têm conta.
const HASH_FALSO = bcrypt.hashSync("conta-inexistente", BCRYPT_CUSTO);

/**
 * E-mails sem conta também "bloqueiam" depois de 5 erros (só em memória). Assim a mensagem de bloqueio
 * aparece igual para contas que existem e que não existem — ninguém descobre quem tem conta.
 */
const falhasSemConta = new Map();
function falhaSemConta(email) {
  const agora = Date.now();
  if (falhasSemConta.size > 5000) falhasSemConta.clear();
  const atual = falhasSemConta.get(email);
  const n = atual && agora - atual.ultima < 24 * 3600e3 ? atual.n + 1 : 1;
  const minutos = n % BLOQUEIO.tentativas === 0 ? (n > BLOQUEIO.tentativas ? BLOQUEIO.minutosReincidente : BLOQUEIO.minutos) : 0;
  falhasSemConta.set(email, { n, ultima: agora, ate: minutos ? agora + minutos * 60e3 : atual?.ate || 0 });
  return minutos;
}
function bloqueioSemConta(email) {
  const atual = falhasSemConta.get(email);
  return atual && atual.ate > Date.now() ? Math.ceil((atual.ate - Date.now()) / 60e3) : 0;
}

function mensagemBloqueio(minutos) {
  return `Muitas tentativas erradas. Por segurança, o acesso desta conta foi pausado por ${minutos} minuto${minutos === 1 ? "" : "s"}. ` +
    "Se esqueceu a senha, fale com a secretaria.";
}

/** Token de sessão. `sid` = sessão no servidor; `sv` = versão da senha (trocar a senha invalida tokens antigos). */
export function gerarToken(usuario, id_sessao, validadeSeg) {
  return jwt.sign(
    { id_usuario: Number(usuario.id_usuario), tipo: usuario.tipo, sv: Number(usuario.sessao_versao || 0), sid: id_sessao },
    process.env.JWT_SECRET,
    { expiresIn: validadeSeg, algorithm: JWT_ALGORITMO }
  );
}

/** Dados que podem ir para a tela (sem senha, segredo do 2FA, contadores internos) */
export function semSenha(usuario) {
  const {
    senha: _s, sessao_versao: _v, totp_segredo: _t, totp_ultimo_passo: _p, codigos_recuperacao: _c,
    tentativas_falhas: _f, ultima_falha_em: _u, bloqueado_ate: _b, ...resto
  } = usuario;
  return { ...resto, trocar_senha: Boolean(usuario.trocar_senha), totp_ativo: Boolean(usuario.totp_ativo) };
}

/** Minutos que faltam de bloqueio (0 = livre) */
async function minutosBloqueado(id_usuario) {
  const [linhas] = await knex.raw(
    "SELECT CEIL(TIMESTAMPDIFF(SECOND, NOW(), bloqueado_ate) / 60) AS minutos FROM usuario WHERE id_usuario = ? AND bloqueado_ate > NOW()",
    [id_usuario]
  );
  return Number(linhas?.[0]?.minutos || 0);
}

/** Conta mais um erro; bloqueia ao chegar no limite. @returns {Promise<number>} minutos de bloqueio aplicados (0 = não bloqueou) */
async function registrarFalha(usuario, req, motivo) {
  await knex("usuario")
    .where({ id_usuario: usuario.id_usuario })
    .update({
      tentativas_falhas: knex.raw("IF(ultima_falha_em IS NULL OR ultima_falha_em < NOW() - INTERVAL 1 DAY, 1, tentativas_falhas + 1)"),
      ultima_falha_em: knex.fn.now(),
    });
  const { tentativas_falhas: n } = await knex("usuario").where({ id_usuario: usuario.id_usuario }).first("tentativas_falhas");

  await RegistroSegurancaService.registrar(req, {
    evento: EVENTOS.LOGIN, resultado: "falha", id_usuario: usuario.id_usuario, email: usuario.email,
    detalhes: { motivo, tentativa: n },
  });

  if (n % BLOQUEIO.tentativas !== 0) return 0;
  const minutos = n > BLOQUEIO.tentativas ? BLOQUEIO.minutosReincidente : BLOQUEIO.minutos;
  await knex("usuario")
    .where({ id_usuario: usuario.id_usuario })
    .update({ bloqueado_ate: knex.raw("NOW() + INTERVAL ? MINUTE", [minutos]) });
  await RegistroSegurancaService.registrar(req, {
    evento: EVENTOS.CONTA_BLOQUEADA, resultado: "bloqueado", id_usuario: usuario.id_usuario, email: usuario.email,
    detalhes: { minutos, tentativas: n },
  });
  await NotificacaoModel.create({
    id_usuario: usuario.id_usuario,
    tipo: "seguranca",
    titulo: "Acesso à sua conta pausado",
    mensagem:
      `Erraram a senha da sua conta ${n} vezes seguidas, então o acesso ficou pausado por ${minutos} minutos. ` +
      "Se não foi você, troque sua senha em Perfil → Segurança.",
  }).catch(() => {});
  return minutos;
}

async function zerarFalhas(id_usuario) {
  await knex("usuario").where({ id_usuario }).update({ tentativas_falhas: 0, ultima_falha_em: null, bloqueado_ate: null });
}

/** Cria a sessão e registra o login. @returns {{ usuario, token, maximaSeg }} */
async function concluirLogin(usuario, req, detalhes = {}) {
  const { id_sessao, maximaSeg } = await SessaoService.criar(usuario, req);
  await UsuarioModel.updateLastLogin(usuario.id_usuario);
  await RegistroSegurancaService.registrar(req, {
    evento: EVENTOS.LOGIN, resultado: "sucesso", id_usuario: usuario.id_usuario, email: usuario.email, detalhes,
  });

  // Aviso de acesso por um aparelho novo (não avisa no primeiro acesso da vida)
  const dispositivo = descreverDispositivo(userAgentDaRequisicao(req));
  try {
    if ((await SessaoService.jaTeveSessao(usuario.id_usuario, id_sessao)) &&
        !(await SessaoService.aparelhoConhecido(usuario.id_usuario, dispositivo, id_sessao))) {
      await NotificacaoModel.create({
        id_usuario: usuario.id_usuario,
        tipo: "seguranca",
        titulo: "Novo acesso à sua conta",
        mensagem: `Sua conta foi acessada em um aparelho novo (${dispositivo}). ` +
          "Se não foi você, troque sua senha e encerre esse acesso em Perfil → Segurança.",
      });
    }
  } catch {
    /* aviso é opcional */
  }

  return { usuario: semSenha(usuario), token: gerarToken(usuario, id_sessao, maximaSeg), maximaSeg };
}

/** Confere código do app autenticador ou código de recuperação. Atualiza o banco (uso único). */
async function conferirSegundoFator(usuario, codigo, req) {
  const digitado = String(codigo ?? "").trim();
  if (/^\d{6}$/.test(digitado.replace(/\s/g, ""))) {
    const segredo = decifrar(usuario.totp_segredo);
    if (!segredo) return false;
    const passo = verificarCodigoTotp(segredo, digitado, usuario.totp_ultimo_passo);
    if (passo == null) return false;
    // Uso único mesmo com duas requisições ao mesmo tempo
    const n = await knex("usuario")
      .where({ id_usuario: usuario.id_usuario })
      .where((q) => q.whereNull("totp_ultimo_passo").orWhere("totp_ultimo_passo", "<", passo))
      .update({ totp_ultimo_passo: passo });
    return n === 1;
  }

  const hashes = JSON.parse(usuario.codigos_recuperacao || "[]");
  const hash = hashCodigoRecuperacao(digitado);
  if (!hashes.includes(hash)) return false;
  const restantes = hashes.filter((h) => h !== hash);
  const n = await knex("usuario")
    .where({ id_usuario: usuario.id_usuario, codigos_recuperacao: usuario.codigos_recuperacao })
    .update({ codigos_recuperacao: JSON.stringify(restantes) });
  if (n !== 1) return false;
  await RegistroSegurancaService.registrar(req, {
    evento: EVENTOS.CODIGO_RECUPERACAO_USADO, id_usuario: usuario.id_usuario, detalhes: { restantes: restantes.length },
  });
  return true;
}

const AuthService = {
  /**
   * Passo 1 do login: e-mail e senha.
   * @returns {Promise<{ usuario, token, maximaSeg } | { precisa2fa: true, desafio: string }>}
   */
  async login(email, senha, req = null) {
    if (!email || !senha) {
      throw new ValidationError("Email e senha são obrigatórios");
    }
    const emailNormalizado = String(email).trim().toLowerCase();
    const usuario = await UsuarioModel.getByEmail(emailNormalizado);

    // Bloqueada: nem confere a senha (não dá para continuar tentando durante o bloqueio)
    const bloqueio = usuario ? await minutosBloqueado(usuario.id_usuario) : bloqueioSemConta(emailNormalizado);
    if (bloqueio > 0) {
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.LOGIN, resultado: "bloqueado", id_usuario: usuario?.id_usuario, email: emailNormalizado,
        detalhes: { motivo: "conta_bloqueada" },
      });
      throw new TooManyRequestsError(mensagemBloqueio(bloqueio));
    }

    const senhaCorreta = await bcrypt.compare(String(senha), usuario?.senha || HASH_FALSO);
    if (!usuario || !senhaCorreta) {
      let minutos;
      if (usuario) {
        minutos = await registrarFalha(usuario, req, "senha_incorreta");
      } else {
        minutos = falhaSemConta(emailNormalizado);
        await RegistroSegurancaService.registrar(req, {
          evento: EVENTOS.LOGIN, resultado: "falha", email: emailNormalizado, detalhes: { motivo: "conta_inexistente" },
        });
      }
      if (minutos) throw new TooManyRequestsError(mensagemBloqueio(minutos));
      throw new UnauthorizedError("E-mail ou senha incorretos");
    }

    // Só informa "desativado" depois de conferir a senha (não revela contas a terceiros)
    if (!usuario.ativo) {
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.LOGIN, resultado: "falha", id_usuario: usuario.id_usuario, email: emailNormalizado,
        detalhes: { motivo: "conta_desativada" },
      });
      throw new UnauthorizedError("Usuário desativado. Contate o administrador.");
    }

    // Senha guardada com custo antigo: refaz o hash agora que temos a senha certa
    if (bcrypt.getRounds(usuario.senha) < BCRYPT_CUSTO) {
      await knex("usuario").where({ id_usuario: usuario.id_usuario })
        .update({ senha: await bcrypt.hash(String(senha), BCRYPT_CUSTO) });
    }

    if (usuario.totp_ativo) {
      // Senha certa, mas ainda falta o código: não zera os erros nem cria sessão
      const desafio = jwt.sign(
        { id_usuario: Number(usuario.id_usuario), sv: Number(usuario.sessao_versao || 0), fim: "2fa" },
        process.env.JWT_SECRET,
        { expiresIn: DESAFIO_2FA_SEG, algorithm: JWT_ALGORITMO }
      );
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.LOGIN_2FA_PENDENTE, id_usuario: usuario.id_usuario, email: emailNormalizado,
      });
      return { precisa2fa: true, desafio, validadeSeg: DESAFIO_2FA_SEG };
    }

    await zerarFalhas(usuario.id_usuario);
    return concluirLogin(usuario, req);
  },

  /** Passo 2 do login (só para quem ativou o 2FA): código do app ou de recuperação */
  async loginSegundoFator(desafio, codigo, req = null) {
    let dados;
    try {
      dados = jwt.verify(String(desafio || ""), process.env.JWT_SECRET, { algorithms: [JWT_ALGORITMO] });
    } catch {
      throw new UnauthorizedError("O tempo para digitar o código acabou. Entre com sua senha de novo.");
    }
    if (dados.fim !== "2fa") throw new UnauthorizedError("Entre com sua senha de novo.");

    const usuario = await knex("usuario").where({ id_usuario: dados.id_usuario }).first();
    if (!usuario || !usuario.ativo || !usuario.totp_ativo || Number(usuario.sessao_versao || 0) !== Number(dados.sv)) {
      throw new UnauthorizedError("Entre com sua senha de novo.");
    }
    const bloqueio = await minutosBloqueado(usuario.id_usuario);
    if (bloqueio > 0) throw new TooManyRequestsError(mensagemBloqueio(bloqueio));

    if (!(await conferirSegundoFator(usuario, codigo, req))) {
      const minutos = await registrarFalha(usuario, req, "codigo_2fa_incorreto");
      if (minutos) throw new TooManyRequestsError(mensagemBloqueio(minutos));
      throw new ValidationError("Código incorreto ou vencido. Confira no aplicativo e tente de novo.");
    }

    await zerarFalhas(usuario.id_usuario);
    const atualizado = await knex("usuario").where({ id_usuario: usuario.id_usuario }).first();
    return concluirLogin(atualizado, req, { dois_fatores: true });
  },

  /** Sair: encerra a sessão no servidor (o token deixa de valer mesmo se alguém tiver copiado) */
  async logout(sessao, req) {
    if (!sessao?.id_sessao) return;
    await SessaoService.revogar(sessao.id_sessao, MOTIVOS_REVOGACAO.LOGOUT);
    await RegistroSegurancaService.registrar(req, { evento: EVENTOS.LOGOUT, id_usuario: sessao.id_usuario });
  },

  /**
   * A própria pessoa troca a senha (primeiro acesso ou Perfil).
   * Derruba as outras sessões; esta continua com um token novo.
   */
  async trocarSenha(id_usuario, senhaAtual, novaSenha, req = null) {
    if (!senhaAtual || !novaSenha) {
      throw new ValidationError("Informe a senha atual e a nova senha");
    }
    const usuario = await knex("usuario").where({ id_usuario }).first();
    if (!usuario) throw new UnauthorizedError("Usuário não encontrado");

    if (!(await bcrypt.compare(String(senhaAtual), usuario.senha))) {
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.SENHA_ALTERADA, resultado: "falha", id_usuario, detalhes: { motivo: "senha_atual_incorreta" },
      });
      throw new ValidationError("Senha atual incorreta");
    }
    const erro = validarNovaSenha(novaSenha, usuario);
    if (erro) throw new ValidationError(erro);
    if (await bcrypt.compare(String(novaSenha), usuario.senha)) {
      throw new ValidationError("A nova senha precisa ser diferente da atual");
    }

    await knex("usuario")
      .where({ id_usuario })
      .update({
        senha: await bcrypt.hash(String(novaSenha), BCRYPT_CUSTO),
        trocar_senha: false,
        sessao_versao: knex.raw("sessao_versao + 1"),
      });

    const sessaoAtual = req?.sessao?.id_sessao || null;
    const encerradas = await SessaoService.revogarDoUsuario(id_usuario, MOTIVOS_REVOGACAO.SENHA_ALTERADA, { exceto: sessaoAtual });
    await RegistroSegurancaService.registrar(req, {
      evento: EVENTOS.SENHA_ALTERADA, id_usuario, detalhes: { primeiro_acesso: Boolean(usuario.trocar_senha), sessoes_encerradas: encerradas },
    });

    const atualizado = await knex("usuario").where({ id_usuario }).first();
    if (sessaoAtual) {
      const { maximaSeg } = await knex("sessao")
        .where({ id_sessao: sessaoAtual })
        .first(knex.raw("GREATEST(TIMESTAMPDIFF(SECOND, NOW(), expira_em), 60) AS maximaSeg"));
      return { usuario: semSenha(atualizado), token: gerarToken(atualizado, sessaoAtual, Number(maximaSeg)), maximaSeg: Number(maximaSeg) };
    }
    return { usuario: semSenha(atualizado), token: null };
  },

  /** Admin redefine a senha: gera uma temporária, derruba as sessões, tira o bloqueio e obriga a troca. */
  async redefinirSenha(id_usuario, req = null) {
    const usuario = await knex("usuario").where({ id_usuario }).first();
    if (!usuario) throw new ValidationError("Usuário não encontrado");
    const senha_temporaria = gerarSenhaTemporaria();
    await knex("usuario")
      .where({ id_usuario })
      .update({
        senha: await bcrypt.hash(senha_temporaria, BCRYPT_CUSTO),
        trocar_senha: true,
        sessao_versao: knex.raw("sessao_versao + 1"),
        tentativas_falhas: 0,
        ultima_falha_em: null,
        bloqueado_ate: null,
      });
    const encerradas = await SessaoService.revogarDoUsuario(id_usuario, MOTIVOS_REVOGACAO.SENHA_REDEFINIDA);
    await RegistroSegurancaService.registrar(req, {
      evento: EVENTOS.SENHA_REDEFINIDA, id_usuario, id_ator: req?.usuario?.id_usuario, detalhes: { sessoes_encerradas: encerradas },
    });
    return { senha_temporaria };
  },

  // ==================== Verificação em duas etapas (2FA) ====================

  async statusDoisFatores(id_usuario) {
    const u = await knex("usuario").where({ id_usuario }).first("totp_ativo", "codigos_recuperacao");
    return {
      ativo: Boolean(u?.totp_ativo),
      codigos_restantes: u?.totp_ativo ? JSON.parse(u.codigos_recuperacao || "[]").length : 0,
    };
  },

  /** Gera um segredo novo (ainda inativo) e devolve o QR code para ler no app */
  async iniciarDoisFatores(id_usuario) {
    const usuario = await knex("usuario").where({ id_usuario }).first("email", "totp_ativo");
    if (usuario.totp_ativo) throw new ValidationError("A verificação em duas etapas já está ativa.");
    const segredo = gerarSegredoTotp();
    await knex("usuario").where({ id_usuario }).update({ totp_segredo: cifrar(segredo), totp_ultimo_passo: null });
    const uri = uriOtpAuth(segredo, usuario.email);
    return { segredo, uri, qrcode: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) };
  },

  /** Confirma o primeiro código e ativa. Devolve os códigos de recuperação (mostrados uma vez só). */
  async ativarDoisFatores(id_usuario, codigo, req = null) {
    const usuario = await knex("usuario").where({ id_usuario }).first();
    if (usuario.totp_ativo) throw new ValidationError("A verificação em duas etapas já está ativa.");
    const segredo = usuario.totp_segredo ? decifrar(usuario.totp_segredo) : null;
    if (!segredo) throw new ValidationError("Comece a configuração de novo.");
    const passo = verificarCodigoTotp(segredo, codigo, null);
    if (passo == null) throw new ValidationError("Código incorreto. Confira se o horário do celular está certo e tente de novo.");

    const codigos = gerarCodigosRecuperacao();
    await knex("usuario").where({ id_usuario }).update({
      totp_ativo: true,
      totp_ultimo_passo: passo,
      codigos_recuperacao: JSON.stringify(codigos.map(hashCodigoRecuperacao)),
    });
    await SessaoService.revogarDoUsuario(id_usuario, MOTIVOS_REVOGACAO.DOIS_FATORES, { exceto: req?.sessao?.id_sessao });
    await RegistroSegurancaService.registrar(req, { evento: EVENTOS.DOIS_FATORES_ATIVADO, id_usuario });
    return { codigos_recuperacao: codigos };
  },

  /** Desligar exige a senha e um código (quem roubou só a sessão não consegue desligar) */
  async desativarDoisFatores(id_usuario, senha, codigo, req = null) {
    const usuario = await knex("usuario").where({ id_usuario }).first();
    if (!usuario.totp_ativo) throw new ValidationError("A verificação em duas etapas não está ativa.");
    if (!(await bcrypt.compare(String(senha ?? ""), usuario.senha))) throw new ValidationError("Senha incorreta");
    if (!(await conferirSegundoFator(usuario, codigo, req))) throw new ValidationError("Código incorreto");
    await knex("usuario").where({ id_usuario }).update({
      totp_ativo: false, totp_segredo: null, totp_ultimo_passo: null, codigos_recuperacao: null,
    });
    await RegistroSegurancaService.registrar(req, { evento: EVENTOS.DOIS_FATORES_DESATIVADO, id_usuario });
  },

  /** Novos códigos de recuperação (os antigos deixam de valer) */
  async novosCodigosRecuperacao(id_usuario, codigo, req = null) {
    const usuario = await knex("usuario").where({ id_usuario }).first();
    if (!usuario.totp_ativo) throw new ValidationError("A verificação em duas etapas não está ativa.");
    if (!(await conferirSegundoFator(usuario, codigo, req))) throw new ValidationError("Código incorreto");
    const codigos = gerarCodigosRecuperacao();
    await knex("usuario").where({ id_usuario }).update({ codigos_recuperacao: JSON.stringify(codigos.map(hashCodigoRecuperacao)) });
    await RegistroSegurancaService.registrar(req, { evento: EVENTOS.CODIGOS_RECUPERACAO_GERADOS, id_usuario });
    return { codigos_recuperacao: codigos };
  },

  /** Admin: pessoa perdeu o celular e os códigos. Remove o 2FA e encerra as sessões dela. */
  async removerDoisFatores(id_usuario, req = null) {
    const usuario = await knex("usuario").where({ id_usuario }).first("totp_ativo");
    if (!usuario) throw new ValidationError("Usuário não encontrado");
    if (!usuario.totp_ativo) throw new ValidationError("Essa pessoa não usa verificação em duas etapas.");
    await knex("usuario").where({ id_usuario }).update({
      totp_ativo: false, totp_segredo: null, totp_ultimo_passo: null, codigos_recuperacao: null,
    });
    await SessaoService.revogarDoUsuario(id_usuario, MOTIVOS_REVOGACAO.DOIS_FATORES);
    await RegistroSegurancaService.registrar(req, {
      evento: EVENTOS.DOIS_FATORES_REMOVIDO, id_usuario, id_ator: req?.usuario?.id_usuario,
    });
    await NotificacaoModel.create({
      id_usuario, tipo: "seguranca", titulo: "Verificação em duas etapas removida",
      mensagem: "A secretaria removeu a verificação em duas etapas da sua conta. Você pode ativá-la de novo em Perfil → Segurança.",
    }).catch(() => {});
  },
};

export default AuthService;
