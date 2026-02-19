import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/ModulosEscolaDiscipulosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import moduloService from "../services/moduloService";
import usuarioService, { Usuario } from "../services/usuarioService";
import { Modulo } from "../types";

const ModulosEscolaDiscipulosAdmin: React.FC = () => {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selectedModulo, setSelectedModulo] = useState<Modulo | null>(null);
  const [quizVinculado, setQuizVinculado] = useState<any>(null);
  const [ranking, setRanking] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchModulos(), fetchRanking()]);
    setLoading(false);
  };

  const fetchModulos = async () => {
    try {
      const data = await moduloService.getAll();
      setModulos(data);
      if (data.length > 0 && !selectedModulo) {
        const primeiroModulo = data[0];
        setSelectedModulo(primeiroModulo);
        // Carregar quiz vinculado ao primeiro módulo
        await loadQuizVinculado(primeiroModulo.id_modulo);
      }
    } catch (error) {
      console.error("Erro ao carregar módulos:", error);
    }
  };

  const fetchRanking = async () => {
    try {
      const topUsuarios = await usuarioService.getRanking(20);
      setRanking(topUsuarios);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await moduloService.toggleActive(id);
      const data = await moduloService.getAll();
      setModulos(data);

      // Se o módulo alterado é o que está selecionado, atualizar a visualização
      if (selectedModulo && selectedModulo.id_modulo === id) {
        const moduloAtualizado = data.find((m) => m.id_modulo === id);
        if (moduloAtualizado) {
          setSelectedModulo(moduloAtualizado);
          await loadQuizVinculado(moduloAtualizado.id_modulo);
        }
      }
    } catch (error) {
      console.error("Erro ao alternar módulo:", error);
    }
  };

  const loadQuizVinculado = async (moduloId: number) => {
    try {
      const quiz = await moduloService.getQuizVinculado(moduloId);
      setQuizVinculado(quiz);
    } catch (error) {
      console.error("Erro ao carregar quiz vinculado:", error);
      setQuizVinculado(null);
    }
  };

  const handleSelectModulo = async (modulo: Modulo) => {
    setSelectedModulo(modulo);
    await loadQuizVinculado(modulo.id_modulo);
  };

  const getIniciais = (nome: string): string => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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
                  src={`http://localhost:3001${conteudo}`}
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
              href={`http://localhost:3001${conteudo}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#3b82f6",
                textDecoration: "underline",
                fontSize: "0.9rem",
              }}
            >
              📄 {fileName}
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
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
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

  const getMedalIcon = (position: number) => {
    if (position === 1) {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="medal-icon gold"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="#FFF"
            fontSize="12"
            fontWeight="bold"
          >
            1
          </text>
        </svg>
      );
    }
    if (position === 2) {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="medal-icon silver"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="#C0C0C0"
            stroke="#A8A8A8"
            strokeWidth="2"
          />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="#FFF"
            fontSize="12"
            fontWeight="bold"
          >
            2
          </text>
        </svg>
      );
    }
    if (position === 3) {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="medal-icon bronze"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="#CD7F32"
            stroke="#B87333"
            strokeWidth="2"
          />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="#FFF"
            fontSize="12"
            fontWeight="bold"
          >
            3
          </text>
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="modulos-page page-with-fixed-header">
      <Header />
      <main className="page">
        <h1 className="page-title">ESCOLA DE DISCÍPULOS</h1>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="modules-layout">
          {/* Coluna esquerda - Lista de Módulos */}
          <aside className="panel modules-left" aria-label="Lista de módulos">
            <div className="list-header">
              <h2>Módulos</h2>
              <span className="count">{modulos.length}</span>
            </div>
            <div className="list">
              {modulos.map((modulo) => (
                <div
                  key={modulo.id_modulo}
                  className={`mod-item ${
                    selectedModulo?.id_modulo === modulo.id_modulo
                      ? "selected"
                      : ""
                  } ${!modulo.ativo ? "inactive" : ""}`}
                  onClick={() => handleSelectModulo(modulo)}
                >
                  <div className="mod-item__info">
                    <span className="mod-item__ordem">#{modulo.ordem}</span>
                    <span className="mod-item__name">{modulo.titulo}</span>
                  </div>
                  <button
                    className={`btn-status ${
                      modulo.ativo ? "active" : "inactive"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(modulo.id_modulo);
                    }}
                    title={modulo.ativo ? "Desativar módulo" : "Ativar módulo"}
                  >
                    {modulo.ativo ? "Ativo" : "Inativo"}
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn-create"
              onClick={() => navigate("/admin/modulos/criar")}
            >
              + CRIAR MÓDULO
            </button>
          </aside>

          {/* Coluna central - Visualização do Módulo */}
          <section
            className="panel modules-center"
            aria-label="Detalhes do módulo"
          >
            {selectedModulo ? (
              <div className="module-card">
                <div className="module-header">
                  <div className="module-title-area">
                    <h2 className="module-title">{selectedModulo.titulo}</h2>
                    <span
                      className={`badge badge-${
                        selectedModulo.ativo ? "active" : "inactive"
                      }`}
                    >
                      {selectedModulo.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <button
                    className="btn-edit"
                    onClick={() =>
                      navigate(
                        `/admin/modulos/editar/${selectedModulo.id_modulo}`
                      )
                    }
                  >
                    Editar
                  </button>
                </div>

                {selectedModulo.descricao && (
                  <div className="module-description">
                    <h3>Descrição</h3>
                    <p>{selectedModulo.descricao}</p>
                  </div>
                )}

                <div className="module-meta">
                  <div className="meta-item">
                    <span className="meta-label">Ordem:</span>
                    <span className="meta-value">{selectedModulo.ordem}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Campos:</span>
                    <span className="meta-value">
                      {selectedModulo.campos?.length || 0}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Quiz:</span>
                    <span className="meta-value">
                      {quizVinculado ? (
                        <span className="quiz-linked">
                          {quizVinculado.titulo ||
                            `Quiz #${quizVinculado.id_quiz}`}
                        </span>
                      ) : (
                        <span className="quiz-none">Nenhum</span>
                      )}
                    </span>
                  </div>
                </div>

                {selectedModulo.campos && selectedModulo.campos.length > 0 ? (
                  <div className="module-fields">
                    <h3>Campos Personalizados</h3>
                    <div className="campos-grid">
                      {selectedModulo.campos.map((campo, index) => (
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
                  <div className="module-empty">
                    <p>Este módulo não possui campos cadastrados.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="module-placeholder">
                <p>Selecione um módulo na lista para visualizar</p>
              </div>
            )}
          </section>

          {/* Coluna direita - Ranking */}
          <aside className="panel modules-right" aria-label="Ranking">
            <div className="ranking-card">
              <div className="ranking-header">
                <div className="ranking-header-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <defs>
                      <linearGradient
                        id="headerGoldGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="50%" stopColor="#FFA500" />
                        <stop offset="100%" stopColor="#FFD700" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      fill="rgba(255, 215, 0, 0.2)"
                    />
                    <path
                      d="M15 15 L20 10 L25 15 L23 25 L17 25 Z"
                      fill="url(#headerGoldGradient)"
                      stroke="#FFA500"
                      strokeWidth="2"
                    />
                    <circle cx="20" cy="17" r="3" fill="#FFF" opacity="0.5" />
                  </svg>
                </div>
                <div>
                  <h3>RANKING</h3>
                  <span className="ranking-subtitle">Top 20 Discípulos</span>
                </div>
              </div>
              <div className="ranking-list">
                {ranking.length > 0 ? (
                  ranking.map((usuario, index) => {
                    const position = index + 1;
                    const isTopThree = position <= 3;
                    const medal = getMedalIcon(position);

                    return (
                      <div
                        key={usuario.id_usuario}
                        className={`rank-item ${
                          isTopThree ? `top-${position}` : ""
                        }`}
                      >
                        {medal ? (
                          <div className="rank-medal">{medal}</div>
                        ) : (
                          <div className="rank-position">{position}º</div>
                        )}
                        <div
                          className={`rank-avatar ${
                            isTopThree ? "highlighted" : ""
                          }`}
                        >
                          {usuario.foto ? (
                            <img
                              src={`http://localhost:3001${usuario.foto}`}
                              alt={usuario.nome}
                              className="rank-avatar-photo"
                            />
                          ) : (
                            getIniciais(usuario.nome)
                          )}
                        </div>
                        <div className="rank-info">
                          <p className="rank-name">{usuario.nome}</p>
                          <p className="rank-points">{usuario.pontuacao} pts</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="ranking-empty">
                    <p>Nenhum usuário no ranking</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ModulosEscolaDiscipulosAdmin;
