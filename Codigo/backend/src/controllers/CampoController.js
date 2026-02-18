import CampoService from "../services/CampoService.js";

const CampoController = {
  async index(req, res, next) {
    try {
      const { modalidade } = req.query;
      if (modalidade) {
        res.json(await CampoService.getByModalidade(modalidade));
      } else {
        res.json(await CampoService.getAll());
      }
    } catch (err) {
      next(err);
    }
  },

  async show(req, res, next) {
    try {
      res.json(await CampoService.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  async getByOption(req, res, next) {
    try {
      const { option, id } = req.params;
      const result = await CampoService.getByOption(option, id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createByOption(req, res, next) {
    try {
      const { option, id } = req.params;
      const { id_campo, conteudo, label } = req.body;

      const result = await CampoService.createByOption(
        option,
        id,
        id_campo,
        conteudo,
        label
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async store(req, res, next) {
    try {
      const campo = await CampoService.create(req.body);
      res.status(201).json(campo);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      res.json(await CampoService.update(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  async destroy(req, res, next) {
    try {
      await CampoService.remove(req.params.id);
      res.json({ message: "Campo removido com sucesso" });
    } catch (err) {
      next(err);
    }
  },
};

export default CampoController;
