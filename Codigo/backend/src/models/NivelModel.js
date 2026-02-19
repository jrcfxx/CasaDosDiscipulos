import db from "../database/index.js";

class NivelModel {
  async findAll(incluirInativos = false) {
    let query = db("nivel");
    if (!incluirInativos) {
      query = query.where("ativo", true);
    }
    return await query.orderBy("ordem", "asc").orderBy("id_nivel", "asc");
  }

  async findById(id) {
    return await db("nivel").where("id_nivel", id).first();
  }

  async create(data) {
    const [id] = await db("nivel").insert(data);
    return this.findById(id);
  }

  async update(id, data) {
    await db("nivel").where("id_nivel", id).update(data);
    return this.findById(id);
  }

  async delete(id) {
    // Soft delete
    return await db("nivel").where("id_nivel", id).update({ ativo: false });
  }

  async reativar(id) {
    return await db("nivel").where("id_nivel", id).update({ ativo: true });
  }

  async hardDelete(id) {
    return await db("nivel").where("id_nivel", id).del();
  }
}

export default new NivelModel();
