import knex from "../database/index.js";

const NotificacaoModel = {
  async create(notif) {
    const [id] = await knex("notificacao").insert(notif);
    return knex("notificacao").where("id_notificacao", id).first();
  },

  async getByUsuario(idUsuario, opts = {}) {
    let q = knex("notificacao")
      .select("*")
      .where("id_usuario", idUsuario)
      .orderBy("data_criacao", "desc");

    if (opts.limit) q = q.limit(opts.limit);
    if (opts.naoLidos) q = q.where("lido", false);

    return await q;
  },

  async marcarLido(id, idUsuario) {
    await knex("notificacao")
      .where("id_notificacao", id)
      .where("id_usuario", idUsuario)
      .update({ lido: true });
  },

  async marcarTodasLidas(idUsuario) {
    await knex("notificacao")
      .where("id_usuario", idUsuario)
      .update({ lido: true });
  },

  async countNaoLidas(idUsuario) {
    const [r] = await knex("notificacao")
      .where("id_usuario", idUsuario)
      .where("lido", false)
      .count("* as total");
    return Number(r?.total ?? 0);
  },
};

export default NotificacaoModel;
