import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BibliaVerseCard from "../components/BibliaVerseCard";
import falaAiService, {
  type CriarPostPayload,
  type TipoPost,
} from "../services/falaAiService";
import { ASSETS_BASE } from "../config/api";
import "../style/FalaAiDiscipuloAdmin.css";

const FalaAiDiscipuloAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tipoFromUrl = searchParams.get("tipo");
  const [tipo, setTipo] = useState<TipoPost>(() => {
    if (tipoFromUrl === "palavra_do_dia" || tipoFromUrl === "devocional") {
      return tipoFromUrl;
    }
    return "devocional";
  });

  useEffect(() => {
    if (tipoFromUrl === "palavra_do_dia" || tipoFromUrl === "devocional") {
      setTipo(tipoFromUrl);
    }
  }, [tipoFromUrl]);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [dataPublicacao, setDataPublicacao] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [enviando, setEnviando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const inserirVersiculoNoConteudo = (bloco: string) => {
    setConteudo((prev) => {
      const base = prev.trim();
      return base ? `${base}\n\n${bloco}` : bloco;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErro(null);
    try {
      const { imagem_url } = await falaAiService.uploadImagem(file);
      setImagemUrl(imagem_url);
    } catch (err: any) {
      setErro(err?.response?.data?.error || "Erro no upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conteudo.trim()) {
      setErro("Conteúdo é obrigatório");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const payload: CriarPostPayload = {
        tipo,
        conteudo: conteudo.trim(),
        titulo: titulo.trim() || undefined,
        referencia: referencia.trim() || undefined,
        imagem_url: imagemUrl || undefined,
        data_publicacao: dataPublicacao,
      };
      await falaAiService.criarPost(payload);
      navigate("/usuario/fala-ai");
    } catch (err: any) {
      setErro(err?.response?.data?.error || "Erro ao publicar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fala-ai-admin-page page-with-fixed-header">
      <Header />
      <main id="main-content" className="fala-ai-admin-main" tabIndex={-1}>
        <div className="fala-ai-admin-header">
          <Link to="/usuario/fala-ai" className="fala-ai-admin-back">
            ← Voltar
          </Link>
          <h1 className="fala-ai-admin-title">Novo post</h1>
          <p className="fala-ai-admin-subtitle">
            Devocional ou Palavra do dia
          </p>
        </div>

        <form onSubmit={handleSubmit} className="fala-ai-admin-form">
          {erro && <div className="fala-ai-admin-erro">{erro}</div>}

          <div className="fala-ai-admin-field">
            <label htmlFor="fala-tipo">Tipo</label>
            <select
              id="fala-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoPost)}
            >
              <option value="devocional">Devocional</option>
              <option value="palavra_do_dia">Palavra do dia</option>
            </select>
          </div>

          <div className="fala-ai-admin-field">
            <label htmlFor="fala-titulo">Título (opcional)</label>
            <input
              id="fala-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Confiança no Senhor"
            />
          </div>

          <div className="fala-ai-admin-field">
            <label htmlFor="fala-ref">Referência bíblica (opcional)</label>
            <input
              id="fala-ref"
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ex: Salmos 23:1 ou João 3:16"
              autoComplete="off"
            />
            <p className="fala-ai-admin-field-hint">
              Digite a referência e o versículo aparece automaticamente (NVI), com uma cena animada.
            </p>

            <BibliaVerseCard
              referencia={referencia}
              onInserir={inserirVersiculoNoConteudo}
            />
          </div>

          <div className="fala-ai-admin-field">
            <label htmlFor="fala-conteudo">Conteúdo *</label>
            <textarea
              id="fala-conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreva o devocional ou a palavra do dia..."
              rows={8}
              required
            />
          </div>

          <div className="fala-ai-admin-field">
            <label htmlFor="fala-imagem">Imagem (opcional)</label>
            <input
              ref={fileInputRef}
              id="fala-imagem"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleUpload}
              style={{ display: "none" }}
              aria-label="Selecionar imagem"
            />
            <button
              type="button"
              className="fala-ai-admin-btn-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Enviando..." : "Selecionar imagem"}
            </button>
            {imagemUrl && (
              <div className="fala-ai-admin-preview">
                <img src={`${ASSETS_BASE}${imagemUrl}`} alt="Preview" />
                <button
                  type="button"
                  className="fala-ai-admin-remove-img"
                  onClick={() => setImagemUrl("")}
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          <div className="fala-ai-admin-field">
            <label htmlFor="fala-data">Data de publicação</label>
            <input
              id="fala-data"
              type="date"
              value={dataPublicacao}
              onChange={(e) => setDataPublicacao(e.target.value)}
            />
          </div>

          <div className="fala-ai-admin-actions">
            <Link to="/usuario/fala-ai" className="fala-ai-admin-btn-cancel">
              Cancelar
            </Link>
            <button
              type="submit"
              className="fala-ai-admin-btn-submit"
              disabled={enviando}
            >
              {enviando ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default FalaAiDiscipuloAdmin;
