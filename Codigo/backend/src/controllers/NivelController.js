import NivelModel from "../models/NivelModel.js";

class NivelController {
  // GET /api/nivel - Listar todos
  async index(req, res, next) {
    try {
      const niveis = await NivelModel.findAll();
      res.json(niveis);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/nivel/:id - Buscar por ID
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const nivel = await NivelModel.findById(id);

      if (!nivel) {
        return res.status(404).json({ error: "Nível não encontrado" });
      }

      res.json(nivel);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/nivel - Criar novo
  async store(req, res, next) {
    try {
      const nivel = await NivelModel.create(req.body);
      res.status(201).json(nivel);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/nivel/:id - Atualizar
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const nivelExistente = await NivelModel.findById(id);

      if (!nivelExistente) {
        return res.status(404).json({ error: "Nível não encontrado" });
      }

      const nivel = await NivelModel.update(id, req.body);
      res.json(nivel);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/nivel/:id - Deletar (soft delete)
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const nivelExistente = await NivelModel.findById(id);

      if (!nivelExistente) {
        return res.status(404).json({ error: "Nível não encontrado" });
      }

      await NivelModel.delete(id);
      res.json({ message: "Nível inativado com sucesso" });
    } catch (error) {
      next(error);
    }
  }
}

export default new NivelController();
