import { Router } from "express";
import QuizController from "../controllers/QuizController.js";
import QuizRespostaController from "../controllers/QuizRespostaController.js";
import validate from "../middlewares/validate.js";
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

// Rotas de resposta de quiz
router.post("/:id/responder", QuizRespostaController.submit);
router.get("/:id/respostas", QuizRespostaController.listByQuiz);
router.get("/:id/respostas/usuario", QuizRespostaController.listByUsuario);

export default router;
