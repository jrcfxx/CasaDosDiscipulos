import Joi from "joi";

export const createNivelSchema = Joi.object({
  nome: Joi.string().max(100).required().messages({
    "string.empty": "Nome é obrigatório",
    "string.max": "Nome deve ter no máximo 100 caracteres",
  }),
  descricao: Joi.string().allow(null, "").optional(),
  ordem: Joi.number().integer().min(0).required().messages({
    "number.base": "Ordem deve ser um número",
    "number.min": "Ordem deve ser no mínimo 0",
  }),
  ativo: Joi.boolean().default(true),
});

export const updateNivelSchema = Joi.object({
  nome: Joi.string().max(100).optional(),
  descricao: Joi.string().allow(null, "").optional(),
  ordem: Joi.number().integer().min(0).optional(),
  ativo: Joi.boolean().optional(),
}).min(1);
