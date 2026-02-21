import { Router } from "express";
import QuizRespostaController from "../controllers/QuizRespostaController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/checkRole.js";

const router = Router();

// CRUD administrativo de respostas - apenas admin
router.get("/", verificarToken, adminOnly, QuizRespostaController.getAll);
router.get("/:id", verificarToken, adminOnly, QuizRespostaController.getById);
router.delete("/:id", verificarToken, adminOnly, QuizRespostaController.delete);

// Nota: As rotas de submissão de quiz estão em /api/quiz/:id/responder

export default router;
