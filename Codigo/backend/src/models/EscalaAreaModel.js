import knex from "../database/index.js";

/**
 * Model para áreas/funções de cada evento de escala (ex: Som, Louvor, Receção)
 */
const EscalaAreaModel = {
  async getByEventoId(idEvento) {
    return await knex("escala_area")
      .select("*")
      .where("id_escala_evento", idEvento)
      .orderBy("ordem", "asc");
  },

  async getById(id) {
    return await knex("escala_area")
      .select("*")
      .where("id_escala_area", id)
      .first();
  },

  async create(area) {
    const [insertId] = await knex("escala_area").insert(area);
    return await this.getById(insertId);
  },

  async update(id, area) {
    await knex("escala_area")
      .where("id_escala_area", id)
      .update(area);
    return await this.getById(id);
  },

  async delete(id) {
    return await knex("escala_area").where("id_escala_area", id).del();
  },

  async deleteByEventoId(idEvento) {
    return await knex("escala_area").where("id_escala_evento", idEvento).del();
  },
};

export default EscalaAreaModel;
