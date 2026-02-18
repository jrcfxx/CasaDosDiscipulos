import { Router } from "express";
import ModuloController from "../controllers/ModuloController.js";
import validate from "../middlewares/validate.js";
import {
  createModuloSchema,
  updateModuloSchema,
} from "../validations/moduloValidation.js";

const router = Router();

router.get("/", ModuloController.index);
router.get("/:id", ModuloController.show);
router.get("/:id/quiz", ModuloController.getQuizVinculado);
router.post("/", validate(createModuloSchema), ModuloController.store);
router.post("/:id/quiz/:idQuiz", ModuloController.vincularQuiz);
router.put("/:id", validate(updateModuloSchema), ModuloController.update);
router.delete("/:id", ModuloController.destroy);
router.delete("/:id/quiz/:idQuiz", ModuloController.desvincularQuiz);

export default router;
