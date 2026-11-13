import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import knex from "../database/index.js";
import UsuarioModel from "../models/UsuarioModel.js";
import { UnauthorizedError, ValidationError } from "../utils/AppError.js";
import { validarNovaSenha, gerarSenhaTemporaria } from "../utils/senha.js";

export const JWT_ALGORITMO = "HS256";
const JWT_VALIDADE = "7d";

// Hash fixo para comparar quando o e-mail não existe: o tempo de resposta fica igual
// e não dá para descobrir quais e-mails têm conta.
const HASH_FALSO = bcrypt.hashSync("conta-inexistente", 10);

/** Token de sessão. `sv` = versão da sessão: trocar a senha invalida os tokens antigos. */
export function gerarToken(usuario) {
  return jwt.sign(
    { id_usuario: Number(usuario.id_usuario), tipo: usuario.tipo, sv: Number(usuario.sessao_versao || 0) },
    process.env.JWT_SECRET,
    { expiresIn: JWT_VALIDADE, algorithm: JWT_ALGORITMO }
  );
}

function semSenha(usuario) {
  const { senha: _s, sessao_versao: _v, ...resto } = usuario;
  return { ...resto, trocar_senha: Boolean(usuario.trocar_senha) };
}

const AuthService = {
  async login(email, senha) {
    if (!email || !senha) {
      throw new ValidationError("Email e senha são obrigatórios");
    }

    const usuario = await UsuarioModel.getByEmail(String(email).trim().toLowerCase());
    const senhaCorreta = await bcrypt.compare(String(senha), usuario?.senha || HASH_FALSO);
    if (!usuario || !senhaCorreta) {
      throw new UnauthorizedError("E-mail ou senha incorretos");
    }

    // Só informa "desativado" depois de conferir a senha (não revela contas a terceiros)
    if (!usuario.ativo) {
      throw new UnauthorizedError("Usuário desativado. Contate o administrador.");
    }

    await UsuarioModel.updateLastLogin(usuario.id_usuario);
    return { usuario: semSenha(usuario), token: gerarToken(usuario) };
  },

  /**
   * A própria pessoa troca a senha (primeiro acesso ou Perfil).
   * Derruba as outras sessões e devolve um token novo para continuar logado.
   */
  async trocarSenha(id_usuario, senhaAtual, novaSenha) {
    if (!senhaAtual || !novaSenha) {
      throw new ValidationError("Informe a senha atual e a nova senha");
    }
    const usuario = await knex("usuario").where({ id_usuario }).first();
    if (!usuario) throw new UnauthorizedError("Usuário não encontrado");

    if (!(await bcrypt.compare(String(senhaAtual), usuario.senha))) {
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
        senha: await bcrypt.hash(String(novaSenha), 10),
        trocar_senha: false,
        sessao_versao: knex.raw("sessao_versao + 1"),
      });

    const atualizado = await knex("usuario").where({ id_usuario }).first();
    return { usuario: semSenha(atualizado), token: gerarToken(atualizado) };
  },

  /** Admin redefine a senha: gera uma temporária, derruba as sessões e obriga a troca. */
  async redefinirSenha(id_usuario) {
    const usuario = await knex("usuario").where({ id_usuario }).first();
    if (!usuario) throw new ValidationError("Usuário não encontrado");
    const senha_temporaria = gerarSenhaTemporaria();
    await knex("usuario")
      .where({ id_usuario })
      .update({
        senha: await bcrypt.hash(senha_temporaria, 10),
        trocar_senha: true,
        sessao_versao: knex.raw("sessao_versao + 1"),
      });
    return { senha_temporaria };
  },
};

export default AuthService;
