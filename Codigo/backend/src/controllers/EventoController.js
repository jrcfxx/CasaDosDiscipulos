import EventoService from "../services/EventoService.js";

/**
 * Controller para operações relacionadas a eventos
 */
class EventoController {
  async getAll(req, res) {
    try {
      res.json(await EventoService.getAll());
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAtivos(req, res) {
    try {
      res.json(await EventoService.getAtivos());
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getById(req, res) {
    try {
      const evento = await EventoService.getById(req.params.id);
      res.json(evento);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async create(req, res) {
    try {
      const evento = await EventoService.create(req.body);
      res.status(201).json(evento);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req, res) {
    try {
      const evento = await EventoService.update(req.params.id, req.body);
      res.json(evento);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req, res) {
    try {
      await EventoService.delete(req.params.id);
      res.json({ message: "Evento removido" });
    } catch (err) {
      res.status(400).json({ error: err.message });
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
      res.status(400).json({ error: err.message });
    }
  }
}

export default new EventoController();
