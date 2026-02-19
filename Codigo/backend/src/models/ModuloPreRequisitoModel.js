import knex from "../database/index.js";

const ModuloPreRequisitoModel = {
  async getByModulo(id_modulo) {
    const rows = await knex("modulo_pre_requisito")
      .where({ id_modulo })
      .select("id_modulo_requerido");
    return rows.map((r) => r.id_modulo_requerido);
  },

  async setForModulo(id_modulo, idsRequeridos) {
    await knex("modulo_pre_requisito").where({ id_modulo }).del();

    if (!idsRequeridos?.length) return;

    const toInsert = idsRequeridos
      .filter((id) => Number(id) && Number(id) !== Number(id_modulo))
      .map((id_modulo_requerido) => ({ id_modulo, id_modulo_requerido }));

    if (toInsert.length > 0) {
      await knex("modulo_pre_requisito").insert(toInsert);
    }
  },
};

export default ModuloPreRequisitoModel;
