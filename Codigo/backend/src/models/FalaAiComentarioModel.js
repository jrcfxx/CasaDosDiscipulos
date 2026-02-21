import knex from "../database/index.js";

const FalaAiComentarioModel = {
  async listarPorPost(idPost) {
    return await knex("fala_ai_comentario")
      .select(
        "fala_ai_comentario.*",
        "usuario.nome as autor_nome",
        "usuario.foto as autor_foto"
      )
      .leftJoin("usuario", "fala_ai_comentario.id_usuario", "usuario.id_usuario")
      .where("fala_ai_comentario.id_post", idPost)
      .orderBy("fala_ai_comentario.created_at", "asc");
  },

  async create(dados) {
    const [id] = await knex("fala_ai_comentario").insert(dados);
    return await knex("fala_ai_comentario")
      .select(
        "fala_ai_comentario.*",
        "usuario.nome as autor_nome",
        "usuario.foto as autor_foto"
      )
      .leftJoin("usuario", "fala_ai_comentario.id_usuario", "usuario.id_usuario")
      .where("fala_ai_comentario.id_comentario", id)
      .first();
  },

  async getById(id) {
    return await knex("fala_ai_comentario")
      .select(
        "fala_ai_comentario.*",
        "usuario.nome as autor_nome",
        "usuario.foto as autor_foto"
      )
      .leftJoin("usuario", "fala_ai_comentario.id_usuario", "usuario.id_usuario")
      .where("fala_ai_comentario.id_comentario", id)
      .first();
  },

  async delete(id) {
    return await knex("fala_ai_comentario").where("id_comentario", id).del();
  },

  async usuarioEhAutor(idComentario, idUsuario) {
    const c = await knex("fala_ai_comentario")
      .where("id_comentario", idComentario)
      .first();
    return c && c.id_usuario === idUsuario;
  },
};

export default FalaAiComentarioModel;
