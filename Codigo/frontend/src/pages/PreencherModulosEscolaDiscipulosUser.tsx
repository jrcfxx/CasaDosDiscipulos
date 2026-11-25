import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../style/editorCasa.css";
import "../style/secretariaUsuario.css";

import PaginaSecretaria from "../components/secretaria/PaginaSecretaria";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import moduloService from "../services/moduloService";
import quizService, { type Quiz, type QuizQuestao } from "../services/quizService";
import { getUploadUrl } from "../services/uploadService";
import { ASSETS_BASE } from "../config/api";
import type { Modulo, Campo } from "../types";
import Icone from "../components/ui/Icone";

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

      // O banco pode devolver 0/1 em vez de true/false
      if (moduloData.ativo === false || Number(moduloData.ativo) === 0) {
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
        if (progresso?.status === "concluido") {
          setModuloJaConcluido(true);
          return;
        }
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
            <track kind="captions" srcLang="pt-BR" label="Legendas" />
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
      case "upload": {
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
      }
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
        <div key={`c-${item.campo.id ?? Math.random()}`} className="su-aula su-aula--no-quiz">
          {item.campo.label && <h3 className="su-aula__titulo">{item.campo.label}</h3>}
          <div className="su-aula__conteudo">{conteudo}</div>
        </div>
      );
    }
    const q = item.questao;
    const opcoes = parseOpcoes(q.opcoes);
    const valor = respostas[q.id_questao] || "";
    return (
      <div key={q.id_questao} className="su-pergunta su-questao">
        <span className="su-pergunta__numero" aria-hidden>
          {item.questaoIdx + 1}
        </span>
        <div className="su-pergunta__corpo">
        {q.tipo_questao === "discursiva" ? (
          <>
          <label className="su-pergunta__rotulo" htmlFor={`q-${q.id_questao}`}>
            <span className="sr-only">Pergunta {item.questaoIdx + 1}: </span>
            {q.enunciado}
          </label>
          <textarea
            id={`q-${q.id_questao}`}
            className="su-textarea"
            rows={4}
            value={valor}
            onChange={(e) => setRespostas((prev) => ({ ...prev, [q.id_questao]: e.target.value }))}
            placeholder="Escreva sua resposta"
            required
          />
          </>
        ) : q.tipo_questao === "checkbox" ? (
          <fieldset className="su-opcoes">
            <legend className="su-pergunta__rotulo">
              <span className="sr-only">Pergunta {item.questaoIdx + 1}: </span>
              {q.enunciado} <span className="su-dica-tipo">(marque todas as certas)</span>
            </legend>
            {opcoes.map((opt) => {
              const optId = String(typeof opt === "object" ? opt.id : opt);
              const optText = typeof opt === "object" ? opt.texto : opt;
              const selecionados = new Set(
                String(valor || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              );
              return (
                <label key={optId} className="su-opcao">
                  <input
                    type="checkbox"
                    name={`q-${q.id_questao}`}
                    value={optId}
                    checked={selecionados.has(optId)}
                    onChange={(e) => {
                      const next = new Set(selecionados);
                      if (e.target.checked) next.add(optId);
                      else next.delete(optId);
                      const joined = Array.from(next).sort().join(",");
                      setRespostas((prev) => ({ ...prev, [q.id_questao]: joined }));
                    }}
                  />
                  <span>{optText}</span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <fieldset className="su-opcoes">
            <legend className="su-pergunta__rotulo">
              <span className="sr-only">Pergunta {item.questaoIdx + 1}: </span>
              {q.enunciado}
            </legend>
            {opcoes.map((opt) => {
              const optId = typeof opt === "object" ? opt.id : opt;
              const optText = typeof opt === "object" ? opt.texto : opt;
              return (
                <label key={optId} className="su-opcao">
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
      setToast(`Erro: ${faltando.length === 1 ? "falta 1 pergunta" : `faltam ${faltando.length} perguntas`} sem resposta.`);
      const primeira = document.querySelector<HTMLElement>(
        `[name="q-${faltando[0].id_questao}"], #q-${faltando[0].id_questao}`
      );
      primeira?.scrollIntoView({ behavior: "smooth", block: "center" });
      primeira?.focus({ preventScroll: true });
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

  const voltar = () => navigate("/usuario/modulos");
  const NOME_TIPO: Record<string, string> = {
    video: "Vídeo",
    textarea: "Texto",
    texto: "Texto curto",
    upload: "Arquivo",
    link: "Link",
    data: "Data",
    numero: "Número",
  };
  const totalQuestoes = quiz?.questoes?.length ?? 0;
  const respondidas = quiz?.questoes?.filter((q) => String(respostas[q.id_questao] || "").trim()).length ?? 0;

  const BotaoVoltar = () => (
    <button type="button" className="su-voltar" onClick={voltar}>
      <Icone nome="anterior" tamanho={15} /> Voltar para a trilha
    </button>
  );

  /** Tela simples (carregando, bloqueado): moldura escura com um cartão no meio */
  if (loading || !modulo || erroAcesso) {
    return (
      <div className="sc-pagina page-with-fixed-header">
        <Header />
        <main id="main-content" tabIndex={-1} className="sc-corpo-fundo">
          <div className="su-fazer">
            {loading ? (
              <p className="su-cartao su-estado" role="status">
                Carregando o módulo…
              </p>
            ) : erroAcesso ? (
              <section className="su-cartao su-estado su-estado--bloqueado">
                <span className="su-estado__icone" aria-hidden>
                  <Icone nome="cadeado" tamanho={30} />
                </span>
                <h1>Módulo bloqueado</h1>
                <p>{erroAcesso}</p>
                <div className="su-estado__acoes">
                  <button type="button" className="sc-btn sc-btn--primario" onClick={voltar}>
                    Voltar para a trilha
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </main>
        <Footer />
        {toast && <Toast message={toast} onClose={() => setToast(null)} variant={toast.includes("Erro") ? "error" : "info"} />}
      </div>
    );
  }

  const aulas = (modulo.campos || []).filter((c) => !isCampoQuestao(c.tipo_campo));
  const concluiuAgora = Boolean(resultado?.atingiu_50);

  return (
    <PaginaSecretaria
      area="Escola de Discípulos"
      titulo={modulo.titulo}
      icone="formatura"
      descricao={
        modulo.descricao ||
        (quiz?.questoes?.length ? "Veja as aulas e responda ao quiz no fim para concluir." : "Veja as aulas e conclua o módulo no fim da página.")
      }
      abas={[]}
      numeros={[
        { valor: aulas.length, rotulo: aulas.length === 1 ? "aula" : "aulas" },
        ...(totalQuestoes ? [{ valor: totalQuestoes, rotulo: totalQuestoes === 1 ? "pergunta no quiz" : "perguntas no quiz" }] : []),
      ]}
    >
      <div className="su-fazer">
        <BotaoVoltar />

        {moduloJaConcluido && (
          <p className="su-aviso su-aviso--ok" role="status">
            <Icone nome="concluido" tamanho={16} />
            Você já concluiu este módulo. As aulas ficam aqui para você rever quando quiser.
          </p>
        )}

        <section className="su-cartao" aria-labelledby="su-aulas-titulo">
          <h2 className="su-cartao__titulo" id="su-aulas-titulo">
            <Icone nome="livro" tamanho={19} /> Aulas
          </h2>
          {aulas.length ? (
            <ol className="su-aulas">
              {aulas.map((campo, idx) => (
                <li key={idx} className="su-aula">
                  <div className="su-aula__topo">
                    <span className="ec-selo ec-selo--pergunta">
                      {idx + 1}. {NOME_TIPO[String(campo.tipo_campo)] || "Conteúdo"}
                    </span>
                    {campo.label && <h3>{campo.label}</h3>}
                  </div>
                  <div className="su-aula__conteudo">{renderConteudo(campo) ?? <span className="su-sem-conteudo">Sem conteúdo.</span>}</div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="sc-vazio-conteudo">Este módulo não tem aulas cadastradas.</p>
          )}
        </section>

        {moduloJaConcluido ? (
          <div className="su-estado__acoes">
            <button type="button" className="sc-btn sc-btn--primario" onClick={voltar}>
              Voltar para a trilha
            </button>
          </div>
        ) : quiz?.questoes?.length ? (
          resultado ? (
            <section
              className={`su-cartao su-estado${concluiuAgora ? "" : " su-estado--tentar"}`}
              aria-labelledby="su-resultado-titulo"
              aria-live="polite"
            >
              <span className="su-estado__icone" aria-hidden>
                <Icone nome={concluiuAgora ? "trofeu" : "alvo"} tamanho={32} />
              </span>
              <h2 id="su-resultado-titulo">{concluiuAgora ? "Parabéns! Módulo concluído" : "Quase lá! Tente de novo"}</h2>
              <p className="su-placar">
                <strong>{resultado.pontos}</strong> de {resultado.total} pontos
              </p>
              <p>
                {concluiuAgora
                  ? resultado.eh_retentativa
                    ? "Você conseguiu na nova tentativa. O próximo módulo já está liberado."
                    : "Aprovado de primeira! O próximo módulo já está liberado."
                  : `Você precisa de pelo menos 50% para concluir. Faltaram ${Math.max(
                      0,
                      Math.ceil(resultado.total * 0.5) - resultado.pontos
                    )} pontos (tentativa ${tentativaNum - 1}).`}
                {concluiuAgora && (resultado.bonus_primeira_tentativa ?? 0) > 0 && (
                  <span className="su-bonus"> +{resultado.bonus_primeira_tentativa} pts de bônus</span>
                )}
              </p>

              {!concluiuAgora && resultado.questoes_erradas && resultado.questoes_erradas.length > 0 && (
                <div className="su-erradas">
                  <h3>
                    <Icone nome="lista" tamanho={17} /> Para revisar
                  </h3>
                  <ul>
                    {resultado.questoes_erradas.map((q) => (
                      <li key={q.id_questao}>
                        <strong>{q.enunciado}</strong>
                        <span>Sua resposta: {q.resposta_usuario || "(em branco)"}</span>
                        <small>−{q.pontos_perdidos} pts</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="su-estado__acoes">
                {concluiuAgora ? (
                  <button type="button" className="sc-btn sc-btn--primario" onClick={voltar}>
                    Voltar para a trilha
                  </button>
                ) : (
                  <>
                    <button type="button" className="sc-btn sc-btn--primario" onClick={handleTentarNovamente}>
                      Refazer o quiz
                    </button>
                    <button type="button" className="sc-btn sc-btn--contorno" onClick={voltar}>
                      Voltar depois
                    </button>
                  </>
                )}
              </div>
            </section>
          ) : (
            <form ref={quizFormRef} className="su-cartao su-quiz" onSubmit={handleSubmit} aria-labelledby="quizTitle" noValidate>
              <p className="su-quiz__selo">
                <Icone nome="alvo" tamanho={14} /> Quiz do módulo
              </p>
              <h2 id="quizTitle" className="su-cartao__titulo">
                {quiz.titulo || "Quiz"}
              </h2>
              <p className="su-quiz__explica">
                {quiz.descricao ? `${quiz.descricao} ` : ""}Responda todas as perguntas. Com pelo menos 50% dos pontos o módulo é concluído; se não
                der, você pode tentar de novo.
              </p>

              <div className="su-perguntas">
                {quizMergedItems.map((item, idx) => (
                  <React.Fragment key={idx}>{renderQuizItem(item, respostas, setRespostas)}</React.Fragment>
                ))}
              </div>

              <div className="su-enviar">
                <p className="su-enviar__info">
                  {respondidas} de {totalQuestoes} respondidas
                </p>
                <button type="submit" className="sc-btn sc-btn--primario" disabled={enviando} aria-busy={enviando}>
                  {enviando ? (
                    <>
                      <span className="btn-spinner" aria-hidden /> Verificando…
                    </>
                  ) : (
                    "Enviar e ver resultado"
                  )}
                </button>
              </div>
            </form>
          )
        ) : (
          <section className="su-cartao su-concluir" aria-label="Concluir módulo">
            <p>Terminou as aulas? Clique em concluir para registrar e liberar o próximo módulo da trilha.</p>
            <button type="button" className="sc-btn sc-btn--primario" onClick={handleConcluirSemQuiz} disabled={concluindo} aria-busy={concluindo}>
              {concluindo ? (
                <>
                  <span className="btn-spinner" aria-hidden /> Concluindo…
                </>
              ) : (
                <>
                  <Icone nome="concluido" tamanho={16} /> Concluir módulo
                </>
              )}
            </button>
          </section>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} variant={toast.includes("Erro") ? "error" : "info"} />}
    </PaginaSecretaria>
  );
};

export default PreencherModulosEscolaDiscipulosUser;
