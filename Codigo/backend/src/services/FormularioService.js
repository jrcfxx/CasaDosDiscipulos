import FormularioModel from "../models/FormularioModel.js";
import CampoModel from "../models/CampoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";
import knex from "../database/index.js";
import { conteudoParaTexto, idDaRota, validarListaDeCampos } from "../utils/camposEntidade.js";

/**
 * Posição provisória durante a edição. O índice único (id_formulario, ordem) não deixa dois campos
 * na mesma posição; ao reordenar, os campos são tirados da frente antes de receber a posição final.
 */
const DESLOCAMENTO_ORDEM = 100000;
/** Campos arquivados (removidos, mas com respostas) ficam numa faixa própria, sem colidir */
const ORDEM_ARQUIVADO = 50000;

async function tiposDeFormulario() {
  const permitidos = await CampoModel.getByModalidade("formulario");
  return new Map(permitidos.map((c) => [Number(c.id_campo), c.tipo_campo]));
}

function linhaDoCampo(campo, ordem) {
  return {
    id_campo: Number(campo.id_campo),
    label: String(campo.label).trim(),
    conteudo: conteudoParaTexto(campo.conteudo),
    ordem,
    obrigatorio: Boolean(campo.obrigatorio),
    arquivado: false,
  };
}

class FormularioService {
  async getAll() {
    const formularios = await FormularioModel.getAll();

    const completos = await Promise.all(
      formularios.map(async (f) => {
        const campos = await CampoModel.getByOption("formulario", f.id_formulario);
        return { ...f, campos };
      })
    );

    return completos;
  }

  async getById(id) {
    const idNum = idDaRota(id, "formulário");
    const formulario = await FormularioModel.getById(idNum);
    if (!formulario) throw new NotFoundError("Formulário não encontrado");

    const campos = await CampoModel.getByOption("formulario", idNum);

    return { ...formulario, campos };
  }

  async create(data) {
    const titulo = String(data.titulo ?? "").trim();
    if (titulo.length < 3) throw new ValidationError("O título precisa ter pelo menos 3 letras.");
    validarListaDeCampos(data.campos, { tiposPermitidos: await tiposDeFormulario(), oQue: "formulário" });

    // Tudo ou nada: um campo inválido não deixa um formulário pela metade
    const idFormulario = await knex.transaction(async (trx) => {
      const [id] = await trx("formulario").insert({
        titulo,
        descricao: String(data.descricao ?? "").trim() || null,
        ativo: data.ativo ?? true,
        frequencia: data.frequencia || null,
      });
      // A ordem é a da lista enviada (a "ordem" de cada item é ignorada: repetida, batia no índice único)
      await trx("formulario_campo").insert(
        data.campos.map((c, i) => ({ id_formulario: id, ...linhaDoCampo(c, i) }))
      );
      return id;
    });

    return this.getById(idFormulario);
  }

  /**
   * Edita só o que vier: { ativo } sozinho só liga/desliga (não mexe em frequência nem campos).
   * Campos com "id" são atualizados no lugar (as respostas continuam ligadas a eles); sem "id",
   * são novos; os que sumirem da lista são apagados, ou arquivados se já tiverem respostas.
   */
  async update(id, data) {
    const idNum = idDaRota(id, "formulário");
    const existe = await FormularioModel.getById(idNum);
    if (!existe) throw new NotFoundError("Formulário não encontrado");

    const dados = {};
    if (data.titulo !== undefined) {
      dados.titulo = String(data.titulo).trim();
      if (dados.titulo.length < 3) throw new ValidationError("O título precisa ter pelo menos 3 letras.");
    }
    if (data.descricao !== undefined) dados.descricao = String(data.descricao ?? "").trim() || null;
    if (data.ativo !== undefined) dados.ativo = data.ativo;
    if (data.frequencia !== undefined) dados.frequencia = data.frequencia || null;

    const comCampos = Array.isArray(data.campos);
    if (comCampos) {
      validarListaDeCampos(data.campos, { tiposPermitidos: await tiposDeFormulario(), oQue: "formulário" });
    }

    await knex.transaction(async (trx) => {
      if (Object.keys(dados).length) {
        await trx("formulario").where({ id_formulario: idNum }).update(dados);
      }
      if (!comCampos) return;

      const existentes = await trx("formulario_campo").where({ id_formulario: idNum }).select("id", "arquivado");
      const idsExistentes = new Set(existentes.map((c) => c.id));
      await trx("formulario_campo")
        .where({ id_formulario: idNum })
        .update({ ordem: trx.raw("ordem + ?", [DESLOCAMENTO_ORDEM]) });

      const mantidos = new Set();
      for (const [i, campo] of data.campos.entries()) {
        const idCampo = Number(campo.id ?? campo.id_formulario_campo) || null;
        const linha = linhaDoCampo(campo, i);
        if (idCampo && idsExistentes.has(idCampo) && !mantidos.has(idCampo)) {
          await trx("formulario_campo").where({ id: idCampo }).update(linha);
          mantidos.add(idCampo);
        } else {
          await trx("formulario_campo").insert({ id_formulario: idNum, ...linha });
        }
      }

      for (const cid of [...idsExistentes].filter((x) => !mantidos.has(x))) {
        const temResposta = await trx("formulario_resposta_campo").where({ id_formulario_campo: cid }).first();
        if (temResposta) {
          await trx("formulario_campo").where({ id: cid }).update({ arquivado: true, ordem: ORDEM_ARQUIVADO + cid });
        } else {
          await trx("formulario_campo").where({ id: cid }).del();
        }
      }
    });

    return this.getById(idNum);
  }

  async delete(id) {
    const idNum = idDaRota(id, "formulário");
    const deleted = await FormularioModel.delete(idNum);
    if (!deleted) throw new NotFoundError("Formulário não encontrado");
    return deleted;
  }

  /** Quantas respostas o formulário tem (a tela avisa antes de excluir, porque elas vão junto) */
  async contarRespostas(id) {
    const idNum = idDaRota(id, "formulário");
    const [{ total }] = await knex("formulario_resposta").where({ id_formulario: idNum }).count({ total: "*" });
    return Number(total);
  }
}

export default new FormularioService();
