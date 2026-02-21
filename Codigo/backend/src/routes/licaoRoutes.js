import { Router } from "express";
import LicaoController from "../controllers/LicaoController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly, authenticatedOnly } from "../middlewares/checkRole.js";
import {
  createLicaoSchema,
  updateLicaoSchema,
} from "../validations/licaoValidation.js";

const router = Router();

router.get("/", verificarToken, authenticatedOnly, LicaoController.getAll);
router.get("/:id", verificarToken, authenticatedOnly, LicaoController.getById);
router.post("/", verificarToken, adminOnly, validate(createLicaoSchema), LicaoController.create);
router.put("/:id", verificarToken, adminOnly, validate(updateLicaoSchema), LicaoController.update);
router.delete("/:id", verificarToken, adminOnly, LicaoController.delete);

export default router;
