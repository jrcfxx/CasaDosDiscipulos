import Joi from "joi";

/**
 * Schema de validação para criação de quiz
 */
export const createQuizSchema = Joi.object({
  id_modulo: Joi.number().integer().positive().allow(null).messages({
    "number.base": "ID do módulo deve ser um número",
    "number.positive": "ID do módulo deve ser positivo",
  }),

  titulo: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Título do quiz é obrigatório",
    "string.min": "Título deve ter no mínimo 3 caracteres",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().allow(null, "").max(2000).messages({
    "string.max": "Descrição deve ter no máximo 2000 caracteres",
  }),

  ativo: Joi.boolean().default(true),

  campos: Joi.array()
    .items(
      Joi.object({
        id_campo: Joi.number().integer().positive().required(),
        label: Joi.string().allow(""),
        conteudo: Joi.alternatives()
          .try(Joi.string(), Joi.number().unsafe(), Joi.boolean())
          .allow(""),
        ordem: Joi.number().integer().min(0).default(0),
      })
    )
    .optional(),
});

/**
 * Schema de validação para atualização de quiz
 */
export const updateQuizSchema = Joi.object({
  id_modulo: Joi.number().integer().positive().allow(null).messages({
    "number.base": "ID do módulo deve ser um número",
    "number.positive": "ID do módulo deve ser positivo",
  }),

  titulo: Joi.string().min(3).max(255).messages({
    "string.min": "Título deve ter no mínimo 3 caracteres",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().allow(null, "").max(2000),

  ativo: Joi.boolean(),

  campos: Joi.array()
    .items(
      Joi.object({
        id_campo: Joi.number().integer().positive().required(),
        label: Joi.string().allow(""),
        conteudo: Joi.alternatives()
          .try(Joi.string(), Joi.number().unsafe(), Joi.boolean())
          .allow(""),
        ordem: Joi.number().integer().min(0).default(0),
      })
    )
    .optional(),
});
