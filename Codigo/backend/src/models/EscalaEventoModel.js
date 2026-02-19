import knex from "../database/index.js";

/**
 * Model para eventos do calendário de escala (criados pelo admin)
 */
const EscalaEventoModel = {
  async getAll(filters) {
    let q = knex("escala_evento")
      .select("*")
      .orderBy("data_hora", "asc");

    if (filters?.ano) q = q.whereRaw("YEAR(data_hora) = ?", [filters.ano]);
    if (filters?.mes) q = q.whereRaw("MONTH(data_hora) = ?", [filters.mes]);
    if (filters?.ativo !== undefined) q = q.where("ativo", filters.ativo);

    return await q;
  },

  async getById(id) {
    return await knex("escala_evento")
      .select("*")
      .where("id_escala_evento", id)
      .first();
  },

  async create(evento) {
    const [insertId] = await knex("escala_evento").insert(evento);
    return await this.getById(insertId);
  },

  async update(id, evento) {
    await knex("escala_evento")
      .where("id_escala_evento", id)
      .update({
        ...evento,
        data_atualizacao: knex.fn.now(),
      });
    return await this.getById(id);
  },

  async delete(id) {
    return await knex("escala_evento").where("id_escala_evento", id).del();
  },

  async getMinisteriosByEvento(idEvento) {
    return await knex("escala_evento_ministerio as em")
      .join("ministerio as m", "em.id_ministerio", "m.id_ministerio")
      .select("m.id_ministerio", "m.nome")
      .where("em.id_escala_evento", idEvento)
      .where("m.ativo", true);
  },

  async setMinisterios(idEvento, idMinisterios) {
    await knex("escala_evento_ministerio").where("id_escala_evento", idEvento).del();
    if (idMinisterios && idMinisterios.length) {
      const rows = idMinisterios.map((id) => ({
        id_escala_evento: idEvento,
        id_ministerio: id,
      }));
      await knex("escala_evento_ministerio").insert(rows);
    }
  },
};

export default EscalaEventoModel;
