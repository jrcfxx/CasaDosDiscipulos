import { Router } from "express";
import UsuarioController from "../controllers/UsuarioController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import upload from "../config/upload.js";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
} from "../validations/usuarioValidation.js";
import { pontuacaoManualSchema } from "../validations/pontuacaoManualValidation.js";
import { adminOnly } from "../middlewares/checkRole.js";

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

// GET /api/usuarios - Listar todos (admin)
router.get("/", adminOnly, UsuarioController.index);

// GET /api/usuarios/:id - Buscar por ID (admin)
router.get("/:id", adminOnly, UsuarioController.show);

// POST /api/usuarios/:id/pontuacao-manual - Admin: atribuir pontos com motivo (ex: dinâmicas presenciais)
router.post(
  "/:id/pontuacao-manual",
  adminOnly,
  validate(pontuacaoManualSchema),
  UsuarioController.addPontuacaoManual
);

// POST /api/usuarios - Criar novo (admin)
router.post("/", adminOnly, validate(createUsuarioSchema), UsuarioController.store);

// PUT /api/usuarios/:id - Atualizar (admin)
router.put("/:id", adminOnly, validate(updateUsuarioSchema), UsuarioController.update);

// PATCH /api/usuarios/:id/toggle - Ativar/Desativar (admin)
router.patch("/:id/toggle", adminOnly, UsuarioController.toggleActive);

// DELETE /api/usuarios/:id - Deletar (admin)
router.delete("/:id", adminOnly, UsuarioController.destroy);

export default router;
