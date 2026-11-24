import { Router } from "express";
import ModuloController from "../controllers/ModuloController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly, adminAndLeader } from "../middlewares/checkRole.js";
import {
  createModuloSchema,
  updateModuloSchema,
} from "../validations/moduloValidation.js";

const router = Router();

router.use(verificarToken);

// Ranking expõe nome, foto e pontuação dos membros: só para quem está logado (LGPD)
router.get("/ranking", ModuloController.ranking);
router.get("/", ModuloController.index);
router.get("/active", ModuloController.active);
router.get("/ativos-com-progresso", ModuloController.activeWithProgress);
router.get("/ranking/minha-posicao", ModuloController.minhaPosicao);
// Ranking inteiro (todos os membros ativos) para exportar em Excel: administração e líderes
router.get("/ranking/completo", adminAndLeader, ModuloController.rankingCompleto);
router.post("/:id/iniciar", ModuloController.iniciar);
router.post("/:id/concluir", ModuloController.concluir);
router.get("/:id/progresso", ModuloController.getProgresso);
// Nova ordem da trilha (arrastar na lista). Antes de "/:id" para não ser lida como um id.
router.put("/ordem", adminOnly, ModuloController.reordenar);
router.get("/:id/total-progresso", adminOnly, ModuloController.totalProgresso);
router.get("/:id", ModuloController.show);
router.get("/:id/quiz", ModuloController.getQuizVinculado);
router.post("/", adminOnly, validate(createModuloSchema), ModuloController.store);
router.post("/:id/quiz/:idQuiz", adminOnly, ModuloController.vincularQuiz);
router.put("/:id", adminOnly, validate(updateModuloSchema), ModuloController.update);
router.delete("/:id/permanente", adminOnly, ModuloController.deletePermanente);
router.delete("/:id", adminOnly, ModuloController.destroy);
router.delete("/:id/quiz/:idQuiz", adminOnly, ModuloController.desvincularQuiz);

export default router;
