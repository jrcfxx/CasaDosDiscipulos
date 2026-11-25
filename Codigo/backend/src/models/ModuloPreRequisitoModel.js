import knex from "../database/index.js";

const ModuloPreRequisitoModel = {
  async getByModulo(id_modulo) {
    const rows = await knex("modulo_pre_requisito")
      .where({ id_modulo })
      .select("id_modulo_requerido");
    return rows.map((r) => r.id_modulo_requerido);
  },

};

export default ModuloPreRequisitoModel;
