import FormularioRespostaModel from "../models/FormularioRespostaModel.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/AppError.js";
import knex from "../database/index.js";
import { USER_TYPES } from "../utils/constants.js";

/**
 * Service para gerenciar respostas de formulário
 */
const FormularioRespostaService = {
  /**
   * Células que o usuário pode ver/alterar. null = todas (administrador).
   * Líder enxerga apenas as células em que está em celula_lider.
   */
  async _celulasPermitidas(usuario) {
    if (usuario?.tipo === USER_TYPES.ADMIN) return null;
    if (!usuario?.id_usuario) return new Set();
    const rows = await knex("celula_lider")
      .where({ id_usuario: usuario.id_usuario })
      .select("id_celula");
    return new Set(rows.map((r) => Number(r.id_celula)));
  },

  _filtrar(rows, permitidas) {
    if (!permitidas) return rows;
    return rows.filter((r) => permitidas.has(Number(r.id_celula)));
  },

  async _assertAcesso(resposta, usuario) {
    const permitidas = await this._celulasPermitidas(usuario);
    if (permitidas && !permitidas.has(Number(resposta.id_celula))) {
      // 404 em vez de 403: não revela que o relatório de outra célula existe
      throw new NotFoundError("Resposta de formulário não encontrada");
    }
  },

  /**
   * Lista as respostas de formulário visíveis para o usuário
   * @returns {Promise<Array>} Lista de respostas
   */
  async getAll(usuario = null) {
    const rows = await FormularioRespostaModel.getAll();
    return this._filtrar(rows, await this._celulasPermitidas(usuario));
  },

  /**
   * Busca resposta por ID
   * @param {number} id - ID da resposta
   * @returns {Promise<Object>} Resposta encontrada
   * @throws {NotFoundError} Se resposta não encontrada
   */
  async getById(id, usuario = null) {
    const resposta = await FormularioRespostaModel.getById(id);
    if (!resposta) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }
    if (usuario) await this._assertAcesso(resposta, usuario);

    // Buscar campos preenchidos
    const campos = await FormularioRespostaModel.getCampos(id);
    return { ...resposta, campos };
  },

  /**
   * Busca respostas de um formulário específico
   * @param {number} idFormulario - ID do formulário
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByFormulario(idFormulario, usuario = null) {
    const rows = await FormularioRespostaModel.getByFormulario(idFormulario);
    return this._filtrar(rows, await this._celulasPermitidas(usuario));
  },

  /**
   * Busca respostas de uma célula específica
   * @param {number} idCelula - ID da célula
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByCelula(idCelula, usuario = null) {
    const permitidas = await this._celulasPermitidas(usuario);
    if (permitidas && !permitidas.has(Number(idCelula))) return [];
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
  async update(id, data, usuario = null) {
    const exists = await FormularioRespostaModel.getById(id);
    if (!exists) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }
    await this._assertAcesso(exists, usuario);

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
  async delete(id, usuario = null) {
    const exists = await FormularioRespostaModel.getById(id);
    if (!exists) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }
    await this._assertAcesso(exists, usuario);

    await FormularioRespostaModel.delete(id);
  },
};

export default FormularioRespostaService;
