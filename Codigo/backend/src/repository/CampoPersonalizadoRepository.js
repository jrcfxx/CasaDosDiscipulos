import knex from "../database/index.js";

class CampoPersonalizadoRepository {
  create(data, trx) {
    const db = trx || knex;
    return db("campo_personalizado").insert(data);
  }

  deleteById(id, trx) {
    const db = trx || knex;
    return db("campo_personalizado").where("id_campo", id).del();
  }

  findByFormularioAndTipo(idFormulario, tipo, trx) {
    const db = trx || knex;
    return db("campo_personalizado")
      .where({
        id_origem: idFormulario,
        tipo_campo: tipo,
        origem: "formulario",
      })
      .first();
  }
}

export default new CampoPersonalizadoRepository();
