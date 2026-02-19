import React, { useEffect, useState } from "react";
import "../../style/tokens.css";
import "../../style/form.css";

interface UploadFieldProps {
  id?: string;
  name: string;
  label?: string;
  value?: File | string | null;
  onChange: (file: File | null) => void;
  error?: string;
  accept?: string;
  maxSize?: number; // em bytes
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];

/**
 * UploadField Component
 * Campo para upload de arquivos com validação, preview de imagem e feedback visual
 */
const UploadField: React.FC<UploadFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB padrão
  required = false,
  disabled = false,
  className = "",
}) => {
  const fieldId = id || `field-${name}`;
  const hasError = Boolean(error);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Preview de imagem quando value é File
  useEffect(() => {
    if (value instanceof File) {
      const ext = value.name.split(".").pop()?.toLowerCase();
      if (ext && IMAGE_EXTENSIONS.includes(ext)) {
        const url = URL.createObjectURL(value);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
    setPreviewUrl(null);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Lista de extensões permitidas
      const allowedExtensions = [
        // Documentos
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".txt",
        ".rtf",
        ".odt",
        ".ods",
        ".odp",
        // Imagens
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
        // Áudio
        ".mp3",
        ".wav",
        ".ogg",
        ".m4a",
        // Vídeo
        ".mp4",
        ".mpeg",
        ".webm",
        // Compactados
        ".zip",
        ".rar",
        ".7z",
      ];

      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      // Validar tipo de arquivo
      if (!allowedExtensions.includes(fileExtension)) {
        setValidationError(
          `Tipo de arquivo não permitido: ${fileExtension}. Formatos aceitos: PDF, Word, Excel, PowerPoint, imagens, áudio, vídeo e arquivos compactados.`
        );
        setTimeout(() => setValidationError(null), 5000);
        onChange(null);
        e.target.value = ""; // Limpa o input
        return;
      }

      // Validar tamanho
      if (file.size > maxSize) {
        setValidationError(
          `Arquivo muito grande! Tamanho máximo: ${formatFileSize(maxSize)}. Tamanho do arquivo: ${formatFileSize(file.size)}`
        );
        setTimeout(() => setValidationError(null), 5000);
        onChange(null);
        e.target.value = ""; // Limpa o input
        return;
      }
    }

    setValidationError(null);
    onChange(file);
  };

  const getFileName = (): string => {
    if (value instanceof File) return value.name;
    if (typeof value === "string" && value) {
      return value.split("/").pop() || "Arquivo atual";
    }
    return "";
  };

  const hasValue = value instanceof File || (typeof value === "string" && value.length > 0);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div
      className={`form-field ${
        hasError ? "form-field--error" : ""
      } ${className}`}
    >
      {label && (
        <label
          htmlFor={fieldId}
          className={`form-label ${required ? "form-label--required" : ""} ${
            disabled ? "form-label--disabled" : ""
          }`}
        >
          {label}
        </label>
      )}

      <input
        type="file"
        id={fieldId}
        name={name}
        onChange={handleFileChange}
        accept={
          accept ||
          ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.mp3,.wav,.ogg,.m4a,.mp4,.mpeg,.webm,.zip,.rar,.7z"
        }
        required={required}
        disabled={disabled}
        className="form-input"
        aria-invalid={hasError}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      />

      {hasValue && (
        <div className="form-field__file-info">
          {previewUrl && (
            <div className="form-field__file-preview">
              <img src={previewUrl} alt="Preview" />
            </div>
          )}
          <div className="form-field__file-meta">
            <span className="form-field__file-name">{getFileName()}</span>
            {value instanceof File && (
              <span className="form-field__file-size">
                {formatFileSize(value.size)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="form-field__hint" style={{ color: "#4b5563", fontWeight: 500 }}>
        Tamanho máximo: {formatFileSize(maxSize)}
      </div>

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
      {validationError && (
        <span className="form-error" role="alert" style={{ display: "block", marginTop: "0.25rem" }}>
          {validationError}
        </span>
      )}
    </div>
  );
};

export default UploadField;
