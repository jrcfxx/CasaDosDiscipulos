import React from "react";
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

/**
 * UploadField Component
 * Campo para upload de arquivos com validação de tipo e tamanho
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
        alert(
          `Tipo de arquivo não permitido: ${fileExtension}\n\nFormatos aceitos: PDF, Word, Excel, PowerPoint, imagens, áudio, vídeo e arquivos compactados.`
        );
        onChange(null);
        e.target.value = ""; // Limpa o input
        return;
      }

      // Validar tamanho
      if (file.size > maxSize) {
        alert(
          `Arquivo muito grande! Tamanho máximo: ${formatFileSize(
            maxSize
          )}\nTamanho do arquivo: ${formatFileSize(file.size)}`
        );
        onChange(null);
        e.target.value = ""; // Limpa o input
        return;
      }
    }

    onChange(file);
  };

  const getFileName = (): string => {
    if (value instanceof File) {
      return value.name;
    }
    if (typeof value === "string" && value) {
      return value.split("/").pop() || "Arquivo atual";
    }
    return "";
  };

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

      {value && (
        <div className="form-field__file-info">
          <span className="form-field__file-name">{getFileName()}</span>
          {value instanceof File && (
            <span className="form-field__file-size">
              {formatFileSize(value.size)}
            </span>
          )}
        </div>
      )}

      <div
        className="form-field__hint"
        style={{ color: "#4b5563", fontWeight: 500 }}
      >
        Tamanho máximo: {formatFileSize(maxSize)}
        {accept && ` • Tipos aceitos: ${accept}`}
      </div>

      {/* Instruções para o usuário */}
      <div
        style={{
          marginTop: "0.75rem",
          padding: "0.75rem",
          backgroundColor: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "6px",
          fontSize: "0.85rem",
          color: "#0c4a6e",
        }}
      >
        <strong>📁 Como usar o campo Upload:</strong>
        <ul
          style={{
            marginTop: "0.5rem",
            marginBottom: 0,
            paddingLeft: "1.5rem",
          }}
        >
          <li>
            Clique no botão "Escolher arquivo" para selecionar um arquivo do seu
            dispositivo
          </li>
          <li>
            <strong>Formatos permitidos:</strong> PDF, Word (.doc, .docx), Excel
            (.xls, .xlsx), PowerPoint (.ppt, .pptx), imagens (.jpg, .png, .gif,
            .svg), áudio (.mp3, .wav), vídeo (.mp4, .webm) e arquivos
            compactados (.zip, .rar)
          </li>
          <li>Tamanho máximo: 10MB</li>
          <li>O arquivo será enviado junto com o formulário ao salvar</li>
          <li>Após o envio, o arquivo ficará disponível para download</li>
        </ul>
      </div>

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default UploadField;
