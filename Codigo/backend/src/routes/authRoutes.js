import { Router } from "express";
import AuthController from "../controllers/authController.js";
import validate from "../middlewares/validate.js";
import { loginUsuarioSchema } from "../validations/usuarioValidation.js";
import { registerSchema } from "../validations/authValidation.js";

const router = Router();

// POST /api/auth/register - Registrar novo usuário (apenas como membro)
router.post("/register", validate(registerSchema), AuthController.register);

// POST /api/auth/login - Fazer login
router.post("/login", validate(loginUsuarioSchema), AuthController.login);

export default router;
