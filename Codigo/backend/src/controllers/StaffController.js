import StaffService from "../services/StaffService.js";
import { HTTP_STATUS } from "../utils/constants.js";

const StaffController = {
  async estrutura(req, res, next) {
    try {
      res.json(await StaffService.getEstrutura());
    } catch (err) {
      next(err);
    }
  },

  async atualizarConfig(req, res, next) {
    try {
      res.json(await StaffService.atualizarConfig(req.body));
    } catch (err) {
      next(err);
    }
  },

  async criarItem(req, res, next) {
    try {
      res.status(HTTP_STATUS.CREATED).json(await StaffService.criarItem(req.body));
    } catch (err) {
      next(err);
    }
  },

  async atualizarItem(req, res, next) {
    try {
      res.json(await StaffService.atualizarItem(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  async moverItem(req, res, next) {
    try {
      res.json(await StaffService.moverItem(req.params.id, req.body.direcao));
    } catch (err) {
      next(err);
    }
  },

  async excluirItem(req, res, next) {
    try {
      await StaffService.excluirItem(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },
};

export default StaffController;
