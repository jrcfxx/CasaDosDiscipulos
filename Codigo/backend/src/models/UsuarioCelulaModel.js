import knex from "../database/index.js";

/**
 * Model para vínculo usuário-célula (célula principal do membro)
 */
const UsuarioCelulaModel = {
  async getByUsuario(id_usuario) {
    return knex("usuario_celula")
      .select(
        "usuario_celula.*",
        "celula.nome as nome_celula",
        "celula.endereco",
        "celula.dia_reuniao",
        "celula.horario_reuniao"
      )
      .leftJoin("celula", "usuario_celula.id_celula", "celula.id_celula")
      .where({ "usuario_celula.id_usuario": id_usuario })
      .orderBy("usuario_celula.principal", "desc");
  },

  async getPrincipalByUsuario(id_usuario) {
    return knex("usuario_celula")
      .select(
        "usuario_celula.*",
        "celula.nome as nome_celula",
        "celula.endereco",
        "celula.dia_reuniao",
        "celula.horario_reuniao"
      )
      .leftJoin("celula", "usuario_celula.id_celula", "celula.id_celula")
      .where({
        "usuario_celula.id_usuario": id_usuario,
        "usuario_celula.principal": true,
      })
      .first();
  },

  async upsert(id_usuario, id_celula, principal = false) {
    const existente = await knex("usuario_celula")
      .where({ id_usuario, id_celula })
      .first();

    if (existente) {
      await knex("usuario_celula")
        .where({ id_usuario, id_celula })
        .update({ principal: Boolean(principal) });
    } else {
      await knex("usuario_celula").insert({
        id_usuario,
        id_celula,
        principal: Boolean(principal),
      });
    }

    if (principal) {
      await knex("usuario_celula")
        .where({ id_usuario })
        .whereNot({ id_celula })
        .update({ principal: false });
    }

    return this.getPrincipalByUsuario(id_usuario);
  },

  async remove(id_usuario, id_celula) {
    return knex("usuario_celula")
      .where({ id_usuario, id_celula })
      .del();
  },
};

export default UsuarioCelulaModel;
