import { Router } from "express";
import QuizController from "../controllers/QuizController.js";
import QuizRespostaController from "../controllers/QuizRespostaController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import {
  createQuizSchema,
  updateQuizSchema,
} from "../validations/quizValidation.js";

const router = Router();

// CRUD de Quiz
router.get("/", QuizController.getAll);
router.get("/:id", QuizController.getById);
router.post("/", validate(createQuizSchema), QuizController.create);
router.put("/:id", validate(updateQuizSchema), QuizController.update);
router.delete("/:id", QuizController.delete);

// Rotas de resposta de quiz (requer autenticação)
router.post("/:id/responder", verificarToken, QuizRespostaController.submit);
router.get("/:id/respostas", QuizRespostaController.listByQuiz);
router.get("/:id/respostas/usuario", QuizRespostaController.listByUsuario);

export default router;
