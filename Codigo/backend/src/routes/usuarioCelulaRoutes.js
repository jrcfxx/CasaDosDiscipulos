import { Router } from "express";
import UsuarioCelulaController from "../controllers/UsuarioCelulaController.js";
import verificarToken from "../middlewares/authMiddleware.js";

const router = Router();
router.use(verificarToken);

// PUT /api/usuario-celula/perfil - Define célula principal
router.put("/perfil", UsuarioCelulaController.setCelulaPrincipal);

// DELETE /api/usuario-celula/perfil/:id_celula - Remove vínculo
router.delete("/perfil/:id_celula", UsuarioCelulaController.removeCelula);

export default router;
