import db from "../database/index.js";
import { ValidationError } from "../utils/AppError.js";

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

  async getNextOrdem(trx = db) {
    const row = await trx("nivel").max("ordem as maxOrdem").first();
    const max = Number(row?.maxOrdem);
    return Number.isFinite(max) ? max + 1 : 1;
  }

  async assertOrdemDisponivel(ordem, excludeId = null, trx = db) {
    let q = trx("nivel").where("ordem", ordem);
    if (excludeId != null) {
      q = q.andWhereNot("id_nivel", excludeId);
    }
    const existente = await q.first();
    if (existente) {
      throw new ValidationError(
        `Já existe um nível com a ordem ${ordem}. Use o arrastar na lista para reordenar.`
      );
    }
  }

  async create(data) {
    return await db.transaction(async (trx) => {
      const payload = { ...data };
      if (payload.ordem == null) {
        payload.ordem = await this.getNextOrdem(trx);
      } else {
        await this.assertOrdemDisponivel(payload.ordem, null, trx);
      }
      const [id] = await trx("nivel").insert(payload);
      return await trx("nivel").where("id_nivel", id).first();
    });
  }

  async update(id, data) {
    return await db.transaction(async (trx) => {
      const payload = { ...data };
      if (payload.ordem != null) {
        await this.assertOrdemDisponivel(payload.ordem, id, trx);
      }
      await trx("nivel").where("id_nivel", id).update(payload);
      return await trx("nivel").where("id_nivel", id).first();
    });
  }

  /**
   * Redefine a ordem de 1..N conforme a sequência de ids recebida.
   * Ids omitidos (se houver) vão para o final, também normalizados.
   */
  async reordenar(ids) {
    const idsNorm = [...new Set((ids || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
    if (idsNorm.length === 0) {
      throw new ValidationError("Informe a lista de níveis para reordenar");
    }

    return await db.transaction(async (trx) => {
      const todos = await trx("nivel").select("id_nivel").orderBy("ordem", "asc").orderBy("id_nivel", "asc");
      const todosIds = todos.map((n) => Number(n.id_nivel));
      const faltantes = todosIds.filter((id) => !idsNorm.includes(id));
      const ordemFinal = [...idsNorm.filter((id) => todosIds.includes(id)), ...faltantes];

      // Evita colisão temporária durante o update em lote
      for (let i = 0; i < ordemFinal.length; i++) {
        await trx("nivel")
          .where("id_nivel", ordemFinal[i])
          .update({ ordem: -(i + 1) });
      }
      for (let i = 0; i < ordemFinal.length; i++) {
        await trx("nivel")
          .where("id_nivel", ordemFinal[i])
          .update({ ordem: i + 1 });
      }

      return await trx("nivel").orderBy("ordem", "asc").orderBy("id_nivel", "asc");
    });
  }

  async delete(id) {
    // Soft delete
    return await db("nivel").where("id_nivel", id).update({ ativo: false });
  }

  async reativar(id) {
    return await db("nivel").where("id_nivel", id).update({ ativo: true });
  }

  /**
   * Exclui permanentemente e renumerar ordens restantes (1..N).
   * FKs de usuario/modulo usam ON DELETE SET NULL.
   */
  async excluir(id) {
    return await db.transaction(async (trx) => {
      const existente = await trx("nivel").where("id_nivel", id).first();
      if (!existente) {
        throw new ValidationError("Nível não encontrado");
      }

      await trx("nivel").where("id_nivel", id).del();

      const restantes = await trx("nivel")
        .select("id_nivel")
        .orderBy("ordem", "asc")
        .orderBy("id_nivel", "asc");

      for (let i = 0; i < restantes.length; i++) {
        await trx("nivel")
          .where("id_nivel", restantes[i].id_nivel)
          .update({ ordem: -(i + 1) });
      }
      for (let i = 0; i < restantes.length; i++) {
        await trx("nivel")
          .where("id_nivel", restantes[i].id_nivel)
          .update({ ordem: i + 1 });
      }

      return await trx("nivel").orderBy("ordem", "asc").orderBy("id_nivel", "asc");
    });
  }

  async hardDelete(id) {
    return this.excluir(id);
  }
}

export default new NivelModel();
