import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório para salvar uploads
const uploadDir = path.join(__dirname, "..", "..", "uploads", "perfil");

// Criar diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera nome único: userId-timestamp.extensão
    const userId = req.usuario?.id_usuario || "temp";
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${userId}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// Filtro de arquivos - aceita apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  const allowedExts = [".jpg", ".jpeg", ".png", ".gif"];
  const ext = path.extname(file.originalname || "").toLowerCase();

  // Extensão obrigatória: ela define como o arquivo é servido (mime é falsificável)
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."),
      false
    );
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;
