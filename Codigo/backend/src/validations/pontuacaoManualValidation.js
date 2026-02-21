import Joi from "joi";

/**
 * Schema para atribuição manual de pontuação (admin)
 */
export const pontuacaoManualSchema = Joi.object({
  pontos: Joi.number().integer().min(1).required().messages({
    "number.base": "Pontos devem ser um número",
    "number.min": "Pontos devem ser no mínimo 1",
    "any.required": "Pontos são obrigatórios",
  }),
  motivo: Joi.string().min(3).max(500).required().messages({
    "string.min": "O motivo deve ter no mínimo 3 caracteres",
    "string.max": "O motivo deve ter no máximo 500 caracteres",
    "any.required": "O motivo é obrigatório",
  }),
});
