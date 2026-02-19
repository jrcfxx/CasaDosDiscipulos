import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../style/PreencherModulosEscolaDiscipulosUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import moduloService from "../services/moduloService";
import quizService, { type Quiz, type QuizQuestao } from "../services/quizService";
import { getUploadUrl } from "../services/uploadService";
import { ASSETS_BASE } from "../config/api";
import type { Modulo, Campo } from "../types";

const PreencherModulosEscolaDiscipulosUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const idModulo = id ? parseInt(id, 10) : null;

  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [concluindo, setConcluindo] = useState(false);
  const [erroAcesso, setErroAcesso] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    pontos: number;
    total: number;
    eh_repeticao?: boolean;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!idModulo || isNaN(idModulo)) {
      navigate("/usuario/modulos");
      return;
    }
    loadData();
  }, [idModulo, navigate]);

  const loadData = async () => {
    setLoading(true);
    setErroAcesso(null);
    try {
      const [moduloData, quizData] = await Promise.all([
        moduloService.getById(idModulo!),
        moduloService.getQuizVinculado(idModulo!),
      ]);
      setModulo(moduloData);

      if (quizData?.id_quiz) {
        try {
          await moduloService.iniciar(idModulo!);
        } catch (e: any) {
          if (e?.response?.status === 409) {
            // Módulo já iniciado/concluído — seguir normalmente
          } else {
            const msg = e?.response?.data?.error || e?.message || "Complete os módulos anteriores na sequência.";
            setErroAcesso(msg);
            return;
          }
        }
        const quizCompleto = await quizService.getById(quizData.id_quiz);
        setQuiz(quizCompleto);
        const init: Record<number, string> = {};
        (quizCompleto.questoes || []).forEach((q: QuizQuestao) => {
          init[q.id_questao] = "";
        });
        setRespostas(init);
      } else {
        try {
          await moduloService.iniciar(idModulo!);
        } catch (e: any) {
          if (e?.response?.status === 409) {
            // Módulo já iniciado/concluído — seguir normalmente
          } else {
            const msg = e?.response?.data?.error || e?.message || "Complete os módulos anteriores na sequência.";
            setErroAcesso(msg);
            return;
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar:", err);
      navigate("/usuario/modulos");
    } finally {
      setLoading(false);
    }
  };

  const handleConcluirSemQuiz = async () => {
    if (!idModulo) return;
    setConcluindo(true);
    try {
      await moduloService.concluir(idModulo);
      navigate("/usuario/modulos");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Erro ao concluir módulo.";
      setToast(msg);
    } finally {
      setConcluindo(false);
    }
  };

  const convertVideoToEmbedUrl = (url: string): string | null => {
    if (!url || typeof url !== "string") return null;
    const u = url.trim();
    if (!u) return null;
    try {
      // YouTube - vários formatos: watch?v=ID, youtu.be/ID, embed/ID, /v/ID
      const ytId =
        u.match(/(?:[?&]v=|\/embed\/|\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ||
        u.match(/^([a-zA-Z0-9_-]{11})$/)?.[1];
      if (ytId) return `https://www.youtube.com/embed/${ytId}`;
      // Vimeo
      const vimeoId = u.match(/(?:vimeo\.com\/)(\d+)/)?.[1];
      if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
      // Vídeo direto (.mp4, .webm, .ogg)
      if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return u.startsWith("http") ? u : `${ASSETS_BASE}${u}`;
      return null;
    } catch {
      return null;
    }
  };

  const parseOpcoes = (opcoes: string | Array<{ id: string; texto: string }> | undefined) => {
    if (!opcoes) return [];
    if (Array.isArray(opcoes)) return opcoes;
    try {
      const parsed = JSON.parse(opcoes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getVideoMimeType = (url: string): string => {
    if (/\.webm(\?|$)/i.test(url)) return "video/webm";
    if (/\.ogg(\?|$)/i.test(url)) return "video/ogg";
    return "video/mp4";
  };

  const renderVideoEmbed = (valor: string, label?: string) => {
    const rawUrl = String(valor).startsWith("http")
      ? String(valor)
      : `${ASSETS_BASE}${String(valor)}`;
    const embedUrl = convertVideoToEmbedUrl(rawUrl);
    if (!embedUrl) return null;
    const isDirectVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(embedUrl);
    return (
      <div className="modulo-video" role="region" aria-label={label ?? "Reprodutor de vídeo"}>
        {isDirectVideo ? (
          <video controls playsInline>
            <source src={embedUrl} type={getVideoMimeType(embedUrl)} />
            Seu navegador não suporta o vídeo.
          </video>
        ) : (
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={label ?? "Vídeo"}
          />
        )}
      </div>
    );
  };

  const renderConteudo = (campo: Campo) => {
    const tipo = String(campo.tipo_campo || "texto").toLowerCase();
    const valor = campo.conteudo ?? "";

    if (valor === null || valor === undefined || valor === "") return null;

    switch (tipo) {
      case "link": {
        const videoEmbed = renderVideoEmbed(String(valor), campo.label);
        if (videoEmbed) return videoEmbed;
        return (
          <a href={String(valor)} target="_blank" rel="noopener noreferrer" className="modulo-link">
            {String(valor)}
          </a>
        );
      }
      case "video": {
        const videoEmbed = renderVideoEmbed(String(valor), campo.label);
        if (videoEmbed) return videoEmbed;
        return (
          <a
            href={String(valor).startsWith("http") ? String(valor) : `${ASSETS_BASE}${String(valor)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="modulo-link"
          >
            Assistir vídeo (link externo)
          </a>
        );
      }
      case "upload":
        const url =
          String(valor).startsWith("http")
            ? String(valor)
            : getUploadUrl(String(valor));
        const ext = String(valor).split(".").pop()?.toLowerCase();
        const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
        return (
          <div className="modulo-upload">
            {isImg ? (
              <img src={url} alt={campo.label ?? ""} />
            ) : (
              <a href={url} target="_blank" rel="noopener noreferrer" download>
                Baixar arquivo
              </a>
            )}
          </div>
        );
      default:
        return <p className="modulo-texto">{String(valor)}</p>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz?.questoes?.length || !idModulo) return;

    const faltando = quiz.questoes.filter((q) => {
      const r = respostas[q.id_questao];
      return !r || (typeof r === "string" && !r.trim());
    });
    if (faltando.length > 0) {
      setToast("Por favor, responda todas as questões.");
      return;
    }

    setEnviando(true);
    try {
      const payload = quiz.questoes.map((q) => ({
        id_questao: q.id_questao,
        resposta: String(respostas[q.id_questao] || "").trim(),
      }));
      const res = await quizService.responder(quiz.id_quiz, idModulo, payload);
      const totalPontos =
        res.pontuacao_maxima ?? (quiz.questoes || []).reduce((s, q) => s + (q.pontos || 0), 0);
      setResultado({
        pontos: res.pontos_obtidos,
        total: totalPontos || res.total_questoes,
        eh_repeticao: res.eh_repeticao,
      });
    } catch (err) {
      setToast("Erro ao enviar respostas. Tente novamente.");
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="modulo-user page-with-fixed-header">
        <Header />
        <main className="pfu-main">
          <p>Carregando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!modulo) return null;

  if (erroAcesso) {
    return (
      <div className="modulo-user page-with-fixed-header">
        <Header />
        <main className="pfu-main">
          <div className="modulo-erro-acesso">
            <h2>Módulo bloqueado</h2>
            <p>{erroAcesso}</p>
            <button
              type="button"
              className="pfu-save"
              onClick={() => navigate("/usuario/modulos")}
            >
              Voltar aos módulos
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="modulo-user page-with-fixed-header">
      <Header />

      <main className="pfu-main">
        <h1 className="pfu-title">{modulo.titulo}</h1>

        <section className="pfu-card modulo-card" aria-label="Conteúdo do módulo">
          {modulo.descricao && (
            <p className="modulo-desc">{modulo.descricao}</p>
          )}

          {(modulo.campos || []).map((campo, idx) => (
            <div key={idx} className="modulo-campo">
              {campo.label && <h3 className="modulo-campo-label">{campo.label}</h3>}
              {renderConteudo(campo)}
            </div>
          ))}

          {quiz?.questoes?.length ? (
            resultado ? (
              <div className="modulo-resultado modulo-resultado-sucesso">
                <h2>Quiz concluído!</h2>
                <p className="modulo-resultado-pontos">
                  Você obteve <strong>{resultado.pontos}</strong> de {resultado.total} pontos
                  {resultado.eh_repeticao && (
                    <span className="modulo-resultado-repeticao">
                      (participação - quiz já realizado antes)
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  className="pfu-save"
                  onClick={() => navigate("/usuario/modulos")}
                >
                  Voltar aos módulos
                </button>
              </div>
            ) : (
              <form className="modulo-quiz" onSubmit={handleSubmit} aria-labelledby="quizTitle">
                <h2 id="quizTitle" className="modulo-quiz-title">
                  {quiz.titulo || "Quiz"}
                </h2>

                {quiz.questoes.map((q, idx) => {
                  const opcoes = parseOpcoes(q.opcoes);
                  const valor = respostas[q.id_questao] || "";

                  return (
                    <div key={q.id_questao} className="modulo-questao">
                      <p className="modulo-questao-enunciado">
                        {idx + 1}. {q.enunciado}
                      </p>

                      {q.tipo_questao === "discursiva" ? (
                        <textarea
                          className="pfu-textarea"
                          value={valor}
                          onChange={(e) =>
                            setRespostas((prev) => ({
                              ...prev,
                              [q.id_questao]: e.target.value,
                            }))
                          }
                          placeholder="Digite sua resposta"
                          required
                        />
                      ) : (
                        <fieldset className="modulo-opcoes">
                          {opcoes.map((opt) => {
                            const optId = typeof opt === "object" ? opt.id : opt;
                            const optText = typeof opt === "object" ? opt.texto : opt;
                            return (
                              <label key={optId} className="modulo-opcao">
                                <input
                                  type="radio"
                                  name={`q-${q.id_questao}`}
                                  value={optId}
                                  checked={valor === optId}
                                  onChange={(e) =>
                                    setRespostas((prev) => ({
                                      ...prev,
                                      [q.id_questao]: e.target.value,
                                    }))
                                  }
                                />
                                <span>{optText}</span>
                              </label>
                            );
                          })}
                        </fieldset>
                      )}
                    </div>
                  );
                })}

                <div className="pfu-actions">
                  <button type="submit" className="pfu-save" disabled={enviando}>
                    {enviando ? "Enviando..." : "Enviar respostas"}
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="pfu-actions">
              <button
                type="button"
                className="pfu-save pfu-concluir"
                onClick={handleConcluirSemQuiz}
                disabled={concluindo}
              >
                {concluindo ? "Concluindo..." : "Concluir módulo"}
              </button>
              <button
                type="button"
                className="pfu-cancel"
                onClick={() => navigate("/usuario/modulos")}
              >
                Voltar aos módulos
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toast.includes("Erro") ? "error" : "info"}
        />
      )}
    </div>
  );
};

export default PreencherModulosEscolaDiscipulosUser;
