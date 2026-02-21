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
        return `https://www.youtube.com/embed/${youtubeMatch[1]}?cc_load_policy=1`;
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

      {/* Instruções para o usuário - sempre visíveis */}
      <div className="video-field-instructions" role="region" aria-label="Instruções de acessibilidade para vídeos">
        <strong>Como usar:</strong>
        <ul>
          <li>Cole o link do YouTube, Vimeo ou arquivo (.mp4, .webm, .ogg)</li>
          <li>O vídeo aparecerá automaticamente abaixo</li>
          <li>
            <strong>Importante para usuários surdos:</strong> use apenas vídeos legendados.
            No YouTube, as legendas são carregadas automaticamente quando disponíveis.
            No Vimeo, adicione legendas na configuração do vídeo. Para vídeos próprios
            (.mp4), inclua um arquivo de legendas (.vtt) e referencie no player.
          </li>
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
              aria-label={label || "Vídeo"}
            >
              <source src={embedUrl} type="video/mp4" />
              <track kind="captions" srcLang="pt-BR" label="Legendas" />
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
