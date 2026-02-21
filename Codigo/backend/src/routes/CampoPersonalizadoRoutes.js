import { Router } from "express";
import CampoController from "../controllers/CampoController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/checkRole.js";

const router = Router();

router.get("/", verificarToken, adminOnly, CampoController.index);
router.get("/:id", verificarToken, adminOnly, CampoController.show);
router.get("/option/:option/:id", verificarToken, adminOnly, CampoController.getByOption);
router.post("/option/:option/:id", verificarToken, adminOnly, CampoController.createByOption);
router.post("/", verificarToken, adminOnly, CampoController.store);
router.put("/:id", verificarToken, adminOnly, CampoController.update);
router.delete("/:id", verificarToken, adminOnly, CampoController.destroy);

export default router;
