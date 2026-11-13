import AuthService from "../services/authService.js";
import { HTTP_STATUS } from "../utils/constants.js";
import { gravarCookieSessao, limparCookieSessao } from "../utils/cookieSessao.js";

const AuthController = {
  /** POST /api/auth/login — a sessão vai num cookie HttpOnly (o token não aparece para o JavaScript) */
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      const { usuario, token } = await AuthService.login(email, senha);
      gravarCookieSessao(res, token);
      res.status(HTTP_STATUS.OK).json({ message: "Login realizado com sucesso", usuario });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/auth/senha — a própria pessoa troca a senha; recebe sessão nova */
  async trocarSenha(req, res, next) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      const { usuario, token } = await AuthService.trocarSenha(req.usuario.id_usuario, senhaAtual, novaSenha);
      gravarCookieSessao(res, token);
      res.status(HTTP_STATUS.OK).json({ message: "Senha alterada com sucesso", usuario });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/auth/logout — apaga o cookie de sessão */
  async logout(req, res) {
    limparCookieSessao(res);
    res.status(HTTP_STATUS.OK).json({ message: "Sessão encerrada" });
  },

  /**
   * POST /api/auth/sessao — transição: quem ainda tem o token antigo (enviado como Bearer)
   * recebe a sessão em cookie, sem precisar entrar de novo.
   */
  async converterSessao(req, res) {
    const [tipo, token] = String(req.headers.authorization || "").split(" ");
    if (tipo !== "Bearer" || !token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Envie o token antigo no cabeçalho Authorization" });
    }
    gravarCookieSessao(res, token);
    res.status(HTTP_STATUS.OK).json({ message: "Sessão atualizada" });
  },
};

export default AuthController;
