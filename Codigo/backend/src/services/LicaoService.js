import LicaoModel from "../models/LicaoModel.js";
import CampoModel from "../models/CampoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";
import knex from "../database/index.js";
import {
  conteudoParaTexto,
  idDaRota,
  validarConteudoDeModulo,
  validarListaDeCampos,
} from "../utils/camposEntidade.js";

/** Tipos que podem entrar numa lição (o quiz não: ele é das Escola de Discípulos/módulos) */
async function tiposDeLicao() {
  const permitidos = await CampoModel.getByModalidade("licao");
  return new Map(permitidos.filter((c) => c.tipo_campo !== "quiz").map((c) => [Number(c.id_campo), c.tipo_campo]));
}

/** Conteúdos: pelo menos um, com título, sem títulos repetidos e com o conteúdo preenchido/válido */
async function validarCampos(campos) {
  const tipos = await tiposDeLicao();
  validarListaDeCampos(campos, { tiposPermitidos: tipos, oQue: "lição" });
  validarConteudoDeModulo(campos, tipos);
}

async function gravarCampos(trx, idLicao, campos) {
  await trx("licao_campo").where({ id_licao: idLicao }).del();
  if (!campos.length) return;
  // A ordem é a da lista enviada
  await trx("licao_campo").insert(
    campos.map((c, i) => ({
      id_licao: idLicao,
      id_campo: Number(c.id_campo),
      label: String(c.label).trim(),
      conteudo: conteudoParaTexto(c.conteudo).trim(),
      ordem: i,
    }))
  );
}

class LicaoService {
  async getAll({ somenteAtivas = false } = {}) {
    const todas = await LicaoModel.getAll();
    const licoes = somenteAtivas ? todas.filter((l) => l.ativo === 1 || l.ativo === true) : todas;
    return Promise.all(
      licoes.map(async (l) => ({ ...l, campos: await CampoModel.getByOption("licao", l.id_licao) }))
    );
  }

  async getById(id, { somenteAtivas = false } = {}) {
    const idNum = idDaRota(id, "lição");
    const licao = await LicaoModel.getById(idNum);
    if (!licao || (somenteAtivas && !(licao.ativo === 1 || licao.ativo === true))) {
      throw new NotFoundError("Lição não encontrada");
    }
    return { ...licao, campos: await CampoModel.getByOption("licao", idNum) };
  }

  async create(data) {
    const titulo = String(data.titulo ?? "").trim();
    if (titulo.length < 3) throw new ValidationError("O título precisa ter pelo menos 3 letras.");
    const campos = Array.isArray(data.campos) ? data.campos : [];
    await validarCampos(campos);

    // Tudo ou nada: um conteúdo inválido não deixa uma lição pela metade
    const idLicao = await knex.transaction(async (trx) => {
      const [id] = await trx("licao").insert({
        titulo,
        descricao: String(data.descricao ?? "").trim() || null,
        ativo: data.ativo ?? true,
      });
      await gravarCampos(trx, id, campos);
      return id;
    });
    return this.getById(idLicao);
  }

  /**
   * Edita só o que vier: { ativo } sozinho só liga/desliga. Antes os conteúdos eram apagados em
   * toda edição e só recriados se viessem junto (desativar sem mandar os campos esvaziava a lição).
   */
  async update(id, data) {
    const idNum = idDaRota(id, "lição");
    const existe = await LicaoModel.getById(idNum);
    if (!existe) throw new NotFoundError("Lição não encontrada");

    const dados = {};
    if (data.titulo !== undefined) {
      dados.titulo = String(data.titulo).trim();
      if (dados.titulo.length < 3) throw new ValidationError("O título precisa ter pelo menos 3 letras.");
    }
    if (data.descricao !== undefined) dados.descricao = String(data.descricao ?? "").trim() || null;
    if (data.ativo !== undefined) dados.ativo = data.ativo;
    const campos = Array.isArray(data.campos) ? data.campos : null;
    if (campos) await validarCampos(campos);

    await knex.transaction(async (trx) => {
      if (Object.keys(dados).length) await trx("licao").where({ id_licao: idNum }).update(dados);
      if (campos) await gravarCampos(trx, idNum, campos);
    });
    return this.getById(idNum);
  }

  async delete(id) {
    const idNum = idDaRota(id, "lição");
    const deleted = await LicaoModel.delete(idNum);
    if (!deleted) throw new NotFoundError("Lição não encontrada");
    return deleted;
  }
}

export default new LicaoService();
