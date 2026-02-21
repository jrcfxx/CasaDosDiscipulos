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

const QUESTOES_TIPOS = ["multipla_escolha", "verdadeiro_falso", "discursiva", "checkbox", "select"];

function isCampoQuestao(tipo: string | undefined): boolean {
  return !!(tipo && QUESTOES_TIPOS.includes(String(tipo).toLowerCase()));
}

const PreencherModulosEscolaDiscipulosUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const idModulo = id ? parseInt(id, 10) : null;
  const quizFormRef = React.useRef<HTMLFormElement>(null);
  const loadDataInProgressRef = React.useRef(false);

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
    atingiu_50?: boolean;
    eh_retentativa?: boolean;
    bonus_primeira_tentativa?: number;
    questoes_erradas?: Array<{
      id_questao: number;
      enunciado: string;
      ordem: number;
      resposta_usuario: string;
      resposta_correta: string;
      pontos_perdidos: number;
    }>;
  } | null>(null);
  const [tentativaNum, setTentativaNum] = useState(1);
  const [moduloJaConcluido, setModuloJaConcluido] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!idModulo || isNaN(idModulo)) {
      navigate("/usuario/modulos");
      return;
    }
    loadData();
  }, [idModulo, navigate]);

  const loadData = async () => {
    if (loadDataInProgressRef.current) return;
    loadDataInProgressRef.current = true;
    setLoading(true);
    setErroAcesso(null);
    try {
      const [moduloData, quizData] = await Promise.all([
        moduloService.getById(idModulo!),
        moduloService.getQuizVinculado(idModulo!),
      ]);
      setModulo(moduloData);

      if ((moduloData as any).ativo === false || (moduloData as any).ativo === 0) {
        setErroAcesso("Este módulo está inativo e não pode ser realizado.");
        return;
      }

      if (quizData?.id_quiz) {
        try {
          const [progresso, quizCompleto] = await Promise.all([
            moduloService.getProgresso(idModulo!),
            quizService.getById(quizData.id_quiz),
          ]);
          const pontuacaoMaxima = (quizCompleto.questoes || []).reduce(
            (s, q) => s + (q.pontos || 0),
            0
          );
          if (
            progresso?.status === "concluido" &&
            progresso.nota_quiz != null &&
            pontuacaoMaxima > 0 &&
            progresso.nota_quiz >= pontuacaoMaxima * 0.5
          ) {
            setModuloJaConcluido(true);
            setQuiz(quizCompleto);
            setLoading(false);
            return;
          }
          setQuiz(quizCompleto);
          const init: Record<number, string> = {};
          (quizCompleto.questoes || []).forEach((q: QuizQuestao) => {
            init[q.id_questao] = "";
          });
          setRespostas(init);

          if (!progresso) {
            try {
              await moduloService.iniciar(idModulo!);
            } catch (e: unknown) {
              const err = e as { response?: { status?: number; data?: { error?: string } }; message?: string };
              if (err?.response?.status !== 409) {
                const msg = err?.response?.data?.error || err?.message || "Complete os módulos anteriores na sequência.";
                setErroAcesso(msg);
                return;
              }
            }
          }
        } catch (quizErr: unknown) {
          const err = quizErr as { response?: { data?: { error?: string } }; message?: string };
          setToast(err?.response?.data?.error || err?.message || "Erro ao carregar o quiz.");
          setLoading(false);
          return;
        }
      } else {
        const progresso = await moduloService.getProgresso(idModulo!);
        if (!progresso) {
          try {
            await moduloService.iniciar(idModulo!);
          } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { error?: string } }; message?: string };
            if (err?.response?.status !== 409) {
              const msg = err?.response?.data?.error || err?.message || "Complete os módulos anteriores na sequência.";
              setErroAcesso(msg);
              return;
            }
          }
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
      console.error("Erro ao carregar:", err);
      const msg = error?.response?.data?.error || error?.message || "Erro ao carregar o módulo.";
      setToast(msg);
      setTimeout(() => navigate("/usuario/modulos"), 1500);
      return;
    } finally {
      setLoading(false);
      loadDataInProgressRef.current = false;
    }
  };

  const handleConcluirSemQuiz = async () => {
    if (!idModulo) return;
    setConcluindo(true);
    try {
      await moduloService.concluir(idModulo);
      navigate("/usuario/modulos");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      const msg = err?.response?.data?.error || err?.message || "Erro ao concluir módulo.";
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
      if (ytId) return `https://www.youtube.com/embed/${ytId}?cc_load_policy=1`;
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
          <video controls playsInline aria-label={label ?? "Vídeo do módulo"}>
            <source src={embedUrl} type={getVideoMimeType(embedUrl)} />
            Seu navegador não suporta o vídeo. Recomenda-se usar legendas quando disponíveis.
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

  const renderConteudo = (campo: Campo | { tipo_campo?: string; label?: string; conteudo?: unknown }) => {
    const tipo = String(campo.tipo_campo || "texto").toLowerCase();
    const valor = campo.conteudo ?? "";

    if (valor === null || valor === undefined) return null;
    const valorStr = String(valor).trim();
    if (valorStr === "") return null;

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

  const renderQuizItem = (
    item: { type: "conteudo"; campo: { id?: number; tipo_campo?: string; label?: string; conteudo?: unknown } } | { type: "questao"; questao: QuizQuestao; questaoIdx: number },
    respostas: Record<number, string>,
    setRespostas: React.Dispatch<React.SetStateAction<Record<number, string>>>
  ) => {
    if (item.type === "conteudo") {
      const conteudo = renderConteudo(item.campo);
      if (!conteudo && !item.campo.label) return null;
      return (
        <div key={`c-${item.campo.id ?? Math.random()}`} className="modulo-campo modulo-quiz-campo">
          {item.campo.label && <h3 className="modulo-campo-label">{item.campo.label}</h3>}
          {conteudo}
        </div>
      );
    }
    const q = item.questao;
    const opcoes = parseOpcoes(q.opcoes);
    const valor = respostas[q.id_questao] || "";
    return (
      <div key={q.id_questao} className="modulo-questao">
        <p className="modulo-questao-enunciado">
          {item.questaoIdx + 1}. {q.enunciado}
        </p>
        {q.tipo_questao === "discursiva" ? (
          <textarea
            className="pfu-textarea"
            value={valor}
            onChange={(e) => setRespostas((prev) => ({ ...prev, [q.id_questao]: e.target.value }))}
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
                    onChange={(e) => setRespostas((prev) => ({ ...prev, [q.id_questao]: e.target.value }))}
                  />
                  <span>{optText}</span>
                </label>
              );
            })}
          </fieldset>
        )}
      </div>
    );
  };

  const quizMergedItems = React.useMemo(() => {
    if (!quiz?.questoes?.length) return [];
    const campos = quiz.campos ?? [];
    const questoes = [...quiz.questoes].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    let questaoIdx = 0;
    type Item =
      | { type: "conteudo"; campo: { id?: number; tipo_campo?: string; label?: string; conteudo?: unknown } }
      | { type: "questao"; questao: QuizQuestao; questaoIdx: number };
    const items: Item[] = [];
    for (const campo of campos) {
      const tipo = String(campo.tipo_campo || "").toLowerCase();
      if (isCampoQuestao(tipo)) {
        if (questaoIdx < questoes.length) {
          items.push({ type: "questao", questao: questoes[questaoIdx], questaoIdx });
          questaoIdx++;
        }
      } else {
        items.push({ type: "conteudo", campo });
      }
    }
    while (questaoIdx < questoes.length) {
      items.push({ type: "questao", questao: questoes[questaoIdx], questaoIdx });
      questaoIdx++;
    }
    return items;
  }, [quiz?.campos, quiz?.questoes]);

  const handleTentarNovamente = () => {
    setResultado(null);
    if (quiz?.questoes?.length) {
      const init: Record<number, string> = {};
      quiz.questoes.forEach((q: QuizQuestao) => {
        init[q.id_questao] = "";
      });
      setRespostas(init);
    }
    setTimeout(() => {
      quizFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
        total: totalPontos > 0 ? totalPontos : 1,
        atingiu_50: res.atingiu_50 ?? false,
        eh_retentativa: res.eh_retentativa,
        questoes_erradas: res.questoes_erradas ?? [],
        bonus_primeira_tentativa: res.bonus_primeira_tentativa ?? 0,
      });
      if (!(res.atingiu_50 ?? false)) {
        setTentativaNum((n) => n + 1);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = error?.response?.data?.error || error?.message || "Erro ao enviar respostas. Tente novamente.";
      setToast(msg);
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="modulo-user page-with-fixed-header">
        <Header />
        <main id="main-content" className="pfu-main" tabIndex={-1}>
          <p>Carregando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!modulo) return null;

  if (moduloJaConcluido) {
    return (
      <div className="modulo-user page-with-fixed-header">
        <Header />
        <main id="main-content" className="pfu-main" tabIndex={-1}>
          <div className="modulo-resultado modulo-resultado-sucesso">
            <h2>Módulo já concluído</h2>
            <p>Você já concluiu este módulo com sucesso. Não é permitido refazer o quiz.</p>
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

  if (erroAcesso) {
    return (
      <div className="modulo-user page-with-fixed-header">
        <Header />
        <main id="main-content" className="pfu-main" tabIndex={-1}>
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

      <main id="main-content" className="pfu-main" tabIndex={-1}>
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
            resultado?.atingiu_50 ? (
              <div className="quiz-resultado quiz-resultado-sucesso">
                <div className="quiz-resultado-icon">🏆</div>
                <h2>Parabéns! Módulo concluído!</h2>
                <p className="quiz-resultado-subtitulo">
                  Você acertou e está pronto para o próximo desafio.
                </p>
                <div className="quiz-resultado-pontos-card">
                  <span className="quiz-pontos-valor">{resultado.pontos}</span>
                  <span className="quiz-pontos-separador">/</span>
                  <span className="quiz-pontos-total">{resultado.total}</span>
                  <span className="quiz-pontos-label"> pontos</span>
                </div>
                <p className="quiz-resultado-extra">
                  {resultado.eh_retentativa
                    ? "Você conseguiu na nova tentativa!"
                    : "Aprovado na primeira tentativa!"}
                  {resultado.bonus_primeira_tentativa && resultado.bonus_primeira_tentativa > 0 && (
                    <span className="quiz-bonus-badge"> +{resultado.bonus_primeira_tentativa} pts bônus!</span>
                  )}
                </p>
                <button
                  type="button"
                  className="pfu-save pfu-btn-sucesso"
                  onClick={() => navigate("/usuario/modulos")}
                >
                  Voltar aos módulos
                </button>
              </div>
            ) : resultado && !resultado.atingiu_50 ? (
              <div className="quiz-resultado quiz-resultado-falha">
                <div className="quiz-resultado-icon quiz-icon-falha">🎯</div>
                <h2>Tente novamente!</h2>
                <p className="quiz-resultado-subtitulo">
                  Você precisa de pelo menos 50% para passar. Revise as questões erradas abaixo.
                </p>
                <div className="quiz-resultado-pontos-card quiz-pontos-falha">
                  <span className="quiz-pontos-valor">{resultado.pontos}</span>
                  <span className="quiz-pontos-separador">/</span>
                  <span className="quiz-pontos-total">{resultado.total}</span>
                  <span className="quiz-pontos-label"> pontos</span>
                </div>
                <p className="quiz-resultado-tentativa">
                  Tentativa {tentativaNum} • Faltam {Math.max(0, Math.ceil(resultado.total * 0.5) - resultado.pontos)} pontos para passar
                </p>

                {resultado.questoes_erradas && resultado.questoes_erradas.length > 0 && (
                  <div className="quiz-questoes-erradas">
                    <h3>📋 Questões que você errou</h3>
                    {resultado.questoes_erradas.map((q, idx) => (
                      <div key={q.id_questao} className="quiz-questao-errada">
                        <p className="quiz-errada-enunciado">{idx + 1}. {q.enunciado}</p>
                        <div className="quiz-errada-respostas">
                          <div className="quiz-errada-item quiz-errada-usuario">
                            <span className="quiz-errada-label">Sua resposta:</span>
                            <span>{q.resposta_usuario || "(vazio)"}</span>
                          </div>
                        </div>
                        <span className="quiz-errada-pontos">−{q.pontos_perdidos} pts</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="quiz-falha-actions">
                  <button
                    type="button"
                    className="pfu-save pfu-btn-retry"
                    onClick={handleTentarNovamente}
                  >
                    Refazer quiz
                  </button>
                  <p className="quiz-falha-hint">O quiz será exibido novamente com as respostas em branco para uma nova tentativa.</p>
                </div>
              </div>
            ) : (
              <form
                ref={quizFormRef}
                className="modulo-quiz modulo-quiz-desafio"
                onSubmit={handleSubmit}
                aria-labelledby="quizTitle"
              >
                <div className="quiz-desafio-header">
                  <span className="quiz-desafio-badge">DESAFIO</span>
                  <h2 id="quizTitle" className="modulo-quiz-title">
                    {quiz.titulo || "Quiz"}
                  </h2>
                  {quiz.descricao && <p className="quiz-desafio-desc">{quiz.descricao}</p>}
                </div>

                {quizMergedItems.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {renderQuizItem(item, respostas, setRespostas)}
                  </React.Fragment>
                ))}

                <div className="pfu-actions">
                  <button type="submit" className="pfu-save pfu-btn-enviar" disabled={enviando}>
                    {enviando ? "Verificando..." : "Enviar e ver resultado"}
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
