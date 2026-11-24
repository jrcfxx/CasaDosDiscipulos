import LicaoService from "../services/LicaoService.js";
import { USER_TYPES } from "../utils/constants.js";

/** Só o admin vê lições inativas (as outras pessoas veem só as liberadas) */
const veInativas = (req) => req.usuario?.tipo === USER_TYPES.ADMIN;

class LicaoController {
  async getAll(req, res, next) {
    try {
      res.json(await LicaoService.getAll({ somenteAtivas: !veInativas(req) }));
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const licao = await LicaoService.getById(req.params.id, { somenteAtivas: !veInativas(req) });
      res.json(licao);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const licao = await LicaoService.create(req.body);
      res.status(201).json(licao);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const licao = await LicaoService.update(req.params.id, req.body);
      res.json(licao);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await LicaoService.delete(req.params.id);
      res.json({ message: "Lição removida" });
    } catch (err) {
      next(err);
    }
  }
}

export default new LicaoController();
