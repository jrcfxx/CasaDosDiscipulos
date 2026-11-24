import Joi from "joi";

/** Eventos do carrossel da home. A "ordem" não entra aqui: é definida arrastando (reordenar). */
const campos = {
  titulo: Joi.string().trim().allow(null, "").max(255).messages({
    "string.max": "O título pode ter no máximo 255 caracteres",
  }),
  descricao: Joi.string().trim().allow(null, "").max(1000).messages({
    "string.max": "A descrição pode ter no máximo 1000 caracteres",
  }),
  imagem_url: Joi.string().trim().max(500),
  ativo: Joi.boolean().messages({ "boolean.base": "Ativo deve ser sim ou não" }),
};

export const createEventoSchema = Joi.object({
  ...campos,
  imagem_url: campos.imagem_url.required().messages({ "any.required": "Envie a imagem do evento." }),
});

export const updateEventoSchema = Joi.object(campos);

export const reordenarEventosSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
    "any.required": "Informe a nova ordem dos eventos",
  }),
});
