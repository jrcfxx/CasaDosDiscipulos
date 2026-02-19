import { Router } from "express";
import FormularioRespostaController from "../controllers/FormularioRespostaController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import {
  createFormularioRespostaSchema,
  updateFormularioRespostaSchema,
} from "../validations/formularioRespostaValidation.js";

const router = Router();

// Rotas especiais antes das rotas com :id
router.get(
  "/formulario/:idFormulario",
  FormularioRespostaController.byFormulario
);
router.get("/celula/:idCelula", FormularioRespostaController.byCelula);

// CRUD básico
router.get("/", FormularioRespostaController.index);
router.get("/:id", FormularioRespostaController.show);
router.post(
  "/",
  verificarToken,
  validate(createFormularioRespostaSchema),
  FormularioRespostaController.store
);
router.put(
  "/:id",
  validate(updateFormularioRespostaSchema),
  FormularioRespostaController.update
);
router.delete("/:id", FormularioRespostaController.destroy);

export default router;
