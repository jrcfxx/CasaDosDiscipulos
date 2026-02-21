import express from "express";
import multer from "multer";
import verificarToken from "../middlewares/authMiddleware.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Diretório para salvar uploads de campos personalizados
const uploadDir = path.join(__dirname, "..", "..", "uploads", "campos");

// Criar diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento para campos personalizados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera nome único: timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const filename = `${basename}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// Configuração do multer para campos personalizados
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/x-pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      "application/rtf",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.presentation",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "video/mp4",
      "video/mpeg",
      "video/webm",
      "video/ogg",
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
    ];

    // Extensões permitidas como fallback (alguns navegadores enviam MIME incorreto)
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedExts = [
      ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
      ".txt", ".csv", ".rtf", ".odt", ".ods", ".odp",
      ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp",
      ".mp3", ".wav", ".ogg", ".m4a", ".mp4", ".webm",
      ".zip", ".rar", ".7z",
    ];

    const mimeOk = allowedMimes.includes(file.mimetype);
    const extOk = allowedExts.includes(ext);

    if (mimeOk || extOk) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Tipo não permitido: ${file.mimetype}. Use PDF, Word, imagens, áudio ou vídeo.`
        ),
        false
      );
    }
  },
});

/**
 * POST /api/upload/campo
 * Upload de arquivo para campo personalizado - requer autenticação
 */
router.post("/campo", verificarToken, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Erro ao fazer upload:", err);

      // Trata erros específicos do multer
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Arquivo muito grande. Tamanho máximo permitido: 10MB",
          });
        }
        return res.status(400).json({ error: err.message });
      }

      // Erro de validação de tipo de arquivo
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        const contentType = req.get("Content-Type") || "";
        if (!contentType.includes("multipart/form-data")) {
          return res.status(400).json({
            error:
              "Requisição inválida. Use multipart/form-data com o campo 'file'.",
          });
        }
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      // Retorna o caminho relativo do arquivo
      const filePath = `/uploads/campos/${req.file.filename}`;

      res.status(200).json({
        message: "Arquivo enviado com sucesso",
        path: filePath,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Erro ao processar upload:", error);
      res.status(500).json({ error: "Erro ao processar upload do arquivo" });
    }
  });
});

export default router;
