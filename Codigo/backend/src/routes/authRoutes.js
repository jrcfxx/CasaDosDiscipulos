import { Router } from "express";
import Joi from "joi";
import AuthController from "../controllers/authController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { loginUsuarioSchema, updatePasswordSchema } from "../validations/usuarioValidation.js";

const router = Router();

const codigoSchema = Joi.object({
  codigo: Joi.string().trim().max(20).required().messages({ "string.empty": "Digite o código", "any.required": "Digite o código" }),
});
const desativar2faSchema = codigoSchema.keys({
  senha: Joi.string().max(128).required().messages({ "string.empty": "Digite sua senha", "any.required": "Digite sua senha" }),
});

// Não há cadastro público: contas são criadas pelo administrador (Gerenciar Usuários).

// Login (sessão em cookie HttpOnly). Com 2FA ativo, há um segundo passo.
router.post("/login", validate(loginUsuarioSchema), AuthController.login);
router.post("/login/2fa", validate(codigoSchema), AuthController.loginSegundoFator);

// Encerrar a sessão (no servidor e o cookie)
router.post("/logout", AuthController.logout);

// Trocar a própria senha (inclusive no primeiro acesso)
router.post("/senha", verificarToken, validate(updatePasswordSchema), AuthController.trocarSenha);

// Aparelhos conectados e histórico de acessos da própria conta
router.get("/sessoes", verificarToken, AuthController.minhasSessoes);
router.post("/sessoes/encerrar-outras", verificarToken, AuthController.encerrarOutrasSessoes);
router.delete("/sessoes/:referencia", verificarToken, AuthController.encerrarMinhaSessao);
router.get("/acessos", verificarToken, AuthController.meusAcessos);

// Verificação em duas etapas (app autenticador)
router.get("/2fa", verificarToken, AuthController.statusDoisFatores);
router.post("/2fa/iniciar", verificarToken, AuthController.iniciarDoisFatores);
router.post("/2fa/ativar", verificarToken, validate(codigoSchema), AuthController.ativarDoisFatores);
router.post("/2fa/desativar", verificarToken, validate(desativar2faSchema), AuthController.desativarDoisFatores);
router.post("/2fa/codigos", verificarToken, validate(codigoSchema), AuthController.novosCodigosRecuperacao);

export default router;
