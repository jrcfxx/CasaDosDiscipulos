import { Router } from "express";
import SegurancaController from "../controllers/SegurancaController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/checkRole.js";

const router = Router();

// Painel de segurança: só administrador
router.use(verificarToken, adminOnly);

router.get("/resumo", SegurancaController.resumo);
router.get("/eventos", SegurancaController.eventos);
router.get("/sessoes", SegurancaController.sessoes);
router.delete("/sessoes/:referencia", SegurancaController.encerrarSessao);
router.get("/usuarios/:id", SegurancaController.situacaoUsuario);
router.post("/usuarios/:id/encerrar-sessoes", SegurancaController.encerrarSessoesDoUsuario);
router.post("/usuarios/:id/desbloquear", SegurancaController.desbloquear);
router.delete("/usuarios/:id/2fa", SegurancaController.removerDoisFatores);

export default router;
