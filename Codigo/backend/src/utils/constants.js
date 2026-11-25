/**
 * Constantes da aplicação
 * Centralizando valores fixos para facilitar manutenção
 */

// Tipos de usuário
export const USER_TYPES = {
  ADMIN: "administrador",
  LEADER: "lider",
  MEMBER: "membro",
};

// Status do evento de escala
export const ESCALA_STATUS = {
  RASCUNHO: "rascunho",
  PUBLICADA: "publicada",
  CONCLUIDA: "concluida",
};

export const ESCALA_HISTORICO_ACAO = {
  CRIACAO: "criacao",
  EDICAO: "edicao",
  EXCLUSAO: "exclusao",
  PUBLICACAO: "publicacao",
  ATRIBUICAO: "atribuicao",
  REMOCAO_ATRIBUICAO: "remocao_atribuicao",
  MOVIMENTACAO: "movimentacao",
  COPIA: "copia",
  DESFAZER: "desfazer",
};

// Tipos de campos personalizados
export const FIELD_TYPES = {
  // Campos gerais
  TEXT: "texto",
  NUMBER: "numero",
  DATE: "data",
  LINK: "link",
  UPLOAD: "upload",

  // Campos específicos para quiz
  MULTIPLE_CHOICE: "multipla_escolha",
  TRUE_FALSE: "verdadeiro_falso",
  ESSAY: "discursiva",
};

// Códigos de status HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
