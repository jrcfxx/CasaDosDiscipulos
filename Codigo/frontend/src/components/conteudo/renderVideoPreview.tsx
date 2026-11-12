import React from "react";

/**
 * Pré-visualização de vídeo dos campos dinâmicos (antes copiada em 3 telas:
 * Formulários, Quizzes e Lição do líder).
 */

/** Converte link do YouTube/Vimeo em URL de embed; vídeo direto (.mp4/.webm/.ogg) passa como está */
export function convertToEmbedUrl(videoUrl: string): string | null {
  try {
    // YouTube
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?cc_load_policy=1`;
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Link direto de vídeo
    if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return videoUrl;
    }

    return null;
  } catch {
    return null;
  }
}

export function renderVideoPreview(url: string): React.ReactNode {
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
