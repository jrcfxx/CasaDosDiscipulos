import Joi from "joi";

/**
 * Schema de validação para criação de formulário
 */
export const createFormularioSchema = Joi.object({
  titulo: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Título do formulário é obrigatório",
    "string.min": "O título precisa ter pelo menos 3 letras",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().trim().allow(null, "").max(1000).messages({
    "string.max": "Descrição deve ter no máximo 1000 caracteres",
  }),

  ativo: Joi.boolean().default(true),

  frequencia: Joi.string()
    .valid("semanal", "quinzenal", "mensal", "bimestral")
    .allow(null, "")
    .optional(),

  campos: Joi.array()
    .items(
      Joi.object({
        id_campo: Joi.number().integer().positive().required().messages({
          "number.base": "ID do campo deve ser um número",
          "any.required": "ID do campo é obrigatório",
        }),

        label: Joi.string().trim().max(255).required().messages({
          "string.empty": "Todo campo precisa de um nome",
          "string.max": "O nome do campo pode ter no máximo 255 caracteres",
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
  titulo: Joi.string().trim().min(3).max(255).messages({
    "string.min": "O título precisa ter pelo menos 3 letras",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().trim().allow(null, "").max(1000),

  ativo: Joi.boolean(),

  frequencia: Joi.string()
    .valid("semanal", "quinzenal", "mensal", "bimestral")
    .allow(null, "")
    .optional(),

  campos: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().optional(),
        id_formulario_campo: Joi.number().integer().positive().optional(),
        id_campo: Joi.number().integer().positive().required(),
        label: Joi.string().trim().max(255).required().messages({
          "string.empty": "Todo campo precisa de um nome",
        }),
        conteudo: Joi.any().optional(),
        obrigatorio: Joi.boolean(),
        ordem: Joi.number().integer().min(0).optional(),
      })
    )
    .optional(),
});
