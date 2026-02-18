import React, { useState, useEffect } from "react";
import { TextFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * VideoField Component
 * Campo para URLs de vídeo com preview do player
 * Suporta: YouTube, Vimeo, e links diretos de vídeo
 */
const VideoField: React.FC<TextFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  placeholder = "https://www.youtube.com/watch?v=...",
  required = false,
  disabled = false,
  className = "",
}) => {
  const fieldId = id || `field-${name}`;
  const hasError = Boolean(error);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value && typeof value === "string") {
      const url = convertToEmbedUrl(value);
      setEmbedUrl(url);
    } else {
      setEmbedUrl(null);
    }
  }, [value]);

  /**
   * Converte URLs de vídeo para formato embed
   */
  const convertToEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    try {
      // YouTube
      const youtubeRegex =
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
      const youtubeMatch = url.match(youtubeRegex);
      if (youtubeMatch && youtubeMatch[1]) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }

      // Vimeo
      const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
      const vimeoMatch = url.match(vimeoRegex);
      if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }

      // Link direto de vídeo
      if (url.match(/\.(mp4|webm|ogg)$/i)) {
        return url;
      }

      // Se não for reconhecido, retorna null
      return null;
    } catch (e) {
      return null;
    }
  };

  const isDirectVideo = embedUrl && embedUrl.match(/\.(mp4|webm|ogg)$/i);

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
        type="url"
        id={fieldId}
        name={name}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="form-input"
        aria-invalid={hasError}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      />

      {/* Instruções para o usuário */}
      <div
        style={{
          marginTop: "0.5rem",
          padding: "0.75rem",
          backgroundColor: "#f0f9ff",
          borderLeft: "3px solid #0284c7",
          borderRadius: "4px",
          fontSize: "0.875rem",
          color: "#0c4a6e",
        }}
      >
        <strong>💡 Como usar:</strong>
        <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem" }}>
          <li>
            Cole o link completo do vídeo do YouTube (ex:
            https://www.youtube.com/watch?v=...)
          </li>
          <li>Ou cole o link do Vimeo (ex: https://vimeo.com/...)</li>
          <li>
            Ou use um link direto para arquivo de vídeo (.mp4, .webm, .ogg)
          </li>
          <li>O vídeo aparecerá automaticamente abaixo após colar o link</li>
        </ul>
      </div>

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}

      {/* Preview do vídeo */}
      {embedUrl && !disabled && (
        <div className="video-preview" style={{ marginTop: "1rem" }}>
          {isDirectVideo ? (
            <video
              controls
              style={{
                width: "100%",
                maxWidth: "560px",
                height: "auto",
                borderRadius: "8px",
              }}
            >
              <source src={embedUrl} type="video/mp4" />
              Seu navegador não suporta o elemento de vídeo.
            </video>
          ) : (
            <iframe
              src={embedUrl}
              style={{
                width: "100%",
                maxWidth: "560px",
                height: "315px",
                border: "none",
                borderRadius: "8px",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={label || "Video"}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default VideoField;
