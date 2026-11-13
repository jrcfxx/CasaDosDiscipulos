import { ValidationError } from "../utils/AppError.js";

/**
 * Registra erros inesperados — também em produção (`docker compose logs backend`).
 * Não registra corpo da requisição nem cabeçalhos (podem ter senha, token, dados pessoais).
 */
function registrarErro(err, req) {
  console.error(
    JSON.stringify({
      nivel: "erro",
      quando: new Date().toISOString(),
      metodo: req.method,
      rota: req.originalUrl?.split("?")[0],
      usuario: req.usuario?.id_usuario ?? null,
      mensagem: err.message,
      codigo: err.code,
      pilha: err.stack?.split("\n").slice(0, 6).join(" | "),
    })
  );
}

/**
 * Middleware centralizado para tratamento de erros
 * Diferencia erros operacionais (resposta clara ao usuário) de bugs (500 + registro).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError" && err.isJoi) {
    return res.status(400).json({
      error: "Erro de validação",
      details: err.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  // Upload (multer): tamanho e quantidade de arquivos
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Arquivo muito grande. Envie um arquivo menor." });
    }
    return res.status(400).json({ error: "Não foi possível receber o arquivo. Verifique o tipo e tente de novo." });
  }

  // JSON malformado ou corpo grande demais
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Requisição inválida" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Conteúdo grande demais" });
  }

  if (err.isOperational) {
    const response = { error: err.message };
    if (err.codigo) response.codigo = err.codigo;
    if (err instanceof ValidationError && err.errors?.length) {
      response.details = err.errors;
    }
    if (err.conflitos?.length) {
      response.sucesso = false;
      response.conflitos = err.conflitos;
      response.confirmavel = Boolean(err.confirmavel);
    }
    return res.status(err.statusCode).json(response);
  }

  if (err.code) {
    switch (err.code) {
      case "ER_DUP_ENTRY":
        return res.status(409).json({ error: "Registro duplicado - esse item já existe" });
      case "ER_NO_REFERENCED_ROW_2":
        return res.status(400).json({ error: "Referência inválida - verifique os IDs fornecidos" });
      case "ER_ROW_IS_REFERENCED_2":
        return res.status(409).json({ error: "Não é possível remover - existem registros dependentes" });
      default:
        break;
    }
  }

  registrarErro(err, req);
  return res.status(500).json({
    error: "Ocorreu um erro inesperado. Por favor, tente novamente.",
  });
};

export default errorHandler;
