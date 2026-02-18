import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../utils/AppError.js";

/**
 * Middleware para verificar e validar o token JWT
 * Extrai informações do usuário e adiciona ao objeto req
 */
const verificarToken = (req, res, next) => {
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

    // Adiciona dados do usuário ao request
    req.usuario = {
      id_usuario: decoded.id_usuario,
      tipo: decoded.tipo,
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
