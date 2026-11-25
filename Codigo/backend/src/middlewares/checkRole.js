import { ForbiddenError } from "../utils/AppError.js";
import { USER_TYPES } from "../utils/constants.js";
import knex from "../database/index.js";
import RegistroSegurancaService, { EVENTOS } from "../services/RegistroSegurancaService.js";

/** Tentativa de abrir área sem permissão vai para o registro de segurança (nunca lança erro) */
function registrarNegado(req, exigido) {
  return RegistroSegurancaService.registrar(req, {
    evento: EVENTOS.ACESSO_NEGADO,
    resultado: "falha",
    id_usuario: req.usuario?.id_usuario,
    detalhes: { metodo: req.method, rota: `${req.baseUrl}${req.path}`.slice(0, 200), tipo: req.usuario?.tipo, exigido },
  });
}

/**
 * Middleware para verificar se o usuário tem permissão baseada em seu tipo
 * @param {Array<string>} allowedRoles - Array com os tipos de usuário permitidos
 * @returns {Function} Middleware function
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.usuario) {
      return next(
        new ForbiddenError("Usuário não autenticado. Faça login primeiro.")
      );
    }

    const userType = req.usuario.tipo;

    if (!allowedRoles.includes(userType)) {
      await registrarNegado(req, allowedRoles.join(","));
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
 * Admin ou líder que lidera ao menos um ministério (tabela ministerio_lider).
 * Consulta o banco a cada requisição: o JWT não carrega essa informação.
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
      await registrarNegado(req, "lider_ministerio");
      return next(
        new ForbiddenError(
          "Acesso negado. Esta ação requer permissão de administrador ou líder de ministério."
        )
      );
    }

    // Fonte da verdade: a tabela ministerio_lider (a flag em usuario é só um espelho)
    const row = await knex("ministerio_lider")
      .where("id_usuario", req.usuario.id_usuario)
      .first();

    if (!row) {
      await registrarNegado(req, "lider_ministerio");
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
