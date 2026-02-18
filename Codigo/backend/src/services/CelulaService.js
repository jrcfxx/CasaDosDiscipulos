import CelulaModel from "../models/CelulaModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

/**
 * Service para operações relacionadas a células
 * Contém lógica de negócio para gerenciamento de células
 */
const CelulaService = {
  /**
   * Busca todas as células
   * @returns {Promise<Array>} Lista de células
   */
  async getAll() {
    return CelulaModel.getAll();
  },

  /**
   * Busca células ativas
   * @returns {Promise<Array>} Lista de células ativas
   */
  async getActive() {
    return CelulaModel.getActive();
  },

  /**
   * Busca célula por ID
   * @param {number} id - ID da célula
   * @returns {Promise<Object>} Dados da célula
   * @throws {ValidationError} Se ID for inválido
   * @throws {NotFoundError} Se célula não for encontrada
   */
  async getById(id) {
    const numericId = Number(id);

    if (isNaN(numericId) || numericId <= 0) {
      throw new ValidationError("ID inválido");
    }

    const celula = await CelulaModel.getById(numericId);
    if (!celula) {
      throw new NotFoundError("Célula não encontrada");
    }

    return celula;
  },

  /**
   * Busca células de um líder
   * @param {number} idLider - ID do líder
   * @returns {Promise<Array>} Lista de células do líder
   */
  async getByLider(idLider) {
    return CelulaModel.getByLider(idLider);
  },

  /**
   * Cria nova célula
   * @param {Object} data - Dados da célula
   * @returns {Promise<Object>} Célula criada
   * @throws {ValidationError} Se dados forem inválidos
   */
  async create(data) {
    // Validações
    if (!data.nome || data.nome.trim().length < 3) {
      throw new ValidationError(
        "Nome da célula deve ter no mínimo 3 caracteres"
      );
    }

    if (!data.id_lider) {
      throw new ValidationError("Célula deve ter um líder");
    }

    // Cria célula
    const novaCelula = await CelulaModel.create({
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      id_lider: data.id_lider,
      dia_reuniao: data.dia_reuniao || null,
      horario_reuniao: data.horario_reuniao || null,
      local_reuniao: data.local_reuniao?.trim() || null,
      ativa: data.ativa ?? true,
    });

    return novaCelula;
  },

  /**
   * Atualiza dados da célula
   * @param {number} id - ID da célula
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} Célula atualizada
   * @throws {ValidationError} Se dados forem inválidos
   */
  async update(id, data) {
    // Verifica se célula existe
    await this.getById(id);

    const dadosAtualizacao = {};

    if (data.nome !== undefined) {
      if (data.nome.trim().length < 3) {
        throw new ValidationError(
          "Nome da célula deve ter no mínimo 3 caracteres"
        );
      }
      dadosAtualizacao.nome = data.nome.trim();
    }

    if (data.descricao !== undefined)
      dadosAtualizacao.descricao = data.descricao?.trim() || null;

    if (data.id_lider !== undefined) dadosAtualizacao.id_lider = data.id_lider;
    if (data.dia_reuniao !== undefined)
      dadosAtualizacao.dia_reuniao = data.dia_reuniao;
    if (data.horario_reuniao !== undefined)
      dadosAtualizacao.horario_reuniao = data.horario_reuniao;
    if (data.local_reuniao !== undefined)
      dadosAtualizacao.local_reuniao = data.local_reuniao?.trim() || null;
    if (data.ativa !== undefined) dadosAtualizacao.ativa = data.ativa;

    // Atualiza célula
    await CelulaModel.update(id, dadosAtualizacao);

    return this.getById(id);
  },

  /**
   * Remove célula
   * @param {number} id - ID da célula
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.getById(id);
    await CelulaModel.delete(id);
  },
};

export default CelulaService;
