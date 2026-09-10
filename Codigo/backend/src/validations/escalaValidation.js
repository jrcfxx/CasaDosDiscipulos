import Joi from "joi";

const validarFimAposInicio = (value, helpers) => {
  const { data_hora, data_hora_fim } = value;
  if (data_hora && data_hora_fim) {
    const ini = new Date(data_hora).getTime();
    const fim = new Date(data_hora_fim).getTime();
    if (!Number.isNaN(ini) && !Number.isNaN(fim) && fim < ini) {
      return helpers.message("Horário de término deve ser após o início");
    }
  }
  return value;
};

export const createEscalaEventoSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).required().messages({
    "string.empty": "Título é obrigatório",
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),
  data_hora: Joi.date().required().messages({
    "date.base": "Data e hora são obrigatórias",
  }),
  data_hora_fim: Joi.date().allow(null).optional().messages({
    "date.base": "Horário de término deve ser uma data/hora válida",
  }),
  descricao: Joi.string().max(2000).allow("").optional(),
  ativo: Joi.boolean().default(true),
  status: Joi.string().valid("rascunho", "publicada", "concluida").optional(),
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
}).custom(validarFimAposInicio);

export const updateEscalaEventoSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).messages({
    "string.max": "Título deve ter no máximo 255 caracteres",
  }),
  data_hora: Joi.date(),
  data_hora_fim: Joi.date().allow(null).optional(),
  descricao: Joi.string().max(2000).allow("").optional(),
  ativo: Joi.boolean(),
  status: Joi.string().valid("rascunho", "publicada", "concluida"),
  areas: Joi.array().items(Joi.string().min(1).max(100)).optional(),
  id_ministerios: Joi.array().items(Joi.number().integer().positive()),
}).custom(validarFimAposInicio);

export const createAtribuicaoSchema = Joi.object({
  id_escala_area: Joi.number().integer().positive().required(),
  id_usuario: Joi.number().integer().positive().required(),
  detalhes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

export const updateAtribuicaoSchema = Joi.object({
  detalhes: Joi.object().pattern(Joi.string(), Joi.any()).required(),
});

export const moverAtribuicaoSchema = Joi.object({
  id_escala_area: Joi.number().integer().positive().required(),
  detalhes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  forcarMovimento: Joi.boolean().optional(),
});

export const validarAtribuicaoSchema = Joi.object({
  id_escala_area: Joi.number().integer().positive().required(),
  id_usuario: Joi.number().integer().positive().required(),
  detalhes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

export const copiarEventoSchema = Joi.object({
  data_hora: Joi.date().required(),
  data_hora_fim: Joi.date().allow(null).optional(),
  titulo: Joi.string().min(1).max(255).optional(),
}).custom(validarFimAposInicio);

export const copiarSemanaSchema = Joi.object({
  data_inicio_origem: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  data_inicio_destino: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
});

export const criarTemplateSchema = Joi.object({
  nome: Joi.string().min(1).max(150).required(),
  id_escala_evento: Joi.number().integer().positive().optional(),
  payload: Joi.object().optional(),
});

export const aplicarTemplateSchema = Joi.object({
  data_hora: Joi.date().required(),
  data_hora_fim: Joi.date().allow(null).optional(),
  titulo: Joi.string().min(1).max(255).optional(),
}).custom(validarFimAposInicio);

export const copiarDiaSchema = Joi.object({
  data_origem: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  data_destino: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
});

export const moverMembroUnificadoSchema = Joi.object({
  membroEscalaOrigemId: Joi.number().integer().positive().required(),
  escalaDestinoId: Joi.number().integer().positive().required(),
  instrumentoDestino: Joi.string().max(80).required(),
  id_escala_area: Joi.number().integer().positive().optional(),
  detalhes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  removerDaOrigem: Joi.boolean().optional(),
  forcarMovimento: Joi.boolean().optional(),
});
