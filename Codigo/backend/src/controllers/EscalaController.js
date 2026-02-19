import EscalaService from "../services/EscalaService.js";

/**
 * Controller para operações da Escala
 * Usa next() para repassar erros ao errorHandler
 */
class EscalaController {
  async getEventos(req, res, next) {
    try {
      const { ano, mes, ativo } = req.query;
      const filters = {};
      if (ano) filters.ano = ano;
      if (mes) filters.mes = mes;
      if (ativo !== undefined) filters.ativo = ativo === "true" || ativo === "1";
      const idUsuario = req.usuario?.id_usuario;
      const tipo = req.usuario?.tipo;
      const eventos = await EscalaService.getEventos(filters, idUsuario, tipo);
      res.json(eventos);
    } catch (err) {
      next(err);
    }
  }

  async getEventoById(req, res, next) {
    try {
      const evento = await EscalaService.getEventoById(req.params.id);
      res.json(evento);
    } catch (err) {
      next(err);
    }
  }

  async getEventoCompleto(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const tipo = req.usuario?.tipo;
      const evento = await EscalaService.getEventoCompleto(req.params.id, idUsuario, tipo);
      res.json(evento);
    } catch (err) {
      next(err);
    }
  }

  async createEvento(req, res, next) {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const tipo = req.usuario?.tipo;
      const evento = await EscalaService.createEvento(req.body, idUsuario, tipo);
      res.status(201).json(evento);
    } catch (err) {
      next(err);
    }
  }

  async updateEvento(req, res, next) {
    try {
      const tipo = req.usuario?.tipo;
      const evento = await EscalaService.updateEvento(req.params.id, req.body, tipo);
      res.json(evento);
    } catch (err) {
      next(err);
    }
  }

  async deleteEvento(req, res, next) {
    try {
      const tipo = req.usuario?.tipo;
      await EscalaService.deleteEvento(req.params.id, tipo);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async addAtribuicao(req, res, next) {
    try {
      const idUsuarioLogado = req.usuario?.id_usuario;
      const tipo = req.usuario?.tipo;
      const { id_escala_area, id_usuario, detalhes } = req.body;
      const atrib = await EscalaService.addAtribuicao(
        id_escala_area,
        id_usuario,
        idUsuarioLogado,
        tipo,
        detalhes
      );
      res.status(201).json(atrib);
    } catch (err) {
      next(err);
    }
  }

  async updateAtribuicao(req, res, next) {
    try {
      const idUsuarioLogado = req.usuario?.id_usuario;
      const tipo = req.usuario?.tipo;
      const { detalhes } = req.body;
      const atrib = await EscalaService.updateAtribuicao(
        req.params.id,
        detalhes,
        idUsuarioLogado,
        tipo
      );
      res.json(atrib);
    } catch (err) {
      next(err);
    }
  }

  async getUsuariosParaEscalar(req, res, next) {
    try {
      const idUsuarioLogado = req.usuario?.id_usuario;
      const tipo = req.usuario?.tipo;
      const nomeArea = req.query.area || null;
      const usuarios = await EscalaService.getUsuariosParaEscalar(
        req.params.id,
        idUsuarioLogado,
        tipo,
        nomeArea
      );
      res.json(usuarios);
    } catch (err) {
      next(err);
    }
  }

  async removeAtribuicao(req, res, next) {
    try {
      const idUsuarioLogado = req.usuario?.id_usuario;
      const tipo = req.usuario?.tipo;
      await EscalaService.removeAtribuicao(req.params.id, idUsuarioLogado, tipo);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export default new EscalaController();
