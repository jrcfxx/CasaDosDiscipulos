import { ForbiddenError } from "../utils/AppError.js";
import { USER_TYPES } from "../utils/constants.js";

/**
 * Middleware para verificar se o usuário tem permissão baseada em seu tipo
 * @param {Array<string>} allowedRoles - Array com os tipos de usuário permitidos
 * @returns {Function} Middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Verifica se o usuário está autenticado (authMiddleware deve vir antes)
    if (!req.usuario) {
      return next(
        new ForbiddenError("Usuário não autenticado. Faça login primeiro.")
      );
    }

    const userType = req.usuario.tipo;

    // Verifica se o tipo do usuário está na lista de permitidos
    if (!allowedRoles.includes(userType)) {
      return next(
        new ForbiddenError(
          `Acesso negado. Esta ação requer permissão de: ${allowedRoles.join(
            ", "
          )}`
        )
      );
    }

    next();
  };
};

/**
 * Middleware específico para permitir apenas administradores
 */
export const adminOnly = checkRole([USER_TYPES.ADMIN]);

/**
 * Middleware para permitir administradores e líderes
 */
export const adminAndLeader = checkRole([USER_TYPES.ADMIN, USER_TYPES.LEADER]);

/**
 * Middleware para permitir todos os tipos de usuários autenticados
 */
export const authenticatedOnly = checkRole([
  USER_TYPES.ADMIN,
  USER_TYPES.LEADER,
  USER_TYPES.MEMBER,
]);

export default checkRole;
