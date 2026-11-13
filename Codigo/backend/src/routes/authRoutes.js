import { Router } from "express";
import AuthController from "../controllers/authController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { loginUsuarioSchema, updatePasswordSchema } from "../validations/usuarioValidation.js";

const router = Router();

// Não há cadastro público: contas são criadas pelo administrador (Gerenciar Usuários).

// POST /api/auth/login - Fazer login (sessão em cookie HttpOnly)
router.post("/login", validate(loginUsuarioSchema), AuthController.login);

// POST /api/auth/logout - Encerrar a sessão (apaga o cookie)
router.post("/logout", AuthController.logout);

// POST /api/auth/senha - Trocar a própria senha (inclusive no primeiro acesso)
router.post("/senha", verificarToken, validate(updatePasswordSchema), AuthController.trocarSenha);

// POST /api/auth/sessao - Transição: token antigo (Bearer) → sessão em cookie
router.post("/sessao", verificarToken, AuthController.converterSessao);

export default router;
