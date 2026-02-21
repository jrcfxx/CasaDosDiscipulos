import { Router } from "express";
import FormularioController from "../controllers/FormularioController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly, authenticatedOnly } from "../middlewares/checkRole.js";
import {
  createFormularioSchema,
  updateFormularioSchema,
} from "../validations/formularioValidation.js";

const router = Router();

router.get("/", verificarToken, authenticatedOnly, FormularioController.getAll);
router.get("/:id", verificarToken, authenticatedOnly, FormularioController.getById);
router.post("/", verificarToken, adminOnly, validate(createFormularioSchema), FormularioController.create);
router.put("/:id", verificarToken, adminOnly, validate(updateFormularioSchema), FormularioController.update);
router.delete("/:id", verificarToken, adminOnly, FormularioController.delete);

export default router;
