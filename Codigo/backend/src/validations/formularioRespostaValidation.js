import Joi from "joi";

/**
 * Schema para criação de resposta de formulário
 */
export const createFormularioRespostaSchema = Joi.object({
  id_formulario: Joi.number().integer().positive().required().messages({
    "number.base": "ID do formulário deve ser um número",
    "number.positive": "ID do formulário deve ser positivo",
    "any.required": "ID do formulário é obrigatório",
  }),

  id_celula: Joi.number().integer().positive().required().messages({
    "number.base": "ID da célula deve ser um número",
    "number.positive": "ID da célula deve ser positivo",
    "any.required": "ID da célula é obrigatório",
  }),

  campos: Joi.array()
    .items(
      Joi.object({
        id_formulario_campo: Joi.number().integer().positive().required(),
        resposta: Joi.string().max(2000).allow(null, ""),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Campos deve ser um array",
      "array.min": "É necessário responder ao menos um campo",
      "any.required": "Campos de resposta são obrigatórios",
    }),
});

/**
 * Schema para atualização de resposta de formulário
 * Permite atualizar apenas a data da resposta
 */
export const updateFormularioRespostaSchema = Joi.object({
  data_resposta: Joi.date().messages({
    "date.base": "Data da resposta deve ser uma data válida",
  }),
});
