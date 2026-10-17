import { Router } from "express";
import QuizController from "../controllers/QuizController.js";
import QuizRespostaController from "../controllers/QuizRespostaController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/checkRole.js";
import {
  createQuizSchema,
  updateQuizSchema,
} from "../validations/quizValidation.js";

const router = Router();

// Todas as rotas de quiz requerem autenticação
router.use(verificarToken);

// CRUD de Quiz
router.get("/", QuizController.getAll);
router.get("/:id", QuizController.getById);
router.post("/", adminOnly, validate(createQuizSchema), QuizController.create);
router.put("/:id", adminOnly, validate(updateQuizSchema), QuizController.update);
router.delete("/:id", adminOnly, QuizController.delete);

// Rotas de resposta de quiz
router.post("/:id/responder", QuizRespostaController.submit);
router.get("/:id/respostas", adminOnly, QuizRespostaController.listByQuiz);
router.get("/:id/respostas/usuario", QuizRespostaController.listByUsuario);

export default router;
