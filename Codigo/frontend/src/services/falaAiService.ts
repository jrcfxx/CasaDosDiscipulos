import api from "./apiClient";

export type TipoPost = "devocional" | "palavra_do_dia";

export interface FalaAiPost {
  id_post: number;
  id_usuario: number;
  tipo: TipoPost;
  titulo: string | null;
  conteudo: string;
  referencia: string | null;
  imagem_url: string | null;
  data_publicacao: string;
  created_at: string;
  autor_nome: string;
  autor_foto: string | null;
  comentarios?: FalaAiComentario[];
  total_comentarios?: number;
}

export interface FalaAiComentario {
  id_comentario: number;
  id_post: number;
  id_usuario: number;
  texto: string;
  created_at: string;
  autor_nome: string;
  autor_foto: string | null;
}

export interface CriarPostPayload {
  tipo: TipoPost;
  titulo?: string;
  conteudo: string;
  referencia?: string;
  imagem_url?: string;
  data_publicacao?: string;
}

const falaAiService = {
  async listarPosts(limit = 20, offset = 0) {
    const res = await api.get<FalaAiPost[]>("/fala-ai/posts", { params: { limit, offset } });
    return res.data;
  },

  async getPost(id: number) {
    const res = await api.get<FalaAiPost>(`/fala-ai/posts/${id}`);
    return res.data;
  },

  async criarPost(dados: CriarPostPayload) {
    const res = await api.post<FalaAiPost>("/fala-ai/posts", dados);
    return res.data;
  },

  async adicionarComentario(idPost: number, texto: string) {
    const res = await api.post<FalaAiComentario>(`/fala-ai/posts/${idPost}/comentarios`, { texto });
    return res.data;
  },

  async excluirComentario(idComentario: number) {
    await api.delete(`/fala-ai/comentarios/${idComentario}`);
  },

  async excluirPost(idPost: number) {
    await api.delete(`/fala-ai/posts/${idPost}`);
  },

  async uploadImagem(file: File) {
    const form = new FormData();
    form.append("imagem", file);
    const res = await api.post<{ imagem_url: string }>("/fala-ai/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default falaAiService;
