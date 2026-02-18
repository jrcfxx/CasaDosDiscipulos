import LicaoService from "../services/LicaoService.js";

class LicaoController {
  async getAll(req, res) {
    try {
      res.json(await LicaoService.getAll());
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getById(req, res) {
    try {
      const licao = await LicaoService.getById(req.params.id);
      res.json(licao);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async create(req, res) {
    try {
      const licao = await LicaoService.create(req.body);
      res.status(201).json(licao);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req, res) {
    try {
      const licao = await LicaoService.update(req.params.id, req.body);
      res.json(licao);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req, res) {
    try {
      await LicaoService.delete(req.params.id);
      res.json({ message: "Lição removida" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

export default new LicaoController();
