import { Router } from "express";
import QuizRespostaController from "../controllers/QuizRespostaController.js";

const router = Router();

// CRUD administrativo de respostas (para visualização/gerenciamento)
router.get("/", QuizRespostaController.getAll);
router.get("/:id", QuizRespostaController.getById);
router.delete("/:id", QuizRespostaController.delete);

// Nota: As rotas de submissão de quiz estão em /api/quiz/:id/responder

export default router;
