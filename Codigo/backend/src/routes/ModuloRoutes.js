import { Router } from "express";
import ModuloController from "../controllers/ModuloController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import {
  createModuloSchema,
  updateModuloSchema,
} from "../validations/moduloValidation.js";

const router = Router();

router.get("/", ModuloController.index);
router.get("/active", ModuloController.active);
router.get(
  "/ativos-com-progresso",
  verificarToken,
  ModuloController.activeWithProgress
);
router.get("/ranking/minha-posicao", verificarToken, ModuloController.minhaPosicao);
router.get("/ranking", ModuloController.ranking);
router.post("/:id/iniciar", verificarToken, ModuloController.iniciar);
router.post("/:id/concluir", verificarToken, ModuloController.concluir);
router.get("/:id", ModuloController.show);
router.get("/:id/quiz", ModuloController.getQuizVinculado);
router.post("/", validate(createModuloSchema), ModuloController.store);
router.post("/:id/quiz/:idQuiz", ModuloController.vincularQuiz);
router.put("/:id", validate(updateModuloSchema), ModuloController.update);
router.delete("/:id/permanente", verificarToken, ModuloController.deletePermanente);
router.delete("/:id", ModuloController.destroy);
router.delete("/:id/quiz/:idQuiz", ModuloController.desvincularQuiz);

export default router;
