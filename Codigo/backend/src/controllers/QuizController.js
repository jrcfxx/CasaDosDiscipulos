import QuizService from "../services/QuizService.js";
import { HTTP_STATUS } from "../utils/constants.js";

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
      res.status(HTTP_STATUS.OK).json(quizzes);
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
      res.status(HTTP_STATUS.OK).json(quiz);
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
