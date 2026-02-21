import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import FalaAiController from "../controllers/FalaAiController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminAndLeader, authenticatedOnly } from "../middlewares/checkRole.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(process.cwd(), "uploads", "fala-ai");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname || "") || ".jpg").toLowerCase();
    cb(null, "fala-ai-" + Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Apenas imagens (JPEG, PNG, GIF, WebP)"));
  },
});

const router = Router();

router.use(verificarToken);
router.use(authenticatedOnly);

// Listar posts (todos)
router.get("/posts", FalaAiController.listarPosts);

// Detalhe de post (todos)
router.get("/posts/:id", FalaAiController.getPost);

// Criar post (admin e líder)
router.post("/posts", adminAndLeader, FalaAiController.criarPost);

// Upload de imagem para post (admin e líder)
router.post("/upload", adminAndLeader, (req, res) => {
  upload.single("imagem")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Imagem muito grande. Máximo: 5MB" });
      }
      return res.status(400).json({ error: err.message || "Erro no upload" });
    }
    if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });
    res.json({ imagem_url: `/uploads/fala-ai/${req.file.filename}` });
  });
});

// Comentário (todos)
router.post("/posts/:id/comentarios", FalaAiController.adicionarComentario);

// Excluir comentário (autor ou admin)
router.delete("/comentarios/:idComentario", FalaAiController.excluirComentario);

// Excluir post (autor ou admin)
router.delete("/posts/:id", FalaAiController.excluirPost);

export default router;
