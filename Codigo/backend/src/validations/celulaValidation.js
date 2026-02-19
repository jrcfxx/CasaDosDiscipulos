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

  endereco: Joi.string().allow(null, "").max(500).messages({
    "string.max": "Endereço deve ter no máximo 500 caracteres",
  }),

  id_lideres: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .messages({ "array.min": "Célula deve ter pelo menos um líder" }),
  id_lider: Joi.number().integer().positive(),

  dia_reuniao: Joi.string()
    .valid("segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo")
    .allow(null)
    .messages({
      "any.only": "Dia da reunião inválido",
    }),

  horario_reuniao: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .allow(null)
    .messages({
      "string.pattern.base":
        "Horário deve estar no formato HH:MM ou HH:MM:SS (exemplo: 19:30)",
    }),

  local_reuniao: Joi.string().allow(null, "").max(500),
  ativa: Joi.boolean().default(true),
})
  .or("id_lideres", "id_lider")
  .messages({ "object.missing": "Célula deve ter pelo menos um líder" });

/**
 * Schema de validação para atualização de célula
 */
export const updateCelulaSchema = Joi.object({
  nome: Joi.string().min(3).max(255).messages({
    "string.min": "Nome deve ter no mínimo 3 caracteres",
    "string.max": "Nome deve ter no máximo 255 caracteres",
  }),

  endereco: Joi.string().allow(null, "").max(500),

  id_lideres: Joi.array().items(Joi.number().integer().positive()).min(1).messages({
    "array.min": "Célula deve ter pelo menos um líder",
  }),
  id_lider: Joi.number().integer().positive(),

  dia_reuniao: Joi.string()
    .valid("segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo")
    .allow(null),

  horario_reuniao: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .allow(null),

  local_reuniao: Joi.string().allow(null, "").max(500),

  ativa: Joi.boolean(),
})
  .min(1)
  .unknown(true);
