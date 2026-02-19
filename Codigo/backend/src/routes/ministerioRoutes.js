import { Router } from "express";
import MinisterioController from "../controllers/MinisterioController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/checkRole.js";
import validate from "../middlewares/validate.js";
import {
  createMinisterioSchema,
  updateMinisterioSchema,
} from "../validations/ministerioValidation.js";

const router = Router();
router.use(verificarToken);
router.use(adminOnly);

router.get("/", MinisterioController.index);
router.post("/", validate(createMinisterioSchema), MinisterioController.store);
router.get("/:id/participantes", MinisterioController.participantes);
router.put("/:id/participantes", (req, res, next) => {
  req.body = req.body || {};
  if (Array.isArray(req.body)) req.body = { id_usuarios: req.body };
  next();
}, MinisterioController.setParticipantes);
router.get("/:id", MinisterioController.show);
router.put("/:id", validate(updateMinisterioSchema), MinisterioController.update);
router.delete("/:id", MinisterioController.destroy);

export default router;
