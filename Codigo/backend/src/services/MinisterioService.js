import knex from "../database/index.js";
import MinisterioModel from "../models/MinisterioModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

const MinisterioService = {
  async getAll(incluirInativos = false) {
    const ministerios = await MinisterioModel.getAll(incluirInativos);
    const mapa = await MinisterioModel.listarMapaParalelismos();
    return await Promise.all(
      ministerios.map(async (m) => {
        const lideres = await MinisterioModel.getLideresByMinisterio(m.id_ministerio);
        return {
          ...m,
          lideres,
          id_paralelismos: mapa[m.id_ministerio] || [],
        };
      })
    );
  },

  async getById(id, incluirLideres = true) {
    const parsed = this._parseId(id);
    const m = await MinisterioModel.getById(parsed);
    if (!m) throw new NotFoundError("Ministério não encontrado");
    if (incluirLideres) {
      m.lideres = await MinisterioModel.getLideresByMinisterio(parsed);
    }
    m.id_paralelismos = await MinisterioModel.getParalelismos(parsed);
    return m;
  },

  async create(data) {
    if (!data.nome || !data.nome.trim()) {
      throw new ValidationError("Nome do ministério é obrigatório");
    }
    const ministerio = await MinisterioModel.create({
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      ativo: data.ativo !== undefined ? data.ativo : true,
      ordem: data.ordem ?? 0,
    });
    if (data.id_lideres?.length) {
      await MinisterioModel.setLideres(ministerio.id_ministerio, data.id_lideres);
      ministerio.lideres = await MinisterioModel.getLideresByMinisterio(ministerio.id_ministerio);
    }
    if (data.id_paralelismos !== undefined) {
      await MinisterioModel.setParalelismos(ministerio.id_ministerio, data.id_paralelismos);
    }
    ministerio.id_paralelismos = await MinisterioModel.getParalelismos(ministerio.id_ministerio);
    return ministerio;
  },

  async update(id, data) {
    const parsed = this._parseId(id);
    const atual = await MinisterioModel.getById(parsed);
    if (!atual) throw new NotFoundError("Ministério não encontrado");

    const update = {};
    if (data.nome !== undefined) update.nome = data.nome.trim();
    if (data.descricao !== undefined) update.descricao = data.descricao?.trim() || null;
    if (data.ativo !== undefined) update.ativo = data.ativo;
    if (data.ordem !== undefined) update.ordem = data.ordem;
    if (Object.keys(update).length) await MinisterioModel.update(parsed, update);
    if (data.id_lideres !== undefined) {
      await MinisterioModel.setLideres(parsed, data.id_lideres || []);
    }
    if (data.id_paralelismos !== undefined) {
      await MinisterioModel.setParalelismos(parsed, data.id_paralelismos || []);
    }

    // Sincroniza escala_area: quando o nome do ministério muda, atualiza as áreas da escala que usam o nome antigo
    if (update.nome && atual.nome !== update.nome) {
      await knex("escala_area").where("nome", atual.nome).update({ nome: update.nome });
    }

    return await this.getById(parsed);
  },

  async delete(id) {
    const parsed = this._parseId(id);
    await this.getById(parsed, false);
    await MinisterioModel.delete(parsed);
  },

  async getParticipantes(id) {
    const parsed = this._parseId(id);
    await this.getById(parsed, false);
    return await MinisterioModel.getParticipantesByMinisterio(parsed);
  },

  async setParticipantes(id, idUsuarios) {
    const parsed = this._parseId(id);
    await this.getById(parsed, false);
    await MinisterioModel.setParticipantes(parsed, idUsuarios || []);
  },

  _parseId(id) {
    const parsed = Number(id);
    if (isNaN(parsed) || parsed <= 0) throw new ValidationError("ID inválido");
    return parsed;
  },
};

export default MinisterioService;
