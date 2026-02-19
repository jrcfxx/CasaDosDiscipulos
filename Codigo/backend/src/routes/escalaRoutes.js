import { Router } from "express";
import EscalaController from "../controllers/EscalaController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminAndLeader } from "../middlewares/checkRole.js";
import validate from "../middlewares/validate.js";
import {
  createEscalaEventoSchema,
  updateEscalaEventoSchema,
  createAtribuicaoSchema,
} from "../validations/escalaValidation.js";

const router = Router();

router.use(verificarToken);
router.use(adminAndLeader);

// Eventos do calendário (listar)
router.get("/eventos", EscalaController.getEventos);

// Evento completo com áreas e atribuições (rota específica antes de :id)
router.get("/eventos/:id/completo", EscalaController.getEventoCompleto);
router.get("/eventos/:id/usuarios-para-escalar", EscalaController.getUsuariosParaEscalar);
router.get("/eventos/:id", EscalaController.getEventoById);

// Criar evento (apenas admin - verificado no service)
router.post(
  "/eventos",
  validate(createEscalaEventoSchema),
  EscalaController.createEvento
);

// Atualizar evento
router.put(
  "/eventos/:id",
  validate(updateEscalaEventoSchema),
  EscalaController.updateEvento
);

// Excluir evento (apenas admin - verificado no service)
router.delete("/eventos/:id", EscalaController.deleteEvento);

// Atribuições
router.post(
  "/atribuicoes",
  validate(createAtribuicaoSchema),
  EscalaController.addAtribuicao
);
router.delete("/atribuicoes/:id", EscalaController.removeAtribuicao);

export default router;
