import Joi from "joi";

export const createMinisterioSchema = Joi.object({
  nome: Joi.string().min(1).max(150).required().messages({
    "string.empty": "Nome é obrigatório",
    "string.max": "Nome deve ter no máximo 150 caracteres",
  }),
  descricao: Joi.string().max(2000).allow("").optional(),
  ativo: Joi.boolean().default(true),
  ordem: Joi.number().integer().min(0).default(0),
  id_lideres: Joi.array().items(Joi.number().integer().positive()).default([]),
  id_paralelismos: Joi.array().items(Joi.number().integer().positive()).default([]),
});

export const updateMinisterioSchema = Joi.object({
  nome: Joi.string().min(1).max(150).messages({
    "string.max": "Nome deve ter no máximo 150 caracteres",
  }),
  descricao: Joi.string().max(2000).allow("").optional(),
  ativo: Joi.boolean(),
  ordem: Joi.number().integer().min(0),
  id_lideres: Joi.array().items(Joi.number().integer().positive()),
  id_paralelismos: Joi.array().items(Joi.number().integer().positive()),
});
