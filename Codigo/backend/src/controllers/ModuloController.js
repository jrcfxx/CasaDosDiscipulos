import ModuloService from "../services/ModuloService.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Controller para operações relacionadas a módulos
 * Camada de apresentação - recebe requisições e delega para o service
 */
const ModuloController = {
  /**
   * Lista todos os módulos com seus campos
   * GET /api/modulo
   */
  async index(req, res, next) {
    try {
      const modulos = await ModuloService.getAll();
      res.status(HTTP_STATUS.OK).json(modulos);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Busca módulo por ID com seus campos
   * GET /api/modulo/:id
   */
  async show(req, res, next) {
    try {
      const modulo = await ModuloService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json(modulo);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lista apenas módulos ativos
   * GET /api/modulo/active
   */
  async active(req, res, next) {
    try {
      const modulos = await ModuloService.getActive();
      res.status(HTTP_STATUS.OK).json(modulos);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cria novo módulo com campos vinculados
   * POST /api/modulo
   */
  async store(req, res, next) {
    try {
      const modulo = await ModuloService.createComCampos(req.body);
      res.status(HTTP_STATUS.CREATED).json(modulo);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Atualiza módulo e seus campos
   * PUT /api/modulo/:id
   */
  async update(req, res, next) {
    try {
      const modulo = await ModuloService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json(modulo);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Alterna status ativo/inativo do módulo
   * DELETE /api/modulo/:id
   */
  async destroy(req, res, next) {
    try {
      const modulo = await ModuloService.toggleActive(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        message: `Módulo ${
          modulo.ativo ? "ativado" : "desativado"
        } com sucesso`,
        modulo,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Vincula quiz a um módulo
   * POST /api/modulo/:id/quiz/:idQuiz
   */
  async vincularQuiz(req, res, next) {
    try {
      const vinculo = await ModuloService.vincularQuiz(
        req.params.id,
        req.params.idQuiz
      );
      res.status(HTTP_STATUS.CREATED).json({
        message: "Quiz vinculado ao módulo com sucesso",
        vinculo,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove vínculo entre módulo e quiz
   * DELETE /api/modulo/:id/quiz/:idQuiz
   */
  async desvincularQuiz(req, res, next) {
    try {
      await ModuloService.desvincularQuiz(req.params.id, req.params.idQuiz);
      res.status(HTTP_STATUS.OK).json({
        message: "Quiz desvinculado do módulo com sucesso",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Busca quiz vinculado a um módulo
   * GET /api/modulo/:id/quiz
   */
  async getQuizVinculado(req, res, next) {
    try {
      const quiz = await ModuloService.getQuizVinculado(req.params.id);
      res.status(HTTP_STATUS.OK).json(quiz);
    } catch (error) {
      next(error);
    }
  },
};

export default ModuloController;
