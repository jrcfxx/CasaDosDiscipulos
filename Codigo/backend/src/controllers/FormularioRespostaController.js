import FormularioRespostaService from "../services/FormularioRespostaService.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Controller para respostas de formulário
 */
const FormularioRespostaController = {
  /**
   * Lista todas as respostas
   * GET /api/formulario-resposta
   */
  async index(req, res, next) {
    try {
      const respostas = await FormularioRespostaService.getAll();
      res.status(HTTP_STATUS.OK).json(respostas);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Busca resposta por ID
   * GET /api/formulario-resposta/:id
   */
  async show(req, res, next) {
    try {
      const resposta = await FormularioRespostaService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json(resposta);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lista respostas de um formulário específico
   * GET /api/formulario-resposta/formulario/:idFormulario
   */
  async byFormulario(req, res, next) {
    try {
      const respostas = await FormularioRespostaService.getByFormulario(
        req.params.idFormulario
      );
      res.status(HTTP_STATUS.OK).json(respostas);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lista respostas de uma célula específica
   * GET /api/formulario-resposta/celula/:idCelula
   */
  async byCelula(req, res, next) {
    try {
      const respostas = await FormularioRespostaService.getByCelula(
        req.params.idCelula
      );
      res.status(HTTP_STATUS.OK).json(respostas);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cria nova resposta de formulário
   * POST /api/formulario-resposta (requer auth - líder)
   */
  async store(req, res, next) {
    try {
      const id_usuario = req.usuario?.id_usuario;
      const payload = { ...req.body, id_usuario };
      const resposta = await FormularioRespostaService.create(payload);
      res.status(HTTP_STATUS.CREATED).json(resposta);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Atualiza resposta existente
   * PUT /api/formulario-resposta/:id
   */
  async update(req, res, next) {
    try {
      const resposta = await FormularioRespostaService.update(
        req.params.id,
        req.body
      );
      res.status(HTTP_STATUS.OK).json(resposta);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove resposta
   * DELETE /api/formulario-resposta/:id
   */
  async destroy(req, res, next) {
    try {
      await FormularioRespostaService.delete(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  },
};

export default FormularioRespostaController;
