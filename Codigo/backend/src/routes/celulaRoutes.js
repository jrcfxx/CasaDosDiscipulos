import { Router } from "express";
import CelulaController from "../controllers/CelulaController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/checkRole.js";
import {
  createCelulaSchema,
  updateCelulaSchema,
} from "../validations/celulaValidation.js";

const router = Router();

// Público — listagem de células ativas (página Encontre sua Célula)
router.get("/publicas", CelulaController.active);
router.get("/ativas", CelulaController.active);

router.use(verificarToken);

router.get("/lider/:idLider", CelulaController.byLider);
router.get("/", CelulaController.index);
router.get("/:id", CelulaController.show);
router.post("/", adminOnly, validate(createCelulaSchema), CelulaController.store);
router.put("/:id", adminOnly, validate(updateCelulaSchema), CelulaController.update);
router.delete("/:id", adminOnly, CelulaController.destroy);

export default router;
