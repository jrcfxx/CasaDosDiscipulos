import { Router } from "express";
import EscalaController from "../controllers/EscalaController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminAndLeader, authenticatedOnly } from "../middlewares/checkRole.js";
import validate from "../middlewares/validate.js";
import {
  createEscalaEventoSchema,
  updateEscalaEventoSchema,
  createAtribuicaoSchema,
  updateAtribuicaoSchema,
} from "../validations/escalaValidation.js";

const router = Router();

router.use(verificarToken);

// Leitura: todos os usuários autenticados (membros podem visualizar)
router.get("/eventos", authenticatedOnly, EscalaController.getEventos);
router.get("/eventos/:id/completo", authenticatedOnly, EscalaController.getEventoCompleto);
router.get("/eventos/:id", authenticatedOnly, EscalaController.getEventoById);

// Escalar: apenas admin e líder de ministério
router.get("/eventos/:id/usuarios-para-escalar", adminAndLeader, EscalaController.getUsuariosParaEscalar);

// Escrita: apenas admin e líder de ministério
router.post(
  "/eventos",
  adminAndLeader,
  validate(createEscalaEventoSchema),
  EscalaController.createEvento
);
router.put(
  "/eventos/:id",
  adminAndLeader,
  validate(updateEscalaEventoSchema),
  EscalaController.updateEvento
);
router.delete("/eventos/:id", adminAndLeader, EscalaController.deleteEvento);
router.post(
  "/atribuicoes",
  adminAndLeader,
  validate(createAtribuicaoSchema),
  EscalaController.addAtribuicao
);
router.put(
  "/atribuicoes/:id",
  adminAndLeader,
  validate(updateAtribuicaoSchema),
  EscalaController.updateAtribuicao
);
router.delete("/atribuicoes/:id", adminAndLeader, EscalaController.removeAtribuicao);

export default router;
