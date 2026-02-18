import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UsuarioModel from "../models/UsuarioModel.js";
import { UnauthorizedError, ValidationError } from "../utils/AppError.js";

/**
 * Service para operações de autenticação
 * Contém lógica de negócio relacionada a registro, login, validação de credenciais e geração de tokens
 */
const AuthService = {
  /**
   * Registra um novo usuário
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.nome - Nome completo
   * @param {string} userData.email - Email
   * @param {string} userData.senha - Senha
   * @param {string} userData.tipo - Tipo de usuário (administrador, lider, membro)
   * @returns {Promise<Object>} Usuário criado (sem senha)
   * @throws {ValidationError} Se dados forem inválidos
   * @throws {ConflictError} Se email já estiver em uso
   */
  async register({ nome, email, senha, tipo = "membro" }) {
    // Validações
    if (!nome || !email || !senha) {
      throw new ValidationError("Nome, email e senha são obrigatórios");
    }

    if (senha.length < 6) {
      throw new ValidationError("Senha deve ter no mínimo 6 caracteres");
    }

    // Verifica se email já existe
    const usuarioExistente = await UsuarioModel.getByEmail(email);
    if (usuarioExistente) {
      throw new ValidationError("Email já está em uso");
    }

    // Valida tipo de usuário
    const tiposValidos = ["administrador", "lider", "membro"];
    if (!tiposValidos.includes(tipo)) {
      throw new ValidationError(
        `Tipo de usuário inválido. Use: ${tiposValidos.join(", ")}`
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria usuário
    const novoUsuario = await UsuarioModel.create({
      nome,
      email,
      senha: senhaHash,
      tipo,
      pontuacao: 0,
      ativo: true,
    });

    // Busca usuário completo
    const usuario = await UsuarioModel.getById(novoUsuario.id_usuario);

    // Remove senha antes de retornar
    delete usuario.senha;

    return usuario;
  },

  /**
   * Realiza login do usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Promise<Object>} Objeto contendo usuário e token JWT
   * @throws {ValidationError} Se email ou senha não forem fornecidos
   * @throws {UnauthorizedError} Se credenciais forem inválidas
   */
  async login(email, senha) {
    // Validação de campos obrigatórios
    if (!email || !senha) {
      throw new ValidationError("Email e senha são obrigatórios");
    }

    // Busca usuário pelo email
    const usuario = await UsuarioModel.getByEmail(email);
    if (!usuario) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    // Verifica se usuário está ativo
    if (!usuario.ativo) {
      throw new UnauthorizedError(
        "Usuário desativado. Contate o administrador."
      );
    }

    // Valida senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    // Atualiza último login
    await UsuarioModel.updateLastLogin(usuario.id_usuario);

    // Gera token JWT
    const token = jwt.sign(
      {
        id_usuario: Number(usuario.id_usuario),
        tipo: usuario.tipo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token expira em 7 dias
    );

    // Remove senha antes de retornar
    delete usuario.senha;

    return { usuario, token };
  },

  /**
   * Atualiza senha do usuário
   * @param {number} id_usuario - ID do usuário
   * @param {string} senhaAtual - Senha atual do usuário
   * @param {string} novaSenha - Nova senha
   * @returns {Promise<void>}
   * @throws {ValidationError} Se senhas não forem válidas
   * @throws {UnauthorizedError} Se senha atual estiver incorreta
   */
  async updatePassword(id_usuario, senhaAtual, novaSenha) {
    // Validações
    if (!senhaAtual || !novaSenha) {
      throw new ValidationError("Senha atual e nova senha são obrigatórias");
    }

    if (novaSenha.length < 6) {
      throw new ValidationError("Nova senha deve ter no mínimo 6 caracteres");
    }

    // Busca usuário com senha
    const usuario = await UsuarioModel.getByEmail(
      (
        await UsuarioModel.getById(id_usuario)
      ).email
    );

    if (!usuario) {
      throw new UnauthorizedError("Usuário não encontrado");
    }

    // Verifica senha atual
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaCorreta) {
      throw new UnauthorizedError("Senha atual incorreta");
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualiza senha
    await UsuarioModel.update(id_usuario, { senha: senhaHash });
  },
};

export default AuthService;
