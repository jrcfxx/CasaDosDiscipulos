/**
 * Utilitários compartilhados para visualização de conteúdo de módulos
 * Usado por Admin e User/Leader
 */

import React from "react";
import {
  isUploadPath,
  getUploadUrl,
  getFileNameFromPath,
  isImagePath,
} from "../services/uploadService";

export function formatarConteudoCampo(conteudo: unknown): React.ReactNode {
  if (conteudo == null || conteudo === "") return "Sem conteúdo";

  if (
    typeof conteudo === "object" &&
    Object.keys(conteudo as object).length === 0
  ) {
    return "Sem conteúdo";
  }

  if (typeof conteudo === "string") {
    if (isUploadPath(conteudo)) {
      const fileName = getFileNameFromPath(conteudo);
      const url = getUploadUrl(conteudo);
      return (
        <div className="upload-preview-campo">
          {isImagePath(conteudo) ? (
            <div>
              <img
                src={url}
                alt={fileName}
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  borderRadius: "4px",
                }}
              />
              <br />
            </div>
          ) : null}
          <a href={url} target="_blank" rel="noopener noreferrer">
            📄 {fileName}
          </a>
        </div>
      );
    }

    const videoUrlRegex =
      /(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.ogg)/i;
    if (videoUrlRegex.test(conteudo)) {
      return renderVideoPreview(conteudo);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(conteudo);
    } catch {
      return conteudo;
    }

    if (typeof parsed === "object" && parsed !== null) {
      if (Object.keys(parsed as object).length === 0) {
        return "Sem conteúdo";
      }
      return (
        <pre className="json-formatted">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    }
    return String(conteudo);
  }

  if (typeof conteudo === "object") {
    if (Object.keys(conteudo as object).length === 0) return "Sem conteúdo";
    return (
      <pre className="json-formatted">
        {JSON.stringify(conteudo, null, 2)}
      </pre>
    );
  }

  return String(conteudo);
}

function renderVideoPreview(url: string): React.ReactNode {
  const convertToEmbedUrl = (videoUrl: string): string | null => {
    try {
      const youtubeRegex =
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
      const youtubeMatch = videoUrl.match(youtubeRegex);
      if (youtubeMatch?.[1]) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}?cc_load_policy=1`;
      }
      const vimeoMatch = videoUrl.match(/(?:vimeo\.com\/)(\d+)/);
      if (vimeoMatch?.[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }
      if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) return videoUrl;
      return null;
    } catch {
      return null;
    }
  };

  const embedUrl = convertToEmbedUrl(url);
  if (!embedUrl) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    );
  }

  const isDirectVideo = embedUrl.match(/\.(mp4|webm|ogg)$/i);
  return (
    <div className="video-preview-campo" style={{ marginTop: "0.5rem" }}>
      {isDirectVideo ? (
        <video controls aria-label="Vídeo" style={{ width: "100%", maxWidth: "400px", height: "auto", borderRadius: "8px" }}>
          <source src={embedUrl} type="video/mp4" />
          <track kind="captions" srcLang="pt-BR" label="Legendas" />
          Seu navegador não suporta o elemento de vídeo.
        </video>
      ) : (
        <iframe
          src={embedUrl}
          style={{
            width: "100%",
            maxWidth: "400px",
            height: "225px",
            border: "none",
            borderRadius: "8px",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video preview"
        />
      )}
    </div>
  );
}

export function getMedalIcon(position: number): React.ReactNode {
  if (position === 1) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="medal-icon gold">
        <circle cx="12" cy="12" r="10" fill="#f4b002" stroke="#f4b002" strokeWidth="2" />
        <text x="12" y="17" textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="bold">1</text>
      </svg>
    );
  }
  if (position === 2) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="medal-icon silver">
        <circle cx="12" cy="12" r="10" fill="#C0C0C0" stroke="#A8A8A8" strokeWidth="2" />
        <text x="12" y="17" textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="bold">2</text>
      </svg>
    );
  }
  if (position === 3) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="medal-icon bronze">
        <circle cx="12" cy="12" r="10" fill="#CD7F32" stroke="#B87333" strokeWidth="2" />
        <text x="12" y="17" textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="bold">3</text>
      </svg>
    );
  }
  return null;
}
