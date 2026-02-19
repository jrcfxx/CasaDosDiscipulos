import FormularioModel from "../models/FormularioModel.js";
import CampoModel from "../models/CampoModel.js";
import AppError from "../utils/AppError.js";
import knex from "../database/index.js";

class FormularioService {
  async getAll() {
    const formularios = await FormularioModel.getAll();

    const completos = await Promise.all(
      formularios.map(async (f) => {
        const campos = await CampoModel.getByOption(
          "formulario",
          f.id_formulario
        );
        return { ...f, campos };
      })
    );

    return completos;
  }

  async getById(id) {
    const formulario = await FormularioModel.getById(id);
    if (!formulario) throw new AppError("Formulário não encontrado", 404);

    const campos = await CampoModel.getByOption("formulario", id);

    return { ...formulario, campos };
  }

  async create(data) {
    if (!data.titulo) throw new AppError("Título é obrigatório", 400);

    const novo = await FormularioModel.create({
      titulo: data.titulo,
      descricao: data.descricao,
      ativo: data.ativo,
      frequencia: data.frequencia || null,
    });

    if (data.campos && data.campos.length > 0) {
      for (const campo of data.campos) {
        await knex("formulario_campo").insert({
          id_formulario: novo.id_formulario,
          id_campo: campo.id_campo,
          conteudo: campo.conteudo || "",
          label: campo.label || "",
          ordem: campo.ordem ?? 0,
          obrigatorio: campo.obrigatorio || false,
        });
      }
    }

    const camposVinculados = await CampoModel.getByOption(
      "formulario",
      novo.id_formulario
    );

    return { ...novo, campos: camposVinculados };
  }

  async update(id, data) {
    return await knex.transaction(async (trx) => {
      const rowsAffected = await FormularioModel.update(id, {
        titulo: data.titulo,
        descricao: data.descricao,
        ativo: data.ativo,
        frequencia: data.frequencia || null,
      });

      if (!rowsAffected) throw new AppError("Formulário não encontrado", 404);

      // limpar campos antigos
      await trx("formulario_campo").where({ id_formulario: id }).del();

      // recriar campos
      if (data.campos && data.campos.length > 0) {
        for (const campo of data.campos) {
          await trx("formulario_campo").insert({
            id_formulario: id,
            id_campo: campo.id_campo,
            conteudo: campo.conteudo || "",
            label: campo.label || "",
            ordem: campo.ordem ?? 0,
            obrigatorio: campo.obrigatorio || false,
          });
        }
      }

      // Buscar o formulário atualizado
      const formularioAtualizado = await FormularioModel.getById(id);
      const camposVinculados = await CampoModel.getByOption("formulario", id);

      return { ...formularioAtualizado, campos: camposVinculados };
    });
  }

  async delete(id) {
    const deleted = await FormularioModel.delete(id);
    if (!deleted) throw new AppError("Formulário não encontrado", 404);
    return deleted;
  }
}

export default new FormularioService();
