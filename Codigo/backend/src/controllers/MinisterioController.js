import MinisterioService from "../services/MinisterioService.js";

const MinisterioController = {
  async index(req, res, next) {
    try {
      const incluirInativos = req.query.incluirInativos === "true" || req.query.incluirInativos === "1";
      const data = await MinisterioService.getAll(incluirInativos);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async show(req, res, next) {
    try {
      const data = await MinisterioService.getById(req.params.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async store(req, res, next) {
    try {
      const data = await MinisterioService.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const data = await MinisterioService.update(req.params.id, req.body);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async destroy(req, res, next) {
    try {
      await MinisterioService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async participantes(req, res, next) {
    try {
      const data = await MinisterioService.getParticipantes(req.params.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async setParticipantes(req, res, next) {
    try {
      await MinisterioService.setParticipantes(req.params.id, req.body.id_usuarios || []);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};

export default MinisterioController;
