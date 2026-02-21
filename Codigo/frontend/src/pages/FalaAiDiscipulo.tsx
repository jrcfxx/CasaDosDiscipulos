import React, { useEffect, useState, useCallback } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
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

const tipoLabel: Record<string, string> = {
  devocional: "Devocional",
  palavra_do_dia: "Palavra do dia",
};

const FalaAiDiscipulo: React.FC = () => {
  const { isAdmin, isLider } = useAuth();
  const [posts, setPosts] = useState<FalaAiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentarioEmAberto, setComentarioEmAberto] = useState<number | null>(null);
  const [textoComentario, setTextoComentario] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState(false);

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
      // erro silencioso ou toast
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
          <p className="fala-ai-subtitle">Devocional e Palavra do dia</p>
          {(isAdmin || isLider) && (
            <a href="#/usuario/fala-ai/admin" className="fala-ai-btn-novo">
              + Novo post
            </a>
          )}
        </div>

        {loading ? (
          <p className="fala-ai-loading">Carregando...</p>
        ) : posts.length === 0 ? (
          <div className="fala-ai-empty">
            <p>Nenhum devocional ou palavra do dia publicada ainda.</p>
            {(isAdmin || isLider) && (
              <a href="#/usuario/fala-ai/admin" className="fala-ai-btn-novo">
                Criar o primeiro
              </a>
            )}
          </div>
        ) : (
          <div className="fala-ai-feed">
            {posts.map((post) => (
              <article key={post.id_post} className="fala-ai-card">
                <div className="fala-ai-card__head">
                  <img
                    src={getAvatarUrl(post.autor_foto) || "/favicon.ico"}
                    alt=""
                    className="fala-ai-card__avatar"
                  />
                  <div className="fala-ai-card__meta">
                    <span className="fala-ai-card__autor">{post.autor_nome}</span>
                    <span className="fala-ai-card__tipo">{tipoLabel[post.tipo]}</span>
                    <span className="fala-ai-card__data">
                      {formatarData(post.data_publicacao)}
                    </span>
                  </div>
                </div>

                {post.imagem_url && (
                  <div className="fala-ai-card__imagem">
                    <img
                      src={post.imagem_url.startsWith("http") ? post.imagem_url : `${ASSETS_BASE}${post.imagem_url}`}
                      alt=""
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
                            alt=""
                            className="fala-ai-comentario__avatar"
                          />
                          <div>
                            <span className="fala-ai-comentario__autor">
                              {c.autor_nome}
                            </span>
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
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FalaAiDiscipulo;
