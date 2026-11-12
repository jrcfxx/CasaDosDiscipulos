import EventoService from "../services/EventoService.js";

/**
 * Controller para operações relacionadas a eventos
 */
class EventoController {
  async getAll(req, res, next) {
    try {
      res.json(await EventoService.getAll());
    } catch (err) {
      next(err);
    }
  }

  async getAtivos(req, res, next) {
    try {
      res.json(await EventoService.getAtivos());
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const evento = await EventoService.getById(req.params.id);
      res.json(evento);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const evento = await EventoService.create(req.body);
      res.status(201).json(evento);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const evento = await EventoService.update(req.params.id, req.body);
      res.json(evento);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await EventoService.delete(req.params.id);
      res.json({ message: "Evento removido" });
    } catch (err) {
      next(err);
    }
  }

  async uploadImagem(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }

      const imagemUrl = `/uploads/${req.file.filename}`;
      res.json({ imagem_url: imagemUrl });
    } catch (err) {
      console.error("[Evento] Erro no upload de imagem:", err?.message || err);
      res.status(500).json({ error: "Erro ao processar a imagem" });
    }
  }
}

export default new EventoController();
