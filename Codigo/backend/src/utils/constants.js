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

// Status de progresso do módulo
export const MODULE_STATUS = {
  NOT_STARTED: "nao_iniciado",
  IN_PROGRESS: "em_andamento",
  COMPLETED: "concluido",
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

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NOT_FOUND: "Recurso não encontrado",
  UNAUTHORIZED: "Não autorizado",
  FORBIDDEN: "Acesso negado",
  INVALID_CREDENTIALS: "Credenciais inválidas",
  REQUIRED_FIELD: "Campo obrigatório não fornecido",
  INVALID_ID: "ID inválido",
  ALREADY_EXISTS: "Recurso já existe",
  INTERNAL_ERROR: "Erro interno do servidor",
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

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Configurações de pontuação (gamificação)
export const SCORING = {
  QUIZ_COMPLETION: 10,
  MODULE_COMPLETION: 50,
  CORRECT_ANSWER: 5,
  WRONG_ANSWER: -2,
};
