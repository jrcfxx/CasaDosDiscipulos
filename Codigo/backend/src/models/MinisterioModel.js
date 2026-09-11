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

  async getParalelismos(idMinisterio) {
    try {
      const rows = await knex("ministerio_paralelismo")
        .where("id_ministerio", idMinisterio)
        .select("id_ministerio_paralelo");
      return rows.map((r) => r.id_ministerio_paralelo);
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") return [];
      throw err;
    }
  },

  async setParalelismos(idMinisterio, idsParalelos = []) {
    try {
      await knex("ministerio_paralelismo").where("id_ministerio", idMinisterio).del();
      const unicos = [
        ...new Set(
          (idsParalelos || [])
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0 && id !== Number(idMinisterio))
        ),
      ];
      if (unicos.length) {
        await knex("ministerio_paralelismo").insert(
          unicos.map((id) => ({
            id_ministerio: idMinisterio,
            id_ministerio_paralelo: id,
          }))
        );
      }
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") {
        throw new Error(
          "Tabela de paralelismo não encontrada. Execute as migrations do banco."
        );
      }
      throw err;
    }
  },

  /**
   * Retorna true se A permite paralelismo com B ou B com A.
   */
  async permiteParalelismo(idMinisterioA, idMinisterioB) {
    const a = Number(idMinisterioA);
    const b = Number(idMinisterioB);
    if (!a || !b || a === b) return false;
    try {
      const row = await knex("ministerio_paralelismo")
        .where(function () {
          this.where({ id_ministerio: a, id_ministerio_paralelo: b }).orWhere({
            id_ministerio: b,
            id_ministerio_paralelo: a,
          });
        })
        .first();
      return Boolean(row);
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") return false;
      throw err;
    }
  },

  async listarMapaParalelismos() {
    try {
      const rows = await knex("ministerio_paralelismo").select(
        "id_ministerio",
        "id_ministerio_paralelo"
      );
      const mapa = {};
      for (const r of rows) {
        if (!mapa[r.id_ministerio]) mapa[r.id_ministerio] = [];
        mapa[r.id_ministerio].push(r.id_ministerio_paralelo);
      }
      return mapa;
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") return {};
      throw err;
    }
  },
};

export default MinisterioModel;
