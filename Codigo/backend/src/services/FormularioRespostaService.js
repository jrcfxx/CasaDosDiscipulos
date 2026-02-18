import FormularioRespostaModel from "../models/FormularioRespostaModel.js";
import { ValidationError, NotFoundError } from "../utils/AppError.js";

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
   * @param {Object} data - Dados da resposta { id_formulario, id_celula, campos: [] }
   * @returns {Promise<Object>} Resposta criada
   * @throws {ValidationError} Se dados inválidos
   */
  async create(data) {
    const { id_formulario, id_celula, campos } = data;

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

    // Criar resposta principal
    const respostaData = {
      id_formulario,
      id_celula,
      data_resposta: new Date(),
    };

    const resposta = await FormularioRespostaModel.create(respostaData);

    // Criar campos preenchidos
    for (const campo of campos) {
      if (!campo.id_formulario_campo) {
        throw new ValidationError(
          "Cada campo deve ter id_formulario_campo definido"
        );
      }

      await FormularioRespostaModel.createCampo({
        id_resposta: resposta.id_resposta,
        id_formulario_campo: campo.id_formulario_campo,
        resposta: campo.resposta || null,
      });
    }

    // Retornar resposta completa com campos
    return this.getById(resposta.id_resposta);
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
