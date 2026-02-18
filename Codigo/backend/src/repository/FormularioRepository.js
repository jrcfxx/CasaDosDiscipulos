import knex from "../database/index.js";

class FormularioRepository {
  create(data, trx) {
    const db = trx || knex;
    return db("formulario").insert(data).returning("id_formulario");
  }

  findByLicao(idLicao, trx) {
    const db = trx || knex;
    return db("formulario").where("id_licao", idLicao).first();
  }
}

export default new FormularioRepository();
