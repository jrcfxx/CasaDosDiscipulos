import knex from "../database/index.js";

const FalaAiPostModel = {
  async listar(limit = 20, offset = 0) {
    const posts = await knex("fala_ai_post")
      .select(
        "fala_ai_post.*",
        "usuario.nome as autor_nome",
        "usuario.foto as autor_foto"
      )
      .leftJoin("usuario", "fala_ai_post.id_usuario", "usuario.id_usuario")
      .orderBy("fala_ai_post.data_publicacao", "desc")
      .orderBy("fala_ai_post.created_at", "desc")
      .limit(limit)
      .offset(offset);

    return posts;
  },

  async getById(id) {
    return await knex("fala_ai_post")
      .select(
        "fala_ai_post.*",
        "usuario.nome as autor_nome",
        "usuario.foto as autor_foto"
      )
      .leftJoin("usuario", "fala_ai_post.id_usuario", "usuario.id_usuario")
      .where("fala_ai_post.id_post", id)
      .first();
  },

  async create(dados) {
    const [id] = await knex("fala_ai_post").insert(dados);
    return await this.getById(id);
  },

  async update(id, dados) {
    await knex("fala_ai_post").where("id_post", id).update(dados);
    return await this.getById(id);
  },

  async delete(id) {
    return await knex("fala_ai_post").where("id_post", id).del();
  },
};

export default FalaAiPostModel;
