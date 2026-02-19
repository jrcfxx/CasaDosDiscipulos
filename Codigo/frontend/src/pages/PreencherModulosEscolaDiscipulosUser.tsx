import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../style/PreencherModulosEscolaDiscipulosUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import moduloService from "../services/moduloService";
import quizService from "../services/quizService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

type Campo = {
  id?: number;
  id_campo: number;
  tipo_campo: string;
  label: string;
  conteudo: string | number | null;
};

type Questao = {
  id_questao: number;
  tipo_questao: string;
  enunciado: string;
  pontos?: number;
  ordem?: number;
  opcoes?: string | Array<{ id: string; texto: string }>;
  resposta_correta?: string | null;
};

const PreencherModulosEscolaDiscipulosUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const idModulo = id ? parseInt(id, 10) : null;

  const [modulo, setModulo] = useState<{
    id_modulo: number;
    titulo: string;
    descricao?: string;
    campos?: Campo[];
  } | null>(null);
  const [quiz, setQuiz] = useState<{
    id_quiz: number;
    titulo?: string;
    questoes?: Questao[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{
    pontos: number;
    total: number;
    eh_repeticao?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!idModulo || isNaN(idModulo)) {
      navigate("/usuario/modulos");
      return;
    }
    loadData();
  }, [idModulo, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [moduloData, quizData] = await Promise.all([
        moduloService.getById(idModulo!),
        moduloService.getQuizVinculado(idModulo!),
      ]);
      setModulo(moduloData);

      if (quizData?.id_quiz) {
        moduloService.iniciar(idModulo!).catch(() => {});
        const quizCompleto = await quizService.getById(quizData.id_quiz);
        setQuiz(quizCompleto);
        const init: Record<number, string> = {};
        (quizCompleto.questoes || []).forEach((q) => {
          init[q.id_questao] = "";
        });
        setRespostas(init);
      } else {
        moduloService.iniciar(idModulo!).catch(() => {});
      }
    } catch (err) {
      console.error("Erro ao carregar:", err);
      navigate("/usuario/modulos");
    } finally {
      setLoading(false);
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

  const renderConteudo = (campo: Campo) => {
    const tipo = (campo.tipo_campo || "texto").toLowerCase();
    const valor = campo.conteudo ?? "";

    if (!valor) return null;

    switch (tipo) {
      case "link":
        return (
          <a href={String(valor)} target="_blank" rel="noopener noreferrer" className="modulo-link">
            {String(valor)}
          </a>
        );
      case "video":
        return (
          <div className="modulo-video">
            <video controls src={String(valor).startsWith("http") ? valor : `${API_URL}${valor}`}>
              Seu navegador não suporta o vídeo.
            </video>
          </div>
        );
      case "upload":
        const url = String(valor).startsWith("http") ? valor : `${API_URL}${valor}`;
        const ext = String(valor).split(".").pop()?.toLowerCase();
        const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
        return (
          <div className="modulo-upload">
            {isImg ? (
              <img src={url} alt={campo.label} />
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
      alert("Por favor, responda todas as questões.");
      return;
    }

    setEnviando(true);
    try {
      const payload = quiz.questoes.map((q) => ({
        id_questao: q.id_questao,
        resposta: String(respostas[q.id_questao] || "").trim(),
      }));
      const res = await quizService.responder(quiz.id_quiz, idModulo, payload);
      setResultado({
        pontos: res.pontos_obtidos,
        total: res.total_questoes,
        eh_repeticao: res.eh_repeticao,
      });
    } catch (err) {
      alert("Erro ao enviar respostas. Tente novamente.");
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
              <div className="modulo-resultado">
                <h2>Resultado</h2>
                <p>
                  Você obteve <strong>{resultado.pontos}</strong> pontos
                  {resultado.eh_repeticao && " (participação - quiz já realizado antes)"}.
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
                className="pfu-save"
                onClick={() => navigate("/usuario/modulos")}
              >
                Voltar aos módulos
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PreencherModulosEscolaDiscipulosUser;
