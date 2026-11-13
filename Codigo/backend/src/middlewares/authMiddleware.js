import jwt from "jsonwebtoken";
import knex from "../database/index.js";
import { UnauthorizedError, ForbiddenError } from "../utils/AppError.js";
import { JWT_ALGORITMO } from "../services/authService.js";
import { COOKIE_SESSAO, lerCookie } from "../utils/cookieSessao.js";

/**
 * Rotas liberadas enquanto a pessoa ainda precisa criar a própria senha
 * (primeiro acesso ou senha redefinida pelo admin).
 */
const LIBERADAS_SEM_SENHA_PROPRIA = new Set([
  "POST /api/auth/senha",
  "POST /api/auth/sessao",
  "GET /api/usuarios/perfil",
]);

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * De onde vem a sessão:
 *  - navegador: cookie HttpOnly "cd_sessao" (o JavaScript da página não lê o token);
 *  - scripts, testes e a transição do token antigo: cabeçalho "Authorization: Bearer <token>".
 */
function obterToken(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedError("Formato de token inválido");
    }
    return { token: parts[1], viaCookie: false };
  }
  const doCookie = lerCookie(req, COOKIE_SESSAO);
  return doCookie ? { token: doCookie, viaCookie: true } : null;
}

/**
 * Valida a sessão e revalida no banco a cada requisição:
 *  - usuário ainda existe e está ativo;
 *  - a sessão não foi encerrada por troca/redefinição de senha (sessao_versao);
 *  - quem ainda usa senha provisória só acessa a troca de senha;
 *  - CSRF: com cookie, requisições que alteram dados precisam do cabeçalho X-Requested-With
 *    (outro site não consegue enviá-lo sem a permissão do CORS).
 */
const verificarToken = async (req, res, next) => {
  try {
    const origem = obterToken(req);
    if (!origem) {
      return next(new UnauthorizedError("Faça login para continuar."));
    }

    if (origem.viaCookie && !METODOS_SEGUROS.has(req.method) && req.headers["x-requested-with"] !== "XMLHttpRequest") {
      return next(new ForbiddenError("Requisição bloqueada por segurança. Recarregue a página e tente de novo."));
    }

    const decoded = jwt.verify(origem.token, process.env.JWT_SECRET, { algorithms: [JWT_ALGORITMO] });

    const usuario = await knex("usuario")
      .select("id_usuario", "tipo", "ativo", "trocar_senha", "sessao_versao")
      .where("id_usuario", decoded.id_usuario)
      .first();

    if (!usuario || !usuario.ativo) {
      return next(new UnauthorizedError("Usuário inativo ou não encontrado. Faça login novamente."));
    }

    if (Number(decoded.sv || 0) !== Number(usuario.sessao_versao || 0)) {
      return next(new UnauthorizedError("Sua sessão foi encerrada porque a senha foi alterada. Entre novamente."));
    }

    if (usuario.trocar_senha) {
      const rota = `${req.method} ${req.baseUrl}${req.path}`.replace(/\/$/, "");
      if (!LIBERADAS_SEM_SENHA_PROPRIA.has(rota)) {
        const erro = new ForbiddenError("Crie sua senha para continuar.");
        erro.codigo = "TROCAR_SENHA";
        return next(erro);
      }
    }

    req.usuario = { id_usuario: usuario.id_usuario, tipo: usuario.tipo };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Sua sessão expirou. Entre novamente."));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new UnauthorizedError("Sua sessão não é mais válida. Entre novamente."));
    }
    return next(err.isOperational ? err : new UnauthorizedError("Falha na autenticação"));
  }
};

export default verificarToken;
