import knex from "../database/index.js";

const MinisterioModel = {
  async getAll(incluirInativos) {
    let q = knex("ministerio")
      .select("*")
      .orderBy("ordem", "asc")
      .orderBy("nome", "asc");
    if (!incluirInativos) q = q.where("ativo", true);
    return await q;
  },

  async getById(id) {
    return await knex("ministerio").select("*").where("id_ministerio", id).first();
  },

  async create(data) {
    const [id] = await knex("ministerio").insert(data);
    return await this.getById(id);
  },

  async update(id, data) {
    await knex("ministerio")
      .where("id_ministerio", id)
      .update({ ...data, data_atualizacao: knex.fn.now() });
    return await this.getById(id);
  },

  async delete(id) {
    return await knex("ministerio").where("id_ministerio", id).del();
  },

  async getLideresByMinisterio(idMinisterio) {
    return await knex("ministerio_lider as ml")
      .join("usuario as u", "ml.id_usuario", "u.id_usuario")
      .select("u.id_usuario", "u.nome")
      .where("ml.id_ministerio", idMinisterio);
  },

  async setLideres(idMinisterio, idUsuarios) {
    await knex("ministerio_lider").where("id_ministerio", idMinisterio).del();
    if (idUsuarios && idUsuarios.length) {
      const rows = idUsuarios.map((id) => ({ id_ministerio: idMinisterio, id_usuario: id }));
      await knex("ministerio_lider").insert(rows);
    }
    const todosLideres = await knex("ministerio_lider").select("id_usuario").distinct();
    const idsLideres = todosLideres.map((r) => r.id_usuario);
    await knex("usuario").update({ lider_ministerio: false });
    if (idsLideres.length) {
      await knex("usuario").whereIn("id_usuario", idsLideres).update({ lider_ministerio: true });
    }
  },

  async getParticipantesByMinisterio(idMinisterio) {
    return await knex("usuario_ministerio as um")
      .join("usuario as u", "um.id_usuario", "u.id_usuario")
      .select("u.id_usuario", "u.nome")
      .where("um.id_ministerio", idMinisterio)
      .where("u.ativo", true);
  },

  async setParticipantes(idMinisterio, idUsuarios) {
    await knex("usuario_ministerio").where("id_ministerio", idMinisterio).del();
    if (idUsuarios && idUsuarios.length) {
      const rows = idUsuarios.map((id) => ({ id_ministerio: idMinisterio, id_usuario: id }));
      await knex("usuario_ministerio").insert(rows);
    }
  },

  async getMinisteriosByUsuario(idUsuario) {
    return await knex("ministerio_lider as ml")
      .join("ministerio as m", "ml.id_ministerio", "m.id_ministerio")
      .select("m.id_ministerio", "m.nome")
      .where("ml.id_usuario", idUsuario)
      .where("m.ativo", true);
  },

  async getMinisteriosParticipaByUsuario(idUsuario) {
    return await knex("usuario_ministerio as um")
      .join("ministerio as m", "um.id_ministerio", "m.id_ministerio")
      .select("m.id_ministerio", "m.nome")
      .where("um.id_usuario", idUsuario)
      .where("m.ativo", true);
  },

  async setMinisteriosParticipaByUsuario(idUsuario, idMinisterios) {
    await knex("usuario_ministerio").where("id_usuario", idUsuario).del();
    if (idMinisterios && idMinisterios.length) {
      const rows = idMinisterios.map((id) => ({ id_ministerio: id, id_usuario: idUsuario }));
      await knex("usuario_ministerio").insert(rows);
    }
  },
};

export default MinisterioModel;
