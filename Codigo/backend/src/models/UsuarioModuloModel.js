import knex from "../database/index.js";

/**
 * Model para progresso do usuário em módulos (usuario_modulo)
 */
const UsuarioModuloModel = {
  async getByUsuario(id_usuario) {
    return knex("usuario_modulo")
      .where({ id_usuario })
      .select("*")
      .orderBy("id_modulo", "asc");
  },

  async getByUsuarioAndModulo(id_usuario, id_modulo) {
    return knex("usuario_modulo")
      .where({ id_usuario, id_modulo })
      .first();
  },

  async create(data) {
    const [id] = await knex("usuario_modulo").insert(data);
    return knex("usuario_modulo").where({ id_usuario_modulo: id }).first();
  },

  async upsert(id_usuario, id_modulo, dados) {
    const existente = await this.getByUsuarioAndModulo(id_usuario, id_modulo);
    if (existente) {
      await knex("usuario_modulo")
        .where({ id_usuario, id_modulo })
        .update(dados);
      return this.getByUsuarioAndModulo(id_usuario, id_modulo);
    }
    await knex("usuario_modulo").insert({
      id_usuario,
      id_modulo,
      ...dados,
    });
    return this.getByUsuarioAndModulo(id_usuario, id_modulo);
  },
};

export default UsuarioModuloModel;
