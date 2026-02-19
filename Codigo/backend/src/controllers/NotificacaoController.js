import NotificacaoModel from "../models/NotificacaoModel.js";

class NotificacaoController {
  async getByUsuario(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const { limit, naoLidos } = req.query;
      const list = await NotificacaoModel.getByUsuario(idUsuario, {
        limit: limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50,
        naoLidos: naoLidos === "true" || naoLidos === "1",
      });
      res.json(list);
    } catch (err) {
      next(err);
    }
  }

  async getCountNaoLidas(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const count = await NotificacaoModel.countNaoLidas(idUsuario);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }

  async marcarLido(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const id = req.params.id;
      await NotificacaoModel.marcarLido(id, idUsuario);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async marcarTodasLidas(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      await NotificacaoModel.marcarTodasLidas(idUsuario);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export default new NotificacaoController();
