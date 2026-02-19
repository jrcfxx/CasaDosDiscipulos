import express from "express";
import cors from "cors";
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
import errorHandler from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Teste simples da API
app.get("/", (req, res) => {
  res.json({ message: "API Casa dos Discípulos - Online ✓" });
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

// Middleware de tratamento de erros deve vir por último
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
