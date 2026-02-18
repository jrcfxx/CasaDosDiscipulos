import { Router } from "express";
import AuthController from "../controllers/authController.js";
import validate from "../middlewares/validate.js";
import {
  createUsuarioSchema,
  loginUsuarioSchema,
} from "../validations/usuarioValidation.js";

const router = Router();

// POST /api/auth/register - Registrar novo usuário
router.post(
  "/register",
  validate(createUsuarioSchema),
  AuthController.register
);

// POST /api/auth/login - Fazer login
router.post("/login", validate(loginUsuarioSchema), AuthController.login);

export default router;
