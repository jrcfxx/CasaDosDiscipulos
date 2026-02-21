import { Router } from "express";
import ModuloController from "../controllers/ModuloController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/checkRole.js";
import {
  createModuloSchema,
  updateModuloSchema,
} from "../validations/moduloValidation.js";

const router = Router();

router.get("/", ModuloController.index);
router.get("/active", ModuloController.active);
router.get("/ativos-com-progresso", verificarToken, ModuloController.activeWithProgress);
router.get("/ranking/minha-posicao", verificarToken, ModuloController.minhaPosicao);
router.get("/ranking", ModuloController.ranking);
router.post("/:id/iniciar", verificarToken, ModuloController.iniciar);
router.post("/:id/concluir", verificarToken, ModuloController.concluir);
router.get("/:id/progresso", verificarToken, ModuloController.getProgresso);
router.get("/:id", ModuloController.show);
router.get("/:id/quiz", ModuloController.getQuizVinculado);
router.post("/", verificarToken, adminOnly, validate(createModuloSchema), ModuloController.store);
router.post("/:id/quiz/:idQuiz", verificarToken, adminOnly, ModuloController.vincularQuiz);
router.put("/:id", verificarToken, adminOnly, validate(updateModuloSchema), ModuloController.update);
router.delete("/:id/permanente", verificarToken, adminOnly, ModuloController.deletePermanente);
router.delete("/:id", verificarToken, adminOnly, ModuloController.destroy);
router.delete("/:id/quiz/:idQuiz", verificarToken, adminOnly, ModuloController.desvincularQuiz);

export default router;
