import { Router } from "express";
import NivelController from "../controllers/NivelController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import {
  createNivelSchema,
  updateNivelSchema,
  reordenarNivelSchema,
} from "../validations/nivelValidation.js";

const router = Router();

// Todas as rotas de nível requerem autenticação
router.use(verificarToken);

// GET /api/nivel - Listar todos (?incluir_inativos=1)
router.get("/", NivelController.index);

// PUT /api/nivel/reordenar - Reordenar (antes de /:id)
router.put(
  "/reordenar",
  validate(reordenarNivelSchema),
  NivelController.reordenar
);

// GET /api/nivel/:id - Buscar por ID
router.get("/:id", NivelController.show);

// PATCH /api/nivel/:id/reativar - Reativar nível inativo
router.patch("/:id/reativar", NivelController.reativar);

// DELETE /api/nivel/:id/permanente - Excluir permanente + reordenar
router.delete("/:id/permanente", NivelController.excluirPermanente);

// POST /api/nivel - Criar novo
router.post("/", validate(createNivelSchema), NivelController.store);

// PUT /api/nivel/:id - Atualizar
router.put("/:id", validate(updateNivelSchema), NivelController.update);

// DELETE /api/nivel/:id - Inativar (soft delete)
router.delete("/:id", NivelController.destroy);

export default router;
