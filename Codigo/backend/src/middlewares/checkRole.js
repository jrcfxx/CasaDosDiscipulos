import { ForbiddenError } from "../utils/AppError.js";
import { USER_TYPES } from "../utils/constants.js";
import knex from "../database/index.js";

/**
 * Middleware para verificar se o usuário tem permissão baseada em seu tipo
 * @param {Array<string>} allowedRoles - Array com os tipos de usuário permitidos
 * @returns {Function} Middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(
        new ForbiddenError("Usuário não autenticado. Faça login primeiro.")
      );
    }

    const userType = req.usuario.tipo;

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

export const adminOnly = checkRole([USER_TYPES.ADMIN]);

export const adminAndLeader = checkRole([USER_TYPES.ADMIN, USER_TYPES.LEADER]);

/**
 * Admin ou líder com flag lider_ministerio (acesso à Escala).
 * Busca a flag no banco porque o JWT não a inclui.
 */
export const adminAndLiderMinisterio = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return next(
        new ForbiddenError("Usuário não autenticado. Faça login primeiro.")
      );
    }

    if (req.usuario.tipo === USER_TYPES.ADMIN) {
      return next();
    }

    if (req.usuario.tipo !== USER_TYPES.LEADER) {
      return next(
        new ForbiddenError(
          "Acesso negado. Esta ação requer permissão de administrador ou líder de ministério."
        )
      );
    }

    const row = await knex("usuario")
      .select("lider_ministerio")
      .where("id_usuario", req.usuario.id_usuario)
      .first();

    if (!row?.lider_ministerio) {
      return next(
        new ForbiddenError(
          "Acesso negado. Apenas líderes de ministério podem gerenciar a escala."
        )
      );
    }

    req.usuario.lider_ministerio = true;
    next();
  } catch (err) {
    next(err);
  }
};

export const authenticatedOnly = checkRole([
  USER_TYPES.ADMIN,
  USER_TYPES.LEADER,
  USER_TYPES.MEMBER,
]);

export default checkRole;
