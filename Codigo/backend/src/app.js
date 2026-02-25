import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import ModuloRoutes from "./routes/ModuloRoutes.js";
import CampoRoutes from "./routes/CampoPersonalizadoRoutes.js";
import AuthRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/QuizRoutes.js";
import quizRespostaRoutes from "./routes/quizRespostaRoutes.js";
import LicaoRoutes from "./routes/licaoRoutes.js";
import FormularioRoutes from "./routes/FormularioRoutes.js";
import formularioRespostaRoutes from "./routes/formularioRespostaRoutes.js";
import celulaRoutes from "./routes/celulaRoutes.js";
import eventoRoutes from "./routes/eventoRoutes.js";
import escalaRoutes from "./routes/escalaRoutes.js";
import nivelRoutes from "./routes/nivelRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import usuarioCelulaRoutes from "./routes/usuarioCelulaRoutes.js";
import ministerioRoutes from "./routes/ministerioRoutes.js";
import notificacaoRoutes from "./routes/notificacaoRoutes.js";
import falaAiRoutes from "./routes/falaAiRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { iniciarJobModulosWhatsApp } from "./jobs/whatsappModulosJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || true,
    credentials: true,
  })
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 300,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Servir arquivos estáticos da pasta uploads (permite carregamento cross-origin para imagens no frontend)
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API Casa dos Discípulos - Online" });
});

// Rotas de autenticação
app.use("/api/auth", AuthRoutes);

// Rotas de usuários
app.use("/api/usuarios", usuarioRoutes);

// Rotas de Módulos (Escola de Discípulos)
app.use("/api/modulo", ModuloRoutes);

// Rotas de Campos Personalizados
app.use("/api/campo", CampoRoutes);

// Rotas de Quizzes
app.use("/api/quiz", quizRoutes);

// Rotas de Respostas de Quiz
app.use("/api/quiz-resposta", quizRespostaRoutes);

// Rotas de Lições (Secretaria das Células)
app.use("/api/licao", LicaoRoutes);

// Rotas de Formulários (Secretaria das Células)
app.use("/api/formulario", FormularioRoutes);

// Rotas de Respostas de Formulário
app.use("/api/formulario-resposta", formularioRespostaRoutes);

// Rotas de Células
app.use("/api/celula", celulaRoutes);

// Rotas de Eventos
app.use("/api/evento", eventoRoutes);

// Rotas de Escala (calendário, atribuições)
app.use("/api/escala", escalaRoutes);

// Rotas de Níveis
app.use("/api/nivel", nivelRoutes);

// Rotas de Upload
app.use("/api/upload", uploadRoutes);

// Célula principal do usuário (perfil)
app.use("/api/usuario-celula", usuarioCelulaRoutes);

// Ministérios
app.use("/api/ministerios", ministerioRoutes);

// Notificações
app.use("/api/notificacoes", notificacaoRoutes);

// Fala Aí Discípulo (devocional e palavra do dia)
app.use("/api/fala-ai", falaAiRoutes);

// Middleware de tratamento de erros deve vir por último
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  iniciarJobModulosWhatsApp();
});
