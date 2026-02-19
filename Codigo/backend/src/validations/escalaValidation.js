import Joi from "joi";

export const createEscalaEventoSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).required().messages({
    "string.empty": "Título é obrigatório",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),
  data_hora: Joi.date().required().messages({
    "date.base": "Data e hora são obrigatórias",
  }),
  descricao: Joi.string().max(2000).allow("").optional(),
  ativo: Joi.boolean().default(true),
  areas: Joi.array()
    .items(Joi.string().min(1).max(100))
    .min(1)
    .optional()
    .messages({
      "array.min": "Informe pelo menos uma área",
    }),
  id_ministerios: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      "array.min": "Selecione ao menos um ministério",
    }),
});

export const updateEscalaEventoSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).messages({
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),
  data_hora: Joi.date(),
  descricao: Joi.string().max(2000).allow("").optional(),
  ativo: Joi.boolean(),
  areas: Joi.array().items(Joi.string().min(1).max(100)).optional(),
  id_ministerios: Joi.array().items(Joi.number().integer().positive()),
});

export const createAtribuicaoSchema = Joi.object({
  id_escala_area: Joi.number().integer().positive().required(),
  id_usuario: Joi.number().integer().positive().required(),
  detalhes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

export const updateAtribuicaoSchema = Joi.object({
  detalhes: Joi.object().pattern(Joi.string(), Joi.any()).required(),
});
