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

// Leituras autenticadas; ranking público permanece aberto
router.get("/ranking", ModuloController.ranking);

router.use(verificarToken);

router.get("/", ModuloController.index);
router.get("/active", ModuloController.active);
router.get("/ativos-com-progresso", ModuloController.activeWithProgress);
router.get("/ranking/minha-posicao", ModuloController.minhaPosicao);
router.post("/:id/iniciar", ModuloController.iniciar);
router.post("/:id/concluir", ModuloController.concluir);
router.get("/:id/progresso", ModuloController.getProgresso);
router.get("/:id", ModuloController.show);
router.get("/:id/quiz", ModuloController.getQuizVinculado);
router.post("/", adminOnly, validate(createModuloSchema), ModuloController.store);
router.post("/:id/quiz/:idQuiz", adminOnly, ModuloController.vincularQuiz);
router.put("/:id", adminOnly, validate(updateModuloSchema), ModuloController.update);
router.delete("/:id/permanente", adminOnly, ModuloController.deletePermanente);
router.delete("/:id", adminOnly, ModuloController.destroy);
router.delete("/:id/quiz/:idQuiz", adminOnly, ModuloController.desvincularQuiz);

export default router;
