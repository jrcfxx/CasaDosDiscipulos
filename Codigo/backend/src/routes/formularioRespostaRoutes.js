import { Router } from "express";
import FormularioRespostaController from "../controllers/FormularioRespostaController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminAndLeader } from "../middlewares/checkRole.js";
import {
  createFormularioRespostaSchema,
  updateFormularioRespostaSchema,
} from "../validations/formularioRespostaValidation.js";

const router = Router();

// Rotas especiais - admin ou líder
router.get("/formulario/:idFormulario", verificarToken, adminAndLeader, FormularioRespostaController.byFormulario);
router.get("/celula/:idCelula", verificarToken, adminAndLeader, FormularioRespostaController.byCelula);

// CRUD básico
router.get("/", verificarToken, adminAndLeader, FormularioRespostaController.index);
router.get("/:id", verificarToken, adminAndLeader, FormularioRespostaController.show);
router.post("/", verificarToken, validate(createFormularioRespostaSchema), FormularioRespostaController.store);
router.put("/:id", verificarToken, adminAndLeader, validate(updateFormularioRespostaSchema), FormularioRespostaController.update);
router.delete("/:id", verificarToken, adminAndLeader, FormularioRespostaController.destroy);

export default router;
