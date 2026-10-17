import FormularioRespostaModel from "../models/FormularioRespostaModel.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/AppError.js";
import knex from "../database/index.js";
import { USER_TYPES } from "../utils/constants.js";

/**
 * Service para gerenciar respostas de formulário
 */
const FormularioRespostaService = {
  /**
   * Lista todas as respostas de formulário
   * @returns {Promise<Array>} Lista de respostas
   */
  async getAll() {
    return FormularioRespostaModel.getAll();
  },

  /**
   * Busca resposta por ID
   * @param {number} id - ID da resposta
   * @returns {Promise<Object>} Resposta encontrada
   * @throws {NotFoundError} Se resposta não encontrada
   */
  async getById(id) {
    const resposta = await FormularioRespostaModel.getById(id);
    if (!resposta) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }

    // Buscar campos preenchidos
    const campos = await FormularioRespostaModel.getCampos(id);
    return { ...resposta, campos };
  },

  /**
   * Busca respostas de um formulário específico
   * @param {number} idFormulario - ID do formulário
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByFormulario(idFormulario) {
    return FormularioRespostaModel.getByFormulario(idFormulario);
  },

  /**
   * Busca respostas de uma célula específica
   * @param {number} idCelula - ID da célula
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByCelula(idCelula) {
    return FormularioRespostaModel.getByCelula(idCelula);
  },

  /**
   * Cria nova resposta de formulário
   * @param {Object} data - Dados da resposta { id_usuario?, id_formulario, id_celula, campos: [] }
   * @returns {Promise<Object>} Resposta criada
   * @throws {ValidationError} Se dados inválidos
   */
  async create(data, tipoUsuario = null) {
    const { id_usuario, id_formulario, id_celula, campos } = data;

    // Validações básicas
    if (!id_formulario) {
      throw new ValidationError("ID do formulário é obrigatório");
    }

    if (!id_celula) {
      throw new ValidationError("ID da célula é obrigatório");
    }

    if (!campos || !Array.isArray(campos) || campos.length === 0) {
      throw new ValidationError(
        "Campos de resposta são obrigatórios e devem ser um array"
      );
    }

    if (!id_usuario) {
      throw new ValidationError("ID do usuário (líder) é obrigatório");
    }

    // Líder só responde pela própria célula; admin pode qualquer uma
    if (tipoUsuario !== USER_TYPES.ADMIN) {
      const vinculo = await knex("celula_lider")
        .where({ id_usuario, id_celula })
        .first();
      if (!vinculo) {
        throw new ForbiddenError(
          "Você só pode responder formulários das células das quais é líder"
        );
      }
    }

    const id_resposta = await knex.transaction(async (trx) => {
      const [novoId] = await trx("formulario_resposta").insert({
        id_formulario,
        id_usuario,
        id_celula,
        data_resposta: new Date(),
      });

      for (const campo of campos) {
        if (!campo.id_formulario_campo) {
          throw new ValidationError(
            "Cada campo deve ter id_formulario_campo definido"
          );
        }

        await trx("formulario_resposta_campo").insert({
          id_resposta: novoId,
          id_formulario_campo: campo.id_formulario_campo,
          valor: campo.resposta != null ? String(campo.resposta) : null,
        });
      }

      return novoId;
    });

    return this.getById(id_resposta);
  },

  /**
   * Atualiza resposta existente
   * @param {number} id - ID da resposta
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Object>} Resposta atualizada
   * @throws {NotFoundError} Se resposta não encontrada
   */
  async update(id, data) {
    const exists = await FormularioRespostaModel.getById(id);
    if (!exists) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }

    // Permitir atualização apenas de data_resposta
    const updateData = {};
    if (data.data_resposta) {
      updateData.data_resposta = data.data_resposta;
    }

    const updated = await FormularioRespostaModel.update(id, updateData);
    return updated;
  },

  /**
   * Remove resposta
   * @param {number} id - ID da resposta
   * @returns {Promise<void>}
   * @throws {NotFoundError} Se resposta não encontrada
   */
  async delete(id) {
    const exists = await FormularioRespostaModel.getById(id);
    if (!exists) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }

    await FormularioRespostaModel.delete(id);
  },
};

export default FormularioRespostaService;
