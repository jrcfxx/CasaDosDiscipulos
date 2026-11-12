import FalaAiService from "../services/FalaAiService.js";
import { USER_TYPES } from "../utils/constants.js";

class FalaAiController {
  async listarPosts(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const offset = parseInt(req.query.offset) || 0;
      const posts = await FalaAiService.listarPosts(limit, offset);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  }

  async getPost(req, res, next) {
    try {
      const post = await FalaAiService.getPostComComentarios(req.params.id);
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  async criarPost(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const post = await FalaAiService.criarPost(req.body, idUsuario);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }

  async adicionarComentario(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const { texto } = req.body;
      const comentario = await FalaAiService.adicionarComentario(
        req.params.id,
        texto,
        idUsuario
      );
      res.status(201).json(comentario);
    } catch (err) {
      next(err);
    }
  }

  async excluirComentario(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const ehAdmin = req.usuario?.tipo === USER_TYPES.ADMIN;
      await FalaAiService.excluirComentario(
        req.params.idComentario,
        idUsuario,
        ehAdmin
      );
      res.json({ message: "Comentário excluído" });
    } catch (err) {
      next(err);
    }
  }

  async excluirPost(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const ehAdmin = req.usuario?.tipo === USER_TYPES.ADMIN;
      await FalaAiService.excluirPost(req.params.id, idUsuario, ehAdmin);
      res.json({ message: "Post excluído" });
    } catch (err) {
      next(err);
    }
  }
}

export default new FalaAiController();
