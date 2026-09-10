import { ValidationError } from "../utils/AppError.js";

/**
 * Middleware centralizado para tratamento de erros
 * Diferencia erros operacionais de bugs e retorna respostas apropriadas
 */
const errorHandler = (err, req, res, next) => {
  // Log detalhado para debugging (em produção, usar logger apropriado)
  if (process.env.NODE_ENV !== "production") {
    console.error("Erro capturado:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Erro de validação do Joi
  if (err.name === "ValidationError" && err.isJoi) {
    return res.status(400).json({
      error: "Erro de validação",
      details: err.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  // Erro operacional esperado (AppError e suas subclasses)
  if (err.isOperational) {
    const response = {
      error: err.message,
    };

    // Se for ValidationError com array de erros, incluir detalhes
    if (err instanceof ValidationError && err.errors?.length) {
      response.details = err.errors;
    }
    if (err.conflitos?.length) {
      response.sucesso = false;
      response.conflitos = err.conflitos;
    }

    return res.status(err.statusCode).json(response);
  }

  // Erros do Knex/MySQL
  if (err.code) {
    switch (err.code) {
      case "ER_DUP_ENTRY":
        return res.status(409).json({
          error: "Registro duplicado - esse item já existe",
        });
      case "ER_NO_REFERENCED_ROW_2":
        return res.status(400).json({
          error: "Referência inválida - verifique os IDs fornecidos",
        });
      case "ER_ROW_IS_REFERENCED_2":
        return res.status(409).json({
          error: "Não é possível remover - existem registros dependentes",
        });
      default:
        console.error("Erro de banco de dados:", err);
    }
  }

  // Erro inesperado (bug) - nunca expor stack ou detalhes ao cliente
  if (process.env.NODE_ENV !== "production") {
    console.error("ERRO NÃO TRATADO:", err);
  }
  return res.status(500).json({
    error: "Ocorreu um erro inesperado. Por favor, tente novamente.",
  });
};

export default errorHandler;
