import QuizRespostaService from "../services/QuizRespostaService.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Controller para respostas de quiz
 * Gerencia requisições HTTP relacionadas a respostas de quizzes
 */
class QuizRespostaController {
  /**
   * Lista todas as respostas
   */
  async getAll(req, res, next) {
    try {
      const respostas = await QuizRespostaService.getAll();
      res.status(HTTP_STATUS.OK).json(respostas);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Busca resposta por ID
   */
  async getById(req, res, next) {
    try {
      const resposta = await QuizRespostaService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json(resposta);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cria nova resposta individual
   */
  async create(req, res, next) {
    try {
      const resposta = await QuizRespostaService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json(resposta);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Atualiza resposta existente
   */
  async update(req, res, next) {
    try {
      const resposta = await QuizRespostaService.update(
        req.params.id,
        req.body
      );
      res.status(HTTP_STATUS.OK).json(resposta);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove resposta
   */
  async delete(req, res, next) {
    try {
      await QuizRespostaService.delete(req.params.id);
      res
        .status(HTTP_STATUS.OK)
        .json({ message: "Resposta removida com sucesso" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Submete respostas de um quiz completo (requer auth)
   * POST /api/quiz/:id/responder
   * Body: { id_modulo?, respostas: [{ id_questao, resposta }] }
   * id_usuario vem do token (req.usuario)
   */
  async submit(req, res, next) {
    try {
      const id_usuario = req.usuario?.id_usuario;
      if (!id_usuario) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      const payload = { ...req.body, id_usuario };
      const result = await QuizRespostaService.submitResponses(
        req.params.id,
        payload
      );
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lista todas as respostas de um quiz
   */
  async listByQuiz(req, res, next) {
    try {
      const respostas = await QuizRespostaService.listByQuiz(req.params.id);
      res.status(HTTP_STATUS.OK).json(respostas);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lista respostas de um usuário para um quiz específico
   * GET /api/quiz/:id/respostas/usuario?usuarioId=X
   */
  async listByUsuario(req, res, next) {
    try {
      const { usuarioId } = req.query;

      if (!usuarioId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "usuarioId é obrigatório como query parameter",
        });
      }

      const result = await QuizRespostaService.listByUsuarioAndQuiz(
        parseInt(usuarioId),
        req.params.id
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default new QuizRespostaController();
