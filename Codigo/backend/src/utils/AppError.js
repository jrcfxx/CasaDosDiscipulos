/**
 * Classe base para erros operacionais da aplicação
 * Diferencia erros esperados (operacionais) de bugs não tratados
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro quando recurso não é encontrado
 */
export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404);
  }
}

/**
 * Erro de validação de dados
 */
export class ValidationError extends AppError {
  constructor(message = "Dados inválidos", errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Erro de autenticação
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado") {
    super(message, 401);
  }
}

/**
 * Erro de permissão/acesso
 */
export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403);
  }
}

/**
 * Erro de conflito (ex: duplicação)
 */
export class ConflictError extends AppError {
  constructor(message = "Conflito - recurso já existe") {
    super(message, 409);
  }
}

export default AppError;
