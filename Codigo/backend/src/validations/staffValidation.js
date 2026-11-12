import Joi from "joi";

export const staffConfigSchema = Joi.object({
  titulo: Joi.string().trim().min(1).max(120),
  subtitulo: Joi.string().trim().max(300).allow(""),
}).min(1);

export const criarStaffItemSchema = Joi.object({
  id_pai: Joi.number().integer().positive().allow(null),
  titulo: Joi.string().trim().min(1).max(120).required().messages({
    "string.empty": "Informe o nome do grupo ou da função",
    "any.required": "Informe o nome do grupo ou da função",
  }),
  pessoas: Joi.string().trim().max(255).allow("", null),
});

export const atualizarStaffItemSchema = Joi.object({
  titulo: Joi.string().trim().min(1).max(120),
  pessoas: Joi.string().trim().max(255).allow("", null),
}).min(1);

export const moverStaffItemSchema = Joi.object({
  direcao: Joi.string().valid("cima", "baixo").required(),
});
