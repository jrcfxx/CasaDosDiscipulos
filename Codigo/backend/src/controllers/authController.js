import AuthService from "../services/authService.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Controller para operações de autenticação
 * Gerencia registro, login e troca de senha
 */
const AuthController = {
  /**
   * Registra um novo usuário
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { nome, email, senha, tipo } = req.body;
      const usuario = await AuthService.register({ nome, email, senha, tipo });

      res.status(HTTP_STATUS.CREATED).json({
        message: "Usuário registrado com sucesso",
        usuario,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Realiza login do usuário
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      const { usuario, token } = await AuthService.login(email, senha);

      res.status(HTTP_STATUS.OK).json({
        message: "Login realizado com sucesso",
        usuario,
        token,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Atualiza senha do usuário autenticado
   * PUT /api/auth/password
   */
  async updatePassword(req, res, next) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      const usuarioId = req.usuario?.id_usuario;

      await AuthService.updatePassword(usuarioId, senhaAtual, novaSenha);

      res.status(HTTP_STATUS.OK).json({
        message: "Senha atualizada com sucesso",
      });
    } catch (error) {
      next(error);
    }
  },
};

export default AuthController;
