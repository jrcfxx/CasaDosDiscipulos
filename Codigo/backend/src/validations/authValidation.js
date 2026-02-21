import Joi from "joi";
import { USER_TYPES } from "../utils/constants.js";

/**
 * Schema para registro público - apenas "membro" é permitido.
 * Impede que qualquer um se registre como administrador ou líder.
 */
export const registerSchema = Joi.object({
  nome: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Nome é obrigatório",
    "string.min": "Nome deve ter no mínimo 3 caracteres",
    "string.max": "Nome deve ter no máximo 255 caracteres",
  }),

  email: Joi.string().email().required().messages({
    "string.empty": "Email é obrigatório",
    "string.email": "Email inválido",
  }),

  senha: Joi.string().min(6).required().messages({
    "string.empty": "Senha é obrigatória",
    "string.min": "Senha deve ter no mínimo 6 caracteres",
  }),

  tipo: Joi.string()
    .valid(USER_TYPES.MEMBER)
    .default(USER_TYPES.MEMBER)
    .messages({
      "any.only": "Registro público permite apenas tipo membro",
    }),

  id_nivel: Joi.number().integer().positive().allow(null).optional(),
  telefone: Joi.string().max(20).allow("", null).optional(),
  ativo: Joi.boolean().default(true),
})
  .unknown(false);
