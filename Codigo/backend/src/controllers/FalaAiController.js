import FalaAiService from "../services/FalaAiService.js";
import { USER_TYPES } from "../utils/constants.js";

class FalaAiController {
  async listarPosts(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const offset = parseInt(req.query.offset) || 0;
      const posts = await FalaAiService.listarPosts(limit, offset);
      res.json(posts);
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async getPost(req, res) {
    try {
      const post = await FalaAiService.getPostComComentarios(req.params.id);
      res.json(post);
    } catch (err) {
      res.status(err.statusCode || 404).json({ error: err.message });
    }
  }

  async criarPost(req, res) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const post = await FalaAiService.criarPost(req.body, idUsuario);
      res.status(201).json(post);
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async adicionarComentario(req, res) {
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
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async excluirComentario(req, res) {
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
      res.status(err.statusCode || 403).json({ error: err.message });
    }
  }

  async excluirPost(req, res) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const ehAdmin = req.usuario?.tipo === USER_TYPES.ADMIN;
      await FalaAiService.excluirPost(req.params.id, idUsuario, ehAdmin);
      res.json({ message: "Post excluído" });
    } catch (err) {
      res.status(err.statusCode || 403).json({ error: err.message });
    }
  }
}

export default new FalaAiController();
