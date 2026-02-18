import { Router } from "express";
import UsuarioController from "../controllers/UsuarioController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import upload from "../config/upload.js";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
} from "../validations/usuarioValidation.js";

const router = Router();

// Todas as rotas de usuário requerem autenticação
router.use(verificarToken);

// GET /api/usuarios/perfil - Buscar perfil do usuário autenticado
router.get("/perfil", UsuarioController.perfil);

// PUT /api/usuarios/perfil - Atualizar perfil do usuário autenticado
router.put("/perfil", UsuarioController.updatePerfil);

// POST /api/usuarios/perfil/foto - Upload de foto de perfil
router.post(
  "/perfil/foto",
  upload.single("foto"),
  UsuarioController.uploadFoto
);

// GET /api/usuarios - Listar todos
router.get("/", UsuarioController.index);

// GET /api/usuarios/:id - Buscar por ID
router.get("/:id", UsuarioController.show);

// POST /api/usuarios - Criar novo (já tem via /auth/register)
router.post("/", validate(createUsuarioSchema), UsuarioController.store);

// PUT /api/usuarios/:id - Atualizar
router.put("/:id", validate(updateUsuarioSchema), UsuarioController.update);

// PATCH /api/usuarios/:id/toggle - Ativar/Desativar
router.patch("/:id/toggle", UsuarioController.toggleActive);

// DELETE /api/usuarios/:id - Deletar
router.delete("/:id", UsuarioController.destroy);

export default router;
