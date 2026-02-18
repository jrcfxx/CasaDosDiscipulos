import { Router } from "express";
import NivelController from "../controllers/NivelController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import {
  createNivelSchema,
  updateNivelSchema,
} from "../validations/nivelValidation.js";

const router = Router();

// Todas as rotas de nível requerem autenticação
router.use(verificarToken);

// GET /api/nivel - Listar todos
router.get("/", NivelController.index);

// GET /api/nivel/:id - Buscar por ID
router.get("/:id", NivelController.show);

// POST /api/nivel - Criar novo
router.post("/", validate(createNivelSchema), NivelController.store);

// PUT /api/nivel/:id - Atualizar
router.put("/:id", validate(updateNivelSchema), NivelController.update);

// DELETE /api/nivel/:id - Deletar
router.delete("/:id", NivelController.destroy);

export default router;
