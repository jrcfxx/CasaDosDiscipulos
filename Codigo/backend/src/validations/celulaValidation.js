import Joi from "joi";

/**
 * Schema de validação para criação de célula
 */
export const createCelulaSchema = Joi.object({
  nome: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Nome da célula é obrigatório",
    "string.min": "Nome deve ter no mínimo 3 caracteres",
    "string.max": "Nome deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().allow(null, "").max(1000).messages({
    "string.max": "Descrição deve ter no máximo 1000 caracteres",
  }),

  id_lider: Joi.number().integer().positive().required().messages({
    "number.base": "ID do líder deve ser um número",
    "number.positive": "ID do líder deve ser positivo",
    "any.required": "Célula deve ter um líder",
  }),

  dia_reuniao: Joi.string()
    .valid("segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo")
    .allow(null)
    .messages({
      "any.only": "Dia da reunião inválido",
    }),

  horario_reuniao: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .allow(null)
    .messages({
      "string.pattern.base":
        "Horário deve estar no formato HH:MM (exemplo: 19:30)",
    }),

  local_reuniao: Joi.string().allow(null, "").max(500).messages({
    "string.max": "Local da reunião deve ter no máximo 500 caracteres",
  }),

  ativa: Joi.boolean().default(true),
});

/**
 * Schema de validação para atualização de célula
 */
export const updateCelulaSchema = Joi.object({
  nome: Joi.string().min(3).max(255).messages({
    "string.min": "Nome deve ter no mínimo 3 caracteres",
    "string.max": "Nome deve ter no máximo 255 caracteres",
  }),

  descricao: Joi.string().allow(null, "").max(1000),

  id_lider: Joi.number().integer().positive().messages({
    "number.base": "ID do líder deve ser um número",
    "number.positive": "ID do líder deve ser positivo",
  }),

  dia_reuniao: Joi.string()
    .valid("segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo")
    .allow(null),

  horario_reuniao: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .allow(null),

  local_reuniao: Joi.string().allow(null, "").max(500),

  ativa: Joi.boolean(),
});
