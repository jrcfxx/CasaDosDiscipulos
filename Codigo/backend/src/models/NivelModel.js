import db from "../database/index.js";

class NivelModel {
  async findAll() {
    return await db("nivel").where("ativo", true).orderBy("ordem", "asc");
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

  async hardDelete(id) {
    return await db("nivel").where("id_nivel", id).del();
  }
}

export default new NivelModel();
