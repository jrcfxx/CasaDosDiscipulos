import knex from "../database/index.js";
import FalaAiPostModel from "../models/FalaAiPostModel.js";
import FalaAiComentarioModel from "../models/FalaAiComentarioModel.js";
import NotificacaoModel from "../models/NotificacaoModel.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/AppError.js";

class FalaAiService {
  async listarPosts(limit = 20, offset = 0) {
    const posts = await FalaAiPostModel.listar(limit, offset);
    const postsComComentarios = await Promise.all(
      posts.map(async (p) => {
        const comentarios = await FalaAiComentarioModel.listarPorPost(p.id_post);
        return { ...p, comentarios, total_comentarios: comentarios.length };
      })
    );
    return postsComComentarios;
  }

  async getPostComComentarios(id) {
    const post = await FalaAiPostModel.getById(id);
    if (!post) throw new NotFoundError("Post não encontrado");
    const comentarios = await FalaAiComentarioModel.listarPorPost(id);
    return { ...post, comentarios, total_comentarios: comentarios.length };
  }

  async criarPost(dados, idUsuario) {
    if (!dados.tipo || !["devocional", "palavra_do_dia"].includes(dados.tipo)) {
      throw new ValidationError("Tipo deve ser devocional ou palavra_do_dia");
    }
    if (!dados.conteudo || !String(dados.conteudo).trim()) {
      throw new ValidationError("Conteúdo é obrigatório");
    }
    const dataPub = dados.data_publicacao || new Date().toISOString().slice(0, 10);
    const post = await FalaAiPostModel.create({
      id_usuario: idUsuario,
      tipo: dados.tipo,
      titulo: dados.titulo?.trim() || null,
      conteudo: String(dados.conteudo).trim(),
      referencia: dados.referencia?.trim() || null,
      imagem_url: dados.imagem_url || null,
      data_publicacao: dataPub,
    });
    await this._notificarTodos(post);
    return post;
  }

  async _notificarTodos(post) {
    const usuariosAtivos = await knex("usuario").where("ativo", true).select("id_usuario");
    const tipoNotif = post.tipo === "devocional" ? "fala_ai_devocional" : "fala_ai_palavra";
    const tituloNotif =
      post.tipo === "devocional"
        ? post.titulo
          ? `Novo devocional: ${post.titulo}`
          : "Novo devocional"
        : "Palavra do dia";
    const preview =
      post.conteudo.length > 80 ? `${post.conteudo.substring(0, 80).trim()}...` : post.conteudo;
    for (const { id_usuario } of usuariosAtivos) {
      await NotificacaoModel.create({
        id_usuario,
        tipo: tipoNotif,
        titulo: tituloNotif,
        mensagem: preview,
        area_nome: "Fala Aí, Discípulo",
      });
    }
  }

  async adicionarComentario(idPost, texto, idUsuario) {
    const post = await FalaAiPostModel.getById(idPost);
    if (!post) throw new NotFoundError("Post não encontrado");
    if (!texto || !String(texto).trim()) {
      throw new ValidationError("Texto do comentário é obrigatório");
    }
    return await FalaAiComentarioModel.create({
      id_post: idPost,
      id_usuario: idUsuario,
      texto: String(texto).trim(),
    });
  }

  async excluirComentario(idComentario, idUsuario, ehAdmin) {
    const comentario = await FalaAiComentarioModel.getById(idComentario);
    if (!comentario) throw new NotFoundError("Comentário não encontrado");
    const ehAutor = comentario.id_usuario === idUsuario;
    if (!ehAutor && !ehAdmin) {
      throw new ForbiddenError("Você só pode excluir seus próprios comentários");
    }
    await FalaAiComentarioModel.delete(idComentario);
    return { message: "Comentário excluído" };
  }

  async excluirPost(idPost, idUsuario, ehAdmin) {
    const post = await FalaAiPostModel.getById(idPost);
    if (!post) throw new NotFoundError("Post não encontrado");
    const ehAutor = post.id_usuario === idUsuario;
    if (!ehAutor && !ehAdmin) {
      throw new ForbiddenError("Você só pode excluir seus próprios posts");
    }
    await FalaAiPostModel.delete(idPost);
    return { message: "Post excluído" };
  }
}

export default new FalaAiService();
