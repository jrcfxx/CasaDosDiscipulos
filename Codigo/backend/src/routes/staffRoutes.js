import { Router } from "express";
import StaffController from "../controllers/StaffController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly, authenticatedOnly } from "../middlewares/checkRole.js";
import validate from "../middlewares/validate.js";
import {
  staffConfigSchema,
  criarStaffItemSchema,
  atualizarStaffItemSchema,
  moverStaffItemSchema,
} from "../validations/staffValidation.js";

const router = Router();

// Organograma só para quem está logado (membros e líderes visualizam; admin edita)
router.use(verificarToken);
router.get("/", authenticatedOnly, StaffController.estrutura);

// Edição: somente administrador
router.use(adminOnly);
router.put("/config", validate(staffConfigSchema), StaffController.atualizarConfig);
router.post("/itens", validate(criarStaffItemSchema), StaffController.criarItem);
router.put("/itens/:id", validate(atualizarStaffItemSchema), StaffController.atualizarItem);
router.put("/itens/:id/mover", validate(moverStaffItemSchema), StaffController.moverItem);
router.delete("/itens/:id", StaffController.excluirItem);

export default router;
