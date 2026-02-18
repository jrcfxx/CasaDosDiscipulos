import { Router } from "express";
import FormularioController from "../controllers/FormularioController.js";
import validate from "../middlewares/validate.js";
import {
  createFormularioSchema,
  updateFormularioSchema,
} from "../validations/formularioValidation.js";

const router = Router();

router.get("/", FormularioController.getAll);
router.get("/:id", FormularioController.getById);
router.post("/", validate(createFormularioSchema), FormularioController.create);
router.put(
  "/:id",
  validate(updateFormularioSchema),
  FormularioController.update
);
router.delete("/:id", FormularioController.delete);

export default router;
