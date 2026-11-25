import AuthService from "../services/authService.js";
import SessaoService, { MOTIVOS_REVOGACAO, resolverReferencia } from "../services/SessaoService.js";
import RegistroSegurancaService, { EVENTOS } from "../services/RegistroSegurancaService.js";
import { lerSessao } from "../middlewares/authMiddleware.js";
import { HTTP_STATUS } from "../utils/constants.js";
import { NotFoundError } from "../utils/AppError.js";
import {
  COOKIE_DESAFIO_2FA, gravarCookieSessao, limparCookieSessao, gravarCookieDesafio, limparCookieDesafio, lerCookie,
} from "../utils/cookieSessao.js";

const AuthController = {
  /**
   * POST /api/auth/login — a sessão vai num cookie HttpOnly (o token não aparece para o JavaScript).
   * Com 2FA ativo, responde { precisa_2fa: true } e o próximo passo é /login/2fa.
   */
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      const r = await AuthService.login(email, senha, req);
      if (r.precisa2fa) {
        gravarCookieDesafio(res, r.desafio, r.validadeSeg);
        return res.status(HTTP_STATUS.OK).json({ precisa_2fa: true, message: "Digite o código do aplicativo autenticador" });
      }
      gravarCookieSessao(res, r.token, r.maximaSeg);
      res.status(HTTP_STATUS.OK).json({ message: "Login realizado com sucesso", usuario: r.usuario });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/auth/login/2fa — segundo passo: código do app ou de recuperação */
  async loginSegundoFator(req, res, next) {
    try {
      const r = await AuthService.loginSegundoFator(lerCookie(req, COOKIE_DESAFIO_2FA), req.body?.codigo, req);
      limparCookieDesafio(res);
      gravarCookieSessao(res, r.token, r.maximaSeg);
      res.status(HTTP_STATUS.OK).json({ message: "Login realizado com sucesso", usuario: r.usuario });
    } catch (error) {
      if (error.statusCode === 401) limparCookieDesafio(res);
      next(error);
    }
  },

  /** POST /api/auth/senha — a própria pessoa troca a senha; outras sessões caem */
  async trocarSenha(req, res, next) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      const r = await AuthService.trocarSenha(req.usuario.id_usuario, senhaAtual, novaSenha, req);
      if (r.token) gravarCookieSessao(res, r.token, r.maximaSeg);
      res.status(HTTP_STATUS.OK).json({ message: "Senha alterada com sucesso", usuario: r.usuario });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/auth/logout — encerra a sessão no servidor e apaga o cookie */
  async logout(req, res) {
    try {
      const sessao = await lerSessao(req);
      if (sessao) await AuthService.logout({ id_sessao: sessao.id_sessao, id_usuario: sessao.usuario.id_usuario }, req);
    } catch {
      // Sessão já inválida: só apaga o cookie
    }
    limparCookieSessao(res);
    limparCookieDesafio(res);
    res.status(HTTP_STATUS.OK).json({ message: "Sessão encerrada" });
  },

  /** GET /api/auth/sessoes — aparelhos conectados na própria conta */
  async minhasSessoes(req, res, next) {
    try {
      res.json(await SessaoService.listarDoUsuario(req.usuario.id_usuario, req.sessao.id_sessao));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /api/auth/sessoes/:referencia — encerra um aparelho da própria conta */
  async encerrarMinhaSessao(req, res, next) {
    try {
      const id = await resolverReferencia(req.params.referencia, { id_usuario: req.usuario.id_usuario });
      if (!id) throw new NotFoundError("Esse acesso já foi encerrado.");
      await SessaoService.revogar(id, MOTIVOS_REVOGACAO.PELO_USUARIO);
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.SESSAO_ENCERRADA, id_usuario: req.usuario.id_usuario, id_ator: req.usuario.id_usuario,
        detalhes: { atual: id === req.sessao.id_sessao },
      });
      if (id === req.sessao.id_sessao) limparCookieSessao(res);
      res.json({ message: "Acesso encerrado" });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/auth/sessoes/encerrar-outras — sai de todos os outros aparelhos */
  async encerrarOutrasSessoes(req, res, next) {
    try {
      const n = await SessaoService.revogarDoUsuario(req.usuario.id_usuario, MOTIVOS_REVOGACAO.PELO_USUARIO, {
        exceto: req.sessao.id_sessao,
      });
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.SESSOES_ENCERRADAS, id_usuario: req.usuario.id_usuario, id_ator: req.usuario.id_usuario,
        detalhes: { quantidade: n },
      });
      res.json({ message: n ? `${n} acesso(s) encerrado(s)` : "Não havia outros acessos abertos", encerradas: n });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/auth/acessos — histórico recente de segurança da própria conta */
  async meusAcessos(req, res, next) {
    try {
      res.json(await RegistroSegurancaService.listarDoUsuario(req.usuario.id_usuario, 20));
    } catch (error) {
      next(error);
    }
  },

  // ---------- 2FA ----------
  async statusDoisFatores(req, res, next) {
    try {
      res.json(await AuthService.statusDoisFatores(req.usuario.id_usuario));
    } catch (error) {
      next(error);
    }
  },

  async iniciarDoisFatores(req, res, next) {
    try {
      res.set("Cache-Control", "no-store");
      res.json(await AuthService.iniciarDoisFatores(req.usuario.id_usuario));
    } catch (error) {
      next(error);
    }
  },

  async ativarDoisFatores(req, res, next) {
    try {
      res.set("Cache-Control", "no-store");
      res.json(await AuthService.ativarDoisFatores(req.usuario.id_usuario, req.body?.codigo, req));
    } catch (error) {
      next(error);
    }
  },

  async desativarDoisFatores(req, res, next) {
    try {
      await AuthService.desativarDoisFatores(req.usuario.id_usuario, req.body?.senha, req.body?.codigo, req);
      res.json({ message: "Verificação em duas etapas desativada" });
    } catch (error) {
      next(error);
    }
  },

  async novosCodigosRecuperacao(req, res, next) {
    try {
      res.set("Cache-Control", "no-store");
      res.json(await AuthService.novosCodigosRecuperacao(req.usuario.id_usuario, req.body?.codigo, req));
    } catch (error) {
      next(error);
    }
  },
};

export default AuthController;
