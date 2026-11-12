import QuizService from "../services/QuizService.js";
import { HTTP_STATUS, USER_TYPES } from "../utils/constants.js";

/**
 * Remove gabarito das questões para não-admin
 */
/** Remove a marcação de resposta certa do conteúdo de um campo-pergunta da Secretaria */
function semGabaritoNoCampo(campo) {
  const tipo = String(campo?.tipo_campo || "").toLowerCase();
  if (tipo === "verdadeiro_falso") {
    // O conteúdo É a resposta ("true"/"false")
    return { ...campo, conteudo: null };
  }
  if (!["multipla_escolha", "checkbox", "select"].includes(tipo)) return campo;
  try {
    const parsed =
      typeof campo.conteudo === "string" ? JSON.parse(campo.conteudo || "{}") : campo.conteudo;
    if (!parsed || typeof parsed !== "object") return campo;
    const { correta: _c, ...resto } = parsed;
    if (Array.isArray(resto.alternativas)) {
      resto.alternativas = resto.alternativas.map(({ correta: _a, ...alt }) => alt);
    }
    return {
      ...campo,
      conteudo: typeof campo.conteudo === "string" ? JSON.stringify(resto) : resto,
    };
  } catch {
    return { ...campo, conteudo: null };
  }
}

/** Versão do quiz para quem vai responder: sem gabarito em questões nem em campos */
function stripGabarito(quiz) {
  if (!quiz) return quiz;
  return {
    ...quiz,
    questoes: (quiz.questoes || []).map(({ resposta_correta: _r, ...q }) => q),
    campos: (quiz.campos || []).map(semGabaritoNoCampo),
  };
}

/**
 * Controller para operações relacionadas a quizzes
 * Camada de apresentação - recebe requisições e delega para o service
 */
class QuizController {
  /**
   * Lista todos os quizzes com seus campos
   * GET /api/quiz
   */
  async getAll(req, res, next) {
    try {
      const quizzes = await QuizService.getAll();
      const isAdmin = req.usuario?.tipo === USER_TYPES.ADMIN;
      res
        .status(HTTP_STATUS.OK)
        .json(isAdmin ? quizzes : quizzes.map(stripGabarito));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Busca quiz por ID com seus campos
   * GET /api/quiz/:id
   */
  async getById(req, res, next) {
    try {
      const quiz = await QuizService.getById(req.params.id);
      const isAdmin = req.usuario?.tipo === USER_TYPES.ADMIN;
      res.status(HTTP_STATUS.OK).json(isAdmin ? quiz : stripGabarito(quiz));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lista apenas quizzes ativos
   * GET /api/quiz/active
   */
  async getActive(req, res, next) {
    try {
      const quizzes = await QuizService.getActive();
      res.status(HTTP_STATUS.OK).json(quizzes);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cria novo quiz com campos vinculados
   * POST /api/quiz
   */
  async create(req, res, next) {
    try {
      const quiz = await QuizService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json(quiz);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Atualiza quiz e seus campos
   * PUT /api/quiz/:id
   */
  async update(req, res, next) {
    try {
      const quiz = await QuizService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json(quiz);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove quiz permanentemente
   * DELETE /api/quiz/:id
   */
  async delete(req, res, next) {
    try {
      await QuizService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        message: "Quiz removido com sucesso",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Alterna status ativo/inativo do quiz
   * PATCH /api/quiz/:id/toggle
   */
  async toggleActive(req, res, next) {
    try {
      const quiz = await QuizService.toggleActive(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        message: `Quiz ${quiz.ativo ? "ativado" : "desativado"} com sucesso`,
        quiz,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new QuizController();
