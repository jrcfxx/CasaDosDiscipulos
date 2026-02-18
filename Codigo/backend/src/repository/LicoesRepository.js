import knex from "../database/index.js";

// Subqueries
const subqueryTexto = knex.raw(
  `(SELECT 1 FROM formulario f JOIN campo_personalizado cp ON f.id_formulario = cp.id_origem AND cp.origem = 'formulario' WHERE f.id_licao = l.id_licao AND cp.tipo_campo = 'TEXTO' LIMIT 1) AS add_caixa_texto`
);
const subqueryCheckbox = knex.raw(
  `(SELECT 1 FROM formulario f JOIN campo_personalizado cp ON f.id_formulario = cp.id_origem AND cp.origem = 'formulario' WHERE f.id_licao = l.id_licao AND cp.tipo_campo = 'CHECKBOX' LIMIT 1) AS add_checkbox`
);

class LicoesRepository {
  // 'data' é um objeto (ex: { titulo: '...', ... })
  // 'trx' é o objeto de transação do Knex
  create(data, trx) {
    const db = trx || knex;
    return db("licao").insert(data).returning("id_licao");
  }

  update(id, data, trx) {
    const db = trx || knex;
    return db("licao").where("id_licao", id).update(data);
  }

  softDelete(id) {
    return knex("licao").where("id_licao", id).update({ ativo: 0 });
  }

  findByCurso(id_curso) {
    return knex("licao as l")
      .select("l.*", subqueryTexto, subqueryCheckbox)
      .where("l.id_curso", id_curso)
      .andWhere("l.ativo", 1);
  }

  findById(id) {
    return knex("licao as l")
      .select("l.*", subqueryTexto, subqueryCheckbox)
      .where("l.id_licao", id)
      .andWhere("l.ativo", 1)
      .first();
  }
}

export default new LicoesRepository();
