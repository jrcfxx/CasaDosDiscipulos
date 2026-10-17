import jwt from "jsonwebtoken";
import knex from "../database/index.js";
import { UnauthorizedError } from "../utils/AppError.js";

/**
 * Middleware para verificar e validar o token JWT
 * Extrai informações do usuário e adiciona ao objeto req
 * Revalida se o usuário ainda está ativo no banco
 */
const verificarToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return next(new UnauthorizedError("Token não fornecido"));
  }

  const parts = authHeader.split(" ");

  // Formato esperado: "Bearer <token>"
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next(new UnauthorizedError("Formato de token inválido"));
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await knex("usuario")
      .select("id_usuario", "tipo", "ativo")
      .where("id_usuario", decoded.id_usuario)
      .first();

    if (!usuario || !usuario.ativo) {
      return next(
        new UnauthorizedError("Usuário inativo ou não encontrado. Faça login novamente.")
      );
    }

    req.usuario = {
      id_usuario: usuario.id_usuario,
      tipo: usuario.tipo,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new UnauthorizedError("Token expirado. Faça login novamente.")
      );
    }

    if (err.name === "JsonWebTokenError") {
      return next(new UnauthorizedError("Token inválido"));
    }

    return next(new UnauthorizedError("Falha na autenticação"));
  }
};

export default verificarToken;
