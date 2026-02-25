import { Router } from "express";
import EventoController from "../controllers/EventoController.js";
import multer from "multer";
import verificarToken from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/checkRole.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mesmo diretório que app.js usa em express.static("/uploads") — garante que salvar e servir usem a mesma pasta
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = (path.extname(file.originalname || "") || "").toLowerCase() || ".jpg";
    cb(null, "evento-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const ext = (path.extname(file.originalname || "") || "").toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    const mimeOk = allowedMimes.includes(file.mimetype);
    const extOk = allowedExts.includes(ext);

    if (mimeOk || extOk) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)"));
    }
  },
});

const router = Router();

// Rota pública para buscar eventos ativos (homepage)
router.get("/ativos", EventoController.getAtivos);

// Upload de imagem - apenas admin
router.post("/upload", verificarToken, adminOnly, (req, res, next) => {
  upload.single("imagem")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Imagem muito grande. Tamanho máximo: 5MB",
          });
        }
        return res.status(400).json({ error: err.message });
      }
      console.error("Erro Multer upload evento:", err);
      return res.status(400).json({
        error: err.message || "Erro ao processar a imagem",
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    await EventoController.uploadImagem(req, res);
  } catch (err) {
    console.error("Erro no controller uploadImagem:", err);
    res.status(500).json({
      error: err.message || "Erro interno ao processar o upload",
    });
  }
});

// CRUD - apenas admin
router.get("/", verificarToken, adminOnly, EventoController.getAll);
router.get("/:id", verificarToken, adminOnly, EventoController.getById);
router.post("/", verificarToken, adminOnly, EventoController.create);
router.put("/:id", verificarToken, adminOnly, EventoController.update);
router.delete("/:id", verificarToken, adminOnly, EventoController.delete);

export default router;
