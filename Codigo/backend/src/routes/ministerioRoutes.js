import { Router } from "express";
import MinisterioController from "../controllers/MinisterioController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly, adminAndLeader } from "../middlewares/checkRole.js";
import validate from "../middlewares/validate.js";
import {
  createMinisterioSchema,
  updateMinisterioSchema,
} from "../validations/ministerioValidation.js";

const router = Router();
router.use(verificarToken);

// Leitura: admin e líderes (escala precisa da lista de ministérios)
router.get("/", adminAndLeader, MinisterioController.index);
router.get("/:id/participantes", adminOnly, MinisterioController.participantes);
router.put("/:id/participantes", adminOnly, (req, res, next) => {
  req.body = req.body || {};
  if (Array.isArray(req.body)) req.body = { id_usuarios: req.body };
  next();
}, MinisterioController.setParticipantes);
router.get("/:id", adminAndLeader, MinisterioController.show);

// Escrita: apenas admin
router.post("/", adminOnly, validate(createMinisterioSchema), MinisterioController.store);
router.put("/:id", adminOnly, validate(updateMinisterioSchema), MinisterioController.update);
router.delete("/:id", adminOnly, MinisterioController.destroy);

export default router;
