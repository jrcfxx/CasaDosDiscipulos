import NivelModel from "../models/NivelModel.js";

class NivelController {
  // GET /api/nivel - Listar todos (query: incluir_inativos=1 para incluir inativos)
  async index(req, res, next) {
    try {
      const incluirInativos = req.query.incluir_inativos === "1";
      const niveis = await NivelModel.findAll(incluirInativos);
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

  // DELETE /api/nivel/:id - Soft delete (inativar)
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

  // DELETE /api/nivel/:id/permanente - Excluir e reordenar
  async excluirPermanente(req, res, next) {
    try {
      const { id } = req.params;
      const nivelExistente = await NivelModel.findById(id);

      if (!nivelExistente) {
        return res.status(404).json({ error: "Nível não encontrado" });
      }

      const niveis = await NivelModel.excluir(id);
      res.json({
        message: "Nível excluído com sucesso",
        niveis,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/nivel/:id/reativar - Reativar nível inativo
  async reativar(req, res, next) {
    try {
      const { id } = req.params;
      const nivelExistente = await NivelModel.findById(id);

      if (!nivelExistente) {
        return res.status(404).json({ error: "Nível não encontrado" });
      }

      if (nivelExistente.ativo) {
        return res.status(400).json({ error: "Nível já está ativo" });
      }

      await NivelModel.reativar(id);
      const atualizado = await NivelModel.findById(id);
      res.json(atualizado);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/nivel/reordenar - Reordenar níveis (ordem automática 1..N)
  async reordenar(req, res, next) {
    try {
      const niveis = await NivelModel.reordenar(req.body.ids);
      res.json(niveis);
    } catch (error) {
      next(error);
    }
  }
}

export default new NivelController();
