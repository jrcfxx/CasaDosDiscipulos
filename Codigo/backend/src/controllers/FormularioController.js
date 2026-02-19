import FormularioService from "../services/FormularioService.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Controller para operações relacionadas a formulários
 * Camada de apresentação - recebe requisições e delega para o service
 */
class FormularioController {
  /**
   * Lista todos os formulários
   * GET /api/formulario
   */
  async getAll(req, res, next) {
    try {
      const formularios = await FormularioService.getAll();
      res.status(HTTP_STATUS.OK).json(formularios);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Busca formulário por ID
   * GET /api/formulario/:id
   */
  async getById(req, res, next) {
    try {
      const formulario = await FormularioService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json(formulario);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cria novo formulário
   * POST /api/formulario
   */
  async create(req, res, next) {
    try {
      const formulario = await FormularioService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json(formulario);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Atualiza formulário
   * PUT /api/formulario/:id
   */
  async update(req, res, next) {
    try {
      const formulario = await FormularioService.update(
        req.params.id,
        req.body
      );
      res.status(HTTP_STATUS.OK).json(formulario);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove formulário permanentemente
   * DELETE /api/formulario/:id
   */
  async delete(req, res, next) {
    try {
      await FormularioService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        message: "Formulário removido com sucesso",
      });
    } catch (err) {
      next(err);
    }
  }

}

export default new FormularioController();
