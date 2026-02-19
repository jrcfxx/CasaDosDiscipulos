import { Router } from "express";
import CelulaController from "../controllers/CelulaController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import {
  createCelulaSchema,
  updateCelulaSchema,
} from "../validations/celulaValidation.js";

const router = Router();

// Todas as rotas de célula requerem autenticação
router.use(verificarToken);

// Rotas especiais antes das rotas com :id
router.get("/ativas", CelulaController.active);
router.get("/lider/:idLider", CelulaController.byLider);

// CRUD básico
router.get("/", CelulaController.index);
router.get("/:id", CelulaController.show);
router.post("/", validate(createCelulaSchema), CelulaController.store);
router.put("/:id", validate(updateCelulaSchema), CelulaController.update);
router.delete("/:id", CelulaController.destroy);

export default router;
