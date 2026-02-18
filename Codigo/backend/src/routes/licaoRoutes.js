import { Router } from "express";
import LicaoController from "../controllers/LicaoController.js";
import validate from "../middlewares/validate.js";
import {
  createLicaoSchema,
  updateLicaoSchema,
} from "../validations/licaoValidation.js";

const router = Router();

router.get("/", LicaoController.getAll);
router.get("/:id", LicaoController.getById);
router.post("/", validate(createLicaoSchema), LicaoController.create);
router.put("/:id", validate(updateLicaoSchema), LicaoController.update);
router.delete("/:id", LicaoController.delete);

export default router;
