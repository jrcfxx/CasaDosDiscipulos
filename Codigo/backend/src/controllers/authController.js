import AuthService from "../services/authService.js";
import { HTTP_STATUS } from "../utils/constants.js";

const AuthController = {
  /** POST /api/auth/login */
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      const { usuario, token } = await AuthService.login(email, senha);
      res.status(HTTP_STATUS.OK).json({ message: "Login realizado com sucesso", usuario, token });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/auth/senha — a própria pessoa troca a senha; devolve token novo */
  async trocarSenha(req, res, next) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      const { usuario, token } = await AuthService.trocarSenha(req.usuario.id_usuario, senhaAtual, novaSenha);
      res.status(HTTP_STATUS.OK).json({ message: "Senha alterada com sucesso", usuario, token });
    } catch (error) {
      next(error);
    }
  },
};

export default AuthController;
