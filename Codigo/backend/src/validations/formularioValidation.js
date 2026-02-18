import Joi from "joi";

/**
 * Schema de validação para criação de formulário
 */
export const createFormularioSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Título do formulário é obrigatório",
    "string.min": "Título deve ter no mínimo 3 caracteres",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().allow(null, "").max(1000).messages({
    "string.max": "Descrição deve ter no máximo 1000 caracteres",
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

        obrigatorio: Joi.boolean().default(false),

        ordem: Joi.number().integer().min(0).optional(),
      })
    )
    .optional(),
});

/**
 * Schema de validação para atualização de formulário
 */
export const updateFormularioSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).messages({
    "string.min": "Título deve ter no mínimo 3 caracteres",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().allow(null, "").max(1000),

  ativo: Joi.boolean(),

  campos: Joi.array()
    .items(
      Joi.object({
        id_campo: Joi.number().integer().positive().required(),
        label: Joi.string().required(),
        conteudo: Joi.any().optional(),
        obrigatorio: Joi.boolean(),
        ordem: Joi.number().integer().min(0).optional(),
      })
    )
    .optional(),
});
