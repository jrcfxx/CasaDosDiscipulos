import Joi from "joi";
import { USER_TYPES } from "../utils/constants.js";

/**
 * Schema de validação para criação de usuário
 */
export const createUsuarioSchema = Joi.object({
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
    .valid(...Object.values(USER_TYPES))
    .required()
    .messages({
      "any.only": `Tipo deve ser: ${Object.values(USER_TYPES).join(", ")}`,
      "any.required": "Tipo de usuário é obrigatório",
    }),

  id_nivel: Joi.number().integer().positive().allow(null).optional(),

  telefone: Joi.string().max(20).allow("", null).optional(),

  lider_celula: Joi.boolean().truthy(1, "1").falsy(0, "0").optional(),
  lider_ministerio: Joi.boolean().truthy(1, "1").falsy(0, "0").optional(),
  id_ministerios_lider: Joi.array().items(Joi.number().integer().positive()).optional(),
  id_ministerios_participa: Joi.array().items(Joi.number().integer().positive()).optional(),

  ativo: Joi.boolean().default(true),
  data_criacao: Joi.date().optional(),
});

/**
 * Schema de validação para atualização de usuário
 */
export const updateUsuarioSchema = Joi.object({
  id_usuario: Joi.number().integer(),

  nome: Joi.string().min(3).max(255).messages({
    "string.min": "Nome deve ter no mínimo 3 caracteres",
    "string.max": "Nome deve ter no máximo 255 caracteres",
  }),

  email: Joi.string().email().messages({
    "string.email": "Email inválido",
  }),

  senha: Joi.string().min(6).messages({
    "string.min": "Senha deve ter no mínimo 6 caracteres",
  }),

  tipo: Joi.string()
    .valid(...Object.values(USER_TYPES))
    .messages({
      "any.only": `Tipo deve ser: ${Object.values(USER_TYPES).join(", ")}`,
    }),

  id_nivel: Joi.number().integer().positive().allow(null).optional(),

  telefone: Joi.string().max(20).allow("", null).optional(),

  lider_celula: Joi.boolean().truthy(1, "1").falsy(0, "0").optional(),
  lider_ministerio: Joi.boolean().truthy(1, "1").falsy(0, "0").optional(),
  id_ministerios_lider: Joi.array().items(Joi.number().integer().positive()).optional(),
  id_ministerios_participa: Joi.array().items(Joi.number().integer().positive()).optional(),

  ativo: Joi.boolean(),
  pontuacao: Joi.number().integer().min(0),
  data_criacao: Joi.date().optional(),
})
  .unknown(true);

/**
 * Schema de validação para login
 */
export const loginUsuarioSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email é obrigatório",
    "string.email": "Email inválido",
  }),

  senha: Joi.string().required().messages({
    "string.empty": "Senha é obrigatória",
  }),
});

/**
 * Schema de validação para atualização de senha
 */
export const updatePasswordSchema = Joi.object({
  senhaAtual: Joi.string().required().messages({
    "string.empty": "Senha atual é obrigatória",
  }),

  novaSenha: Joi.string().min(6).required().messages({
    "string.empty": "Nova senha é obrigatória",
    "string.min": "Nova senha deve ter no mínimo 6 caracteres",
  }),
});
