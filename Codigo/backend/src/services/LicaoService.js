import LicaoModel from "../models/LicaoModel.js";
import CampoModel from "../models/CampoModel.js";
import AppError from "../utils/AppError.js";
import knex from "../database/index.js";

class LicaoService {
  async getAll() {
    const licoes = await LicaoModel.getAll();

    const completas = await Promise.all(
      licoes.map(async (l) => {
        const campos = await CampoModel.getByOption("licao", l.id_licao);
        return { ...l, campos };
      })
    );

    return completas;
  }

  async getById(id) {
    const licao = await LicaoModel.getById(id);
    if (!licao) throw new AppError("Lição não encontrada", 404);

    const campos = await CampoModel.getByOption("licao", id);

    return { ...licao, campos };
  }

  async create(data) {
    if (!data.titulo) throw new AppError("Título é obrigatório", 400);

    const novaLicao = await LicaoModel.create({
      titulo: data.titulo,
      descricao: data.descricao,
      ativo: data.ativo,
    });

    if (data.campos && data.campos.length > 0) {
      for (let i = 0; i < data.campos.length; i++) {
        const campo = data.campos[i];
        await CampoModel.linkToEntity(
          "licao",
          novaLicao.id_licao,
          campo.id_campo,
          campo.conteudo || "",
          campo.label || "",
          i
        );
      }
    }

    const camposVinculados = await CampoModel.getByOption(
      "licao",
      novaLicao.id_licao
    );

    return { ...novaLicao, campos: camposVinculados };
  }

  async update(id, data) {
    const rowsAffected = await LicaoModel.update(id, {
      titulo: data.titulo,
      descricao: data.descricao,
      ativo: data.ativo,
    });

    if (!rowsAffected) throw new AppError("Lição não encontrada", 404);

    // remove campos antigos
    await knex("licao_campo").where({ id_licao: id }).del();

    // recriar campos
    if (data.campos && data.campos.length > 0) {
      for (let i = 0; i < data.campos.length; i++) {
        const campo = data.campos[i];
        await CampoModel.linkToEntity(
          "licao",
          id,
          campo.id_campo,
          campo.conteudo || "",
          campo.label || "",
          i
        );
      }
    }

    // Buscar a lição atualizada
    const licaoAtualizada = await LicaoModel.getById(id);
    const camposVinculados = await CampoModel.getByOption("licao", id);

    return { ...licaoAtualizada, campos: camposVinculados };
  }

  async delete(id) {
    const deleted = await LicaoModel.delete(id);
    if (!deleted) throw new AppError("Lição não encontrada", 404);
    return deleted;
  }
}

export default new LicaoService();
