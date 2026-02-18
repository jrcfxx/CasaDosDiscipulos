import Joi from "joi";
import { FIELD_TYPES } from "../utils/constants.js";

/**
 * Schema de validação para criação de módulo
 */
export const createModuloSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Título do módulo é obrigatório",
    "string.min": "Título deve ter no mínimo 3 caracteres",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().allow(null, "").max(1000).messages({
    "string.max": "Descrição deve ter no máximo 1000 caracteres",
  }),

  ordem: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Ordem deve ser um número",
    "number.min": "Ordem deve ser maior ou igual a 0",
  }),

  ativo: Joi.boolean().default(true),

  campos: Joi.array()
    .items(
      Joi.object({
        id_campo: Joi.number().integer().positive().required().messages({
          "number.base": "ID do campo deve ser um número",
          "any.required": "ID do campo é obrigatório",
        }),

        label: Joi.string().required().messages({
          "string.empty": "Label do campo é obrigatório",
        }),

        conteudo: Joi.any().optional(),

        ordem: Joi.number().integer().min(0).optional().messages({
          "number.base": "Ordem deve ser um número",
          "number.min": "Ordem deve ser maior ou igual a 0",
        }),
      })
    )
    .optional(),
});

/**
 * Schema de validação para atualização de módulo
 */
export const updateModuloSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).messages({
    "string.min": "Título deve ter no mínimo 3 caracteres",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().allow(null, "").max(1000),

  ordem: Joi.number().integer().min(0).messages({
    "number.base": "Ordem deve ser um número",
    "number.min": "Ordem deve ser maior ou igual a 0",
  }),

  ativo: Joi.boolean(),

  campos: Joi.array()
    .items(
      Joi.object({
        id_campo: Joi.number().integer().positive().required(),
        label: Joi.string().required(),
        conteudo: Joi.any().optional(),
        ordem: Joi.number().integer().min(0).optional(),
      })
    )
    .optional(),
});
