import React, { useEffect, useState } from "react";
import "../style/LicoesSecretariaCelulaUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import axios from "axios";
import { API_BASE, ASSETS_BASE } from "../config/api";

/* TYPES */
type Licao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  ativo?: number;
  campos?: any[];
};

const LicaoSecretariaCelulaUser: React.FC = () => {
  const [licoes, setLicoes] = useState<Licao[]>([]);
  const [selectedLicao, setSelectedLicao] = useState<Licao | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    await fetchLicoes();
    setLoading(false);
  };

  const fetchLicoes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/licao`);
      const mapped: Licao[] = (res.data || []).map((l: any) => ({
        id: l.id_licao ?? l.id ?? 0,
        titulo: l.titulo,
        descricao: l.descricao ?? "",
        ativo: l.ativo ?? 1,
        campos: l.campos ?? [],
      }));
      setLicoes(mapped);
      if (mapped.length > 0 && !selectedLicao) {
        setSelectedLicao(mapped[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar lições:", err);
    }
  };

  const handleSelectLicao = (licao: Licao) => {
    setSelectedLicao(licao);
  };

  const formatarConteudoCampo = (conteudo: any): React.ReactNode => {
    if (!conteudo) return "Sem conteúdo";

    // Se for uma string, tenta parsear como JSON
    let parsed = conteudo;
    if (typeof conteudo === "string") {
      // Verifica se é um arquivo de upload (caminho que começa com /uploads/)
      if (conteudo.startsWith("/uploads/") || conteudo.includes("/uploads/")) {
        const fileName = conteudo.split("/").pop() || "arquivo";
        const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
        const isImage = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "bmp",
        ].includes(fileExtension);

        return (
          <div className="upload-preview-campo">
            {isImage ? (
              <div>
                <img
                  src={`${ASSETS_BASE}${conteudo}`}
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
            <a
              href={`${ASSETS_BASE}${conteudo}`}
              target="_blank"
              rel="noopener noreferrer"
              download
              style={{
                color: "#3b82f6",
                textDecoration: "underline",
                fontSize: "0.9rem",
              }}
            >
              📄 Baixar {fileName}
            </a>
          </div>
        );
      }

      // Verifica se é uma URL de vídeo
      const videoUrlRegex =
        /(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.ogg)/i;
      if (videoUrlRegex.test(conteudo)) {
        return renderVideoPreview(conteudo);
      }

      try {
        parsed = JSON.parse(conteudo);
      } catch {
        // Não é JSON, retorna a string original
        return conteudo;
      }
    }

    // Se não for um objeto após o parse, retorna como está
    if (typeof parsed !== "object" || parsed === null) {
      return String(conteudo);
    }

    // Para outros tipos de objetos JSON, exibe formatado
    return (
      <pre className="json-formatted">{JSON.stringify(parsed, null, 2)}</pre>
    );
  };

  const renderVideoPreview = (url: string): React.ReactNode => {
    const convertToEmbedUrl = (videoUrl: string): string | null => {
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
          <video
            controls
            style={{
              width: "100%",
              maxWidth: "400px",
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
  };

  return (
    <div className="licoes-user-page page-with-fixed-header">
      <Header />
      <main id="main-content" className="page" tabIndex={-1}>
        <h1 className="page-title">SECRETARIA DAS CÉLULAS</h1>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="licoes-user-layout">
          {/* Coluna esquerda - Lista de Lições */}
          <aside
            className="panel licoes-user-left"
            aria-label="Lista de lições"
          >
            <div className="list-header">
              <h2>Lições</h2>
              <span className="count">{licoes.length}</span>
            </div>
            <div className="list">
              {licoes.map((licao) => (
                <div
                  key={licao.id}
                  className={`licao-item ${
                    selectedLicao?.id === licao.id ? "selected" : ""
                  }`}
                  onClick={() => handleSelectLicao(licao)}
                >
                  <div className="licao-item__info">
                    <span className="licao-item__name">{licao.titulo}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Coluna direita - Visualização da Lição (Somente Leitura) */}
          <section
            className="panel licoes-user-center"
            aria-label="Detalhes da lição"
          >
            {selectedLicao ? (
              <div className="licao-card">
                <div className="licao-header">
                  <div className="licao-title-area">
                    <h2 className="licao-title">{selectedLicao.titulo}</h2>
                  </div>
                </div>

                {selectedLicao.descricao && (
                  <div className="licao-description">
                    <h3>Descrição</h3>
                    <p>{selectedLicao.descricao}</p>
                  </div>
                )}

                <div className="licao-meta">
                  <div className="meta-item">
                    <span className="meta-label">Campos:</span>
                    <span className="meta-value">
                      {selectedLicao.campos?.length || 0}
                    </span>
                  </div>
                </div>

                {selectedLicao.campos && selectedLicao.campos.length > 0 ? (
                  <div className="licao-fields">
                    <h3>Campos Personalizados</h3>
                    <div className="campos-grid">
                      {selectedLicao.campos.map((campo, index) => (
                        <div key={index} className="campo-card">
                          <div className="campo-label">
                            {campo.label || "Sem label"}
                          </div>
                          <div className="campo-conteudo">
                            {formatarConteudoCampo(campo.conteudo)}
                          </div>
                          {campo.obrigatorio && (
                            <span className="campo-required">Obrigatório</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="licao-empty">
                    <p>Esta lição não possui campos cadastrados.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="licao-placeholder">
                <p>Selecione uma lição na lista para visualizar</p>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LicaoSecretariaCelulaUser;
