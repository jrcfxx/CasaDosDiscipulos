import jwt from "jsonwebtoken";
import knex from "../database/index.js";
import { UnauthorizedError, ForbiddenError } from "../utils/AppError.js";
import { JWT_ALGORITMO } from "../services/authService.js";

/**
 * Rotas liberadas enquanto a pessoa ainda precisa criar a própria senha
 * (primeiro acesso ou senha redefinida pelo admin).
 */
const LIBERADAS_SEM_SENHA_PROPRIA = new Set(["POST /api/auth/senha", "GET /api/usuarios/perfil"]);

/**
 * Valida o token JWT e revalida no banco a cada requisição:
 *  - usuário ainda existe e está ativo;
 *  - a sessão não foi encerrada por troca/redefinição de senha (sessao_versao);
 *  - quem ainda usa senha provisória só acessa a troca de senha.
 */
const verificarToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return next(new UnauthorizedError("Token não fornecido"));
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next(new UnauthorizedError("Formato de token inválido"));
  }

  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET, { algorithms: [JWT_ALGORITMO] });

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
