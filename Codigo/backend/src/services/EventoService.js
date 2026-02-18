import EventoModel from "../models/EventoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

/**
 * Service para operações relacionadas a eventos
 * Contém lógica de negócio para gerenciamento de eventos
 */
class EventoService {
  /**
   * Busca todos os eventos
   * @returns {Promise<Array>} Lista de eventos
   */
  async getAll() {
    return await EventoModel.getAll();
  }

  /**
   * Busca eventos ativos
   * @returns {Promise<Array>} Lista de eventos ativos
   */
  async getAtivos() {
    return await EventoModel.getAtivos();
  }

  /**
   * Busca evento por ID
   * @param {number} id - ID do evento
   * @returns {Promise<Object>} Evento encontrado
   * @throws {ValidationError} Se ID for inválido
   * @throws {NotFoundError} Se evento não for encontrado
   */
  async getById(id) {
    const parsedId = Number(id);

    if (isNaN(parsedId) || parsedId <= 0) {
      throw new ValidationError("ID inválido");
    }

    const evento = await EventoModel.getById(parsedId);
    if (!evento) {
      throw new NotFoundError("Evento não encontrado");
    }

    return evento;
  }

  /**
   * Cria um novo evento
   * @param {Object} evento - Dados do evento
   * @returns {Promise<Object>} Evento criado
   * @throws {ValidationError} Se dados forem inválidos
   */
  async create(evento) {
    if (!evento.imagem_url) {
      throw new ValidationError("Imagem é obrigatória");
    }

    return await EventoModel.create({
      titulo: evento.titulo || null,
      descricao: evento.descricao || null,
      imagem_url: evento.imagem_url,
      ordem: evento.ordem || 0,
      ativo: evento.ativo !== undefined ? evento.ativo : true,
    });
  }

  /**
   * Atualiza um evento
   * @param {number} id - ID do evento
   * @param {Object} evento - Dados do evento
   * @returns {Promise<Object>} Evento atualizado
   * @throws {ValidationError} Se dados forem inválidos
   * @throws {NotFoundError} Se evento não for encontrado
   */
  async update(id, evento) {
    const parsedId = Number(id);

    if (isNaN(parsedId) || parsedId <= 0) {
      throw new ValidationError("ID inválido");
    }

    const eventoExistente = await EventoModel.getById(parsedId);
    if (!eventoExistente) {
      throw new NotFoundError("Evento não encontrado");
    }

    const dadosAtualizados = {};
    if (evento.titulo !== undefined) dadosAtualizados.titulo = evento.titulo;
    if (evento.descricao !== undefined)
      dadosAtualizados.descricao = evento.descricao;
    if (evento.imagem_url !== undefined)
      dadosAtualizados.imagem_url = evento.imagem_url;
    if (evento.ordem !== undefined) dadosAtualizados.ordem = evento.ordem;
    if (evento.ativo !== undefined) dadosAtualizados.ativo = evento.ativo;

    return await EventoModel.update(parsedId, dadosAtualizados);
  }

  /**
   * Remove um evento
   * @param {number} id - ID do evento
   * @returns {Promise<void>}
   * @throws {ValidationError} Se ID for inválido
   * @throws {NotFoundError} Se evento não for encontrado
   */
  async delete(id) {
    const parsedId = Number(id);

    if (isNaN(parsedId) || parsedId <= 0) {
      throw new ValidationError("ID inválido");
    }

    const evento = await EventoModel.getById(parsedId);
    if (!evento) {
      throw new NotFoundError("Evento não encontrado");
    }

    await EventoModel.delete(parsedId);
  }
}

export default new EventoService();
