import Joi from "joi";

export const createNivelSchema = Joi.object({
  nome: Joi.string().max(100).required().messages({
    "string.empty": "Nome é obrigatório",
    "string.max": "Nome deve ter no máximo 100 caracteres",
  }),
  descricao: Joi.string().allow(null, "").optional(),
  /** Ordem é opcional: se omitida, o backend atribui a próxima disponível */
  ordem: Joi.number().integer().min(1).optional(),
  ativo: Joi.boolean().default(true),
});

export const updateNivelSchema = Joi.object({
  nome: Joi.string().max(100).optional(),
  descricao: Joi.string().allow(null, "").optional(),
  ordem: Joi.number().integer().min(1).optional(),
  ativo: Joi.boolean().optional(),
}).min(1);

export const reordenarNivelSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      "array.min": "Informe ao menos um nível",
      "any.required": "Lista de ids é obrigatória",
    }),
});
