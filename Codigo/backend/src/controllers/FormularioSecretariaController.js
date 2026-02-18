import formularioSecretariaService from "../services/formularioSecretariaService.js";

const FormularioSecretariaController = {

  async update(req, res, next) {
    try {
      res.json(await formularioSecretariaService.update(req.body));
    } catch (err) {
      next(err);
    }
  },

};

export default FormularioSecretariaController;
