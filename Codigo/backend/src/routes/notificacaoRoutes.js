import { Router } from "express";
import NotificacaoController from "../controllers/NotificacaoController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { authenticatedOnly } from "../middlewares/checkRole.js";

const router = Router();

router.use(verificarToken);
router.use(authenticatedOnly);

router.get("/", NotificacaoController.getByUsuario);
router.get("/count", NotificacaoController.getCountNaoLidas);
router.put("/marcar-todas-lidas", NotificacaoController.marcarTodasLidas);
router.put("/:id/lido", NotificacaoController.marcarLido);

export default router;
