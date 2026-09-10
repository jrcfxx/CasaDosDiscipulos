import { Router } from "express";
import EscalaController from "../controllers/EscalaController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import {
  adminOnly,
  adminAndLiderMinisterio,
  authenticatedOnly,
} from "../middlewares/checkRole.js";
import validate from "../middlewares/validate.js";
import {
  createEscalaEventoSchema,
  updateEscalaEventoSchema,
  createAtribuicaoSchema,
  updateAtribuicaoSchema,
  moverAtribuicaoSchema,
  validarAtribuicaoSchema,
  copiarEventoSchema,
  copiarSemanaSchema,
  copiarDiaSchema,
  criarTemplateSchema,
  aplicarTemplateSchema,
  moverMembroUnificadoSchema,
} from "../validations/escalaValidation.js";

const router = Router();

router.use(verificarToken);

// Visões unificadas (eventos + pessoas + instrumentos)
router.get("/visualizacao/dia/:data", authenticatedOnly, EscalaController.getVisualizacaoDia);
router.get("/visualizacao/semana/:dataInicio", authenticatedOnly, EscalaController.getVisualizacaoSemana);
router.get("/visualizacao/mes/:ano/:mes", authenticatedOnly, EscalaController.getVisualizacaoMes);
router.get("/visualizacao/ano/:ano", authenticatedOnly, EscalaController.getVisualizacaoAno);
router.get("/pessoa/:usuarioId/periodo", authenticatedOnly, EscalaController.getEscalasDaPessoa);
router.post(
  "/mover-membro-validar",
  adminAndLiderMinisterio,
  validate(moverMembroUnificadoSchema),
  EscalaController.validarMoverMembro
);
router.put(
  "/mover-membro",
  adminAndLiderMinisterio,
  validate(moverMembroUnificadoSchema),
  EscalaController.moverMembroUnificado
);
router.post(
  "/eventos/copiar-dia",
  adminOnly,
  validate(copiarDiaSchema),
  EscalaController.copiarDia
);

// Visões
router.get("/visao/dia/:data", authenticatedOnly, EscalaController.getVisaoDia);
router.get("/visao/semana/:dataInicio", authenticatedOnly, EscalaController.getVisaoSemana);
router.get("/visao/mes/:ano/:mes", authenticatedOnly, EscalaController.getVisaoMes);
router.get("/visao/ano/:ano", authenticatedOnly, EscalaController.getVisaoAno);

// Templates
router.get("/templates", adminAndLiderMinisterio, EscalaController.listarTemplates);
router.post(
  "/templates",
  adminOnly,
  validate(criarTemplateSchema),
  EscalaController.criarTemplate
);
router.post(
  "/templates/:id/aplicar",
  adminOnly,
  validate(aplicarTemplateSchema),
  EscalaController.aplicarTemplate
);
router.delete("/templates/:id", adminOnly, EscalaController.excluirTemplate);

// Copiar semana
router.post(
  "/eventos/copiar-semana",
  adminOnly,
  validate(copiarSemanaSchema),
  EscalaController.copiarSemana
);

// Leitura eventos
router.get("/eventos", authenticatedOnly, EscalaController.getEventos);
router.get("/eventos/:id/completo", authenticatedOnly, EscalaController.getEventoCompleto);
router.get("/eventos/:id/historico", adminAndLiderMinisterio, EscalaController.getHistorico);
router.get("/eventos/:id", authenticatedOnly, EscalaController.getEventoById);

router.get(
  "/eventos/:id/usuarios-para-escalar",
  adminAndLiderMinisterio,
  EscalaController.getUsuariosParaEscalar
);

// CRUD eventos (criar/editar/excluir: admin)
router.post(
  "/eventos",
  adminOnly,
  validate(createEscalaEventoSchema),
  EscalaController.createEvento
);
router.put(
  "/eventos/:id",
  adminOnly,
  validate(updateEscalaEventoSchema),
  EscalaController.updateEvento
);
router.delete("/eventos/:id", adminOnly, EscalaController.deleteEvento);

router.post(
  "/eventos/:id/validar",
  adminAndLiderMinisterio,
  validate(validarAtribuicaoSchema),
  EscalaController.validarAtribuicao
);
router.post("/eventos/:id/publicar", adminOnly, EscalaController.publicarEvento);
router.post(
  "/eventos/:id/copiar",
  adminOnly,
  validate(copiarEventoSchema),
  EscalaController.copiarEvento
);
router.post("/eventos/:id/desfazer", adminOnly, EscalaController.desfazer);

// Atribuições
router.post(
  "/atribuicoes",
  adminAndLiderMinisterio,
  validate(createAtribuicaoSchema),
  EscalaController.addAtribuicao
);
router.put(
  "/atribuicoes/:id",
  adminAndLiderMinisterio,
  validate(updateAtribuicaoSchema),
  EscalaController.updateAtribuicao
);
router.post(
  "/atribuicoes/:id/mover",
  adminAndLiderMinisterio,
  validate(moverAtribuicaoSchema),
  EscalaController.moverAtribuicao
);
router.delete("/atribuicoes/:id", adminAndLiderMinisterio, EscalaController.removeAtribuicao);

export default router;
