import UsuarioCelulaModel from "../models/UsuarioCelulaModel.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Controller para célula principal do usuário (perfil)
 */
const UsuarioCelulaController = {
  /**
   * Define célula principal do membro
   * PUT /api/usuario-celula/perfil
   * Body: { id_celula: number }
   */
  async setCelulaPrincipal(req, res, next) {
    try {
      const id_usuario = req.usuario?.id_usuario;
      const { id_celula } = req.body;

      if (!id_celula) {
        return res.status(400).json({ error: "id_celula é obrigatório" });
      }

      const celula = await UsuarioCelulaModel.upsert(
        id_usuario,
        Number(id_celula),
        true
      );
      res.status(HTTP_STATUS.OK).json(celula);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Remove vínculo com célula
   * DELETE /api/usuario-celula/perfil/:id_celula
   */
  async removeCelula(req, res, next) {
    try {
      const id_usuario = req.usuario?.id_usuario;
      const id_celula = Number(req.params.id_celula);
      await UsuarioCelulaModel.remove(id_usuario, id_celula);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },
};

export default UsuarioCelulaController;
