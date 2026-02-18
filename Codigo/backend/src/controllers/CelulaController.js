import CelulaService from "../services/CelulaService.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Controller para operações relacionadas a células
 * Camada de apresentação - recebe requisições e delega para o service
 */
const CelulaController = {
  /**
   * Lista todas as células
   * GET /api/celula
   */
  async index(req, res, next) {
    try {
      const celulas = await CelulaService.getAll();
      res.status(HTTP_STATUS.OK).json(celulas);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Busca célula por ID
   * GET /api/celula/:id
   */
  async show(req, res, next) {
    try {
      const celula = await CelulaService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json(celula);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lista células ativas
   * GET /api/celula/ativas
   */
  async active(req, res, next) {
    try {
      const celulas = await CelulaService.getActive();
      res.status(HTTP_STATUS.OK).json(celulas);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lista células de um líder
   * GET /api/celula/lider/:idLider
   */
  async byLider(req, res, next) {
    try {
      const celulas = await CelulaService.getByLider(req.params.idLider);
      res.status(HTTP_STATUS.OK).json(celulas);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cria nova célula
   * POST /api/celula
   */
  async store(req, res, next) {
    try {
      const celula = await CelulaService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json(celula);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Atualiza célula
   * PUT /api/celula/:id
   */
  async update(req, res, next) {
    try {
      const celula = await CelulaService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json(celula);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove célula
   * DELETE /api/celula/:id
   */
  async destroy(req, res, next) {
    try {
      await CelulaService.delete(req.params.id);
      res
        .status(HTTP_STATUS.OK)
        .json({ message: "Célula removida com sucesso" });
    } catch (error) {
      next(error);
    }
  },
};

export default CelulaController;
