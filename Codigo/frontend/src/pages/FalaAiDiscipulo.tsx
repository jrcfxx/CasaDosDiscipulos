import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import falaAiService, {
  type FalaAiPost,
  type FalaAiComentario,
} from "../services/falaAiService";
import { ASSETS_BASE } from "../config/api";
import { useAuth } from "../hooks/useAuth";
import "../style/FalaAiDiscipulo.css";

const getAvatarUrl = (foto: string | null) =>
  foto?.startsWith("http") ? foto : foto ? `${ASSETS_BASE}${foto}` : null;

const formatarData = (s: string) => {
  const d = new Date(s);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: d.getFullYear() !== hoje.getFullYear() ? "numeric" : undefined,
  });
};

const TIPO = { DEVOCIONAL: "devocional", PALAVRA: "palavra_do_dia" } as const;

const FalaAiDiscipulo: React.FC = () => {
  const { isAdmin, isLider } = useAuth();
  const podePublicar = isAdmin || isLider;
  const [posts, setPosts] = useState<FalaAiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentarioEmAberto, setComentarioEmAberto] = useState<number | null>(null);
  const [textoComentario, setTextoComentario] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const list = await falaAiService.listarPosts();
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleComentar = async (idPost: number) => {
    const texto = textoComentario[idPost]?.trim();
    if (!texto) return;
    setEnviando(true);
    try {
      const novo = await falaAiService.adicionarComentario(idPost, texto);
      setPosts((prev) =>
        prev.map((p) =>
          p.id_post === idPost
            ? {
                ...p,
                comentarios: [...(p.comentarios || []), novo],
                total_comentarios: (p.total_comentarios || 0) + 1,
              }
            : p
        )
      );
      setTextoComentario((t) => ({ ...t, [idPost]: "" }));
      setComentarioEmAberto(null);
    } catch {
      setToast("Erro ao enviar comentário. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fala-ai-page page-with-fixed-header">
      <Header />
      <main id="main-content" className="fala-ai-main" tabIndex={-1}>
        <div className="fala-ai-header">
          <h1 className="fala-ai-title">Fala Aí, Discípulo</h1>
          {podePublicar && (
            <Link to="/usuario/fala-ai/admin" className="fala-ai-btn-novo">
              + Novo post
            </Link>
          )}
        </div>

        {loading ? (
          <p className="fala-ai-loading">Carregando...</p>
        ) : posts.length === 0 ? (
          <div className="fala-ai-empty">
            <p>Nenhuma publicação ainda.</p>
            {podePublicar && (
              <Link to="/usuario/fala-ai/admin" className="fala-ai-btn-novo">
                Criar o primeiro
              </Link>
            )}
          </div>
        ) : (
          <div className="fala-ai-sections">
            {(() => {
              const palavraPosts = posts.filter((p) => p.tipo === TIPO.PALAVRA);
              const devocionalPosts = posts.filter((p) => p.tipo === TIPO.DEVOCIONAL);

              const renderCard = (post: FalaAiPost) => (
                <article key={post.id_post} className="fala-ai-card">
                  <div className="fala-ai-card__head">
                    <img
                      src={getAvatarUrl(post.autor_foto) || "/favicon.ico"}
                      alt={`Foto de ${post.autor_nome}`}
                      className="fala-ai-card__avatar"
                    />
                    <div className="fala-ai-card__meta">
                      <span className="fala-ai-card__autor">{post.autor_nome}</span>
                      <span className="fala-ai-card__data">
                        {formatarData(post.data_publicacao)}
                      </span>
                    </div>
                  </div>

                  {post.imagem_url && (
                    <div className="fala-ai-card__imagem">
                      <img
                        src={post.imagem_url.startsWith("http") ? post.imagem_url : `${ASSETS_BASE}${post.imagem_url}`}
                        alt={post.titulo ? `Imagem: ${post.titulo}` : "Imagem do post"}
                      />
                    </div>
                  )}

                  <div className="fala-ai-card__body">
                    {post.titulo && (
                      <h3 className="fala-ai-card__titulo">{post.titulo}</h3>
                    )}
                    {post.referencia && (
                      <p className="fala-ai-card__ref">{post.referencia}</p>
                    )}
                    <div className="fala-ai-card__conteudo">
                      {post.conteudo.split("\n").map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>

                  <div className="fala-ai-card__comentarios">
                    {post.comentarios && post.comentarios.length > 0 && (
                      <ul className="fala-ai-comentarios">
                        {post.comentarios.map((c: FalaAiComentario) => (
                          <li key={c.id_comentario} className="fala-ai-comentario">
                            <img
                              src={getAvatarUrl(c.autor_foto) || "/favicon.ico"}
                              alt={`Foto de ${c.autor_nome}`}
                              className="fala-ai-comentario__avatar"
                            />
                            <div className="fala-ai-comentario__content">
                              <span className="fala-ai-comentario__autor">
                                {c.autor_nome}
                              </span>
                              {" "}
                              <span className="fala-ai-comentario__texto">
                                {c.texto}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {comentarioEmAberto === post.id_post ? (
                      <div className="fala-ai-comentar-form">
                        <textarea
                          value={textoComentario[post.id_post] || ""}
                          onChange={(e) =>
                            setTextoComentario((t) => ({
                              ...t,
                              [post.id_post]: e.target.value,
                            }))
                          }
                          placeholder="Escreva seu comentário..."
                          rows={2}
                          autoFocus
                          aria-label="Escreva seu comentário"
                        />
                        <div className="fala-ai-comentar-actions">
                          <button
                            type="button"
                            className="fala-ai-btn-cancel"
                            onClick={() => setComentarioEmAberto(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="fala-ai-btn-send"
                            onClick={() => handleComentar(post.id_post)}
                            disabled={
                              !(textoComentario[post.id_post]?.trim()) || enviando
                            }
                          >
                            {enviando ? "Enviando..." : "Comentar"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="fala-ai-btn-add-coment"
                        onClick={() => setComentarioEmAberto(post.id_post)}
                      >
                        Adicionar comentário...
                      </button>
                    )}
                  </div>
                </article>
              );

              return (
                <>
                  {/* Seção Palavra do dia */}
                  <section className="fala-ai-section" aria-labelledby="sec-palavra">
                    <h2 id="sec-palavra" className="fala-ai-section__titulo">
                      <span className="fala-ai-section__icone">☀</span>
                      Palavra do dia
                      {podePublicar && (
                        <Link
                          to="/usuario/fala-ai/admin?tipo=palavra_do_dia"
                          className="fala-ai-section__link"
                        >
                          + Nova
                        </Link>
                      )}
                    </h2>
                    <div className="fala-ai-section__content">
                      {palavraPosts.length === 0 ? (
                        <p className="fala-ai-section__empty">
                          Ainda não há palavra do dia publicada.
                        </p>
                      ) : (
                        <div className="fala-ai-feed">
                          {palavraPosts.map(renderCard)}
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="fala-ai-divider" role="separator" aria-hidden="true">
                    <span className="fala-ai-divider__line" />
                    <span className="fala-ai-divider__ornament">◆</span>
                    <span className="fala-ai-divider__line" />
                  </div>

                  {/* Seção Devocional */}
                  <section className="fala-ai-section" aria-labelledby="sec-devocional">
                    <h2 id="sec-devocional" className="fala-ai-section__titulo">
                      <span className="fala-ai-section__icone">📖</span>
                      Devocional
                      {podePublicar && (
                        <Link
                          to="/usuario/fala-ai/admin?tipo=devocional"
                          className="fala-ai-section__link"
                        >
                          + Novo
                        </Link>
                      )}
                    </h2>
                    <div className="fala-ai-section__content">
                      {devocionalPosts.length === 0 ? (
                        <p className="fala-ai-section__empty">
                          Ainda não há devocional publicado.
                        </p>
                      ) : (
                        <div className="fala-ai-feed">
                          {devocionalPosts.map(renderCard)}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              );
            })()}
          </div>
        )}
      </main>
      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant="error"
        />
      )}
      <Footer />
    </div>
  );
};

export default FalaAiDiscipulo;
