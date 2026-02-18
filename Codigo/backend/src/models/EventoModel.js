import knex from "../database/index.js";

/**
 * Model para operações de banco de dados relacionadas a eventos
 */
const EventoModel = {
  /**
   * Busca todos os eventos
   * @returns {Promise<Array>} Lista de eventos
   */
  async getAll() {
    return await knex("evento")
      .select("*")
      .orderBy("ordem", "asc")
      .orderBy("data_criacao", "desc");
  },

  /**
   * Busca eventos ativos
   * @returns {Promise<Array>} Lista de eventos ativos
   */
  async getAtivos() {
    return await knex("evento")
      .select("*")
      .where("ativo", true)
      .orderBy("ordem", "asc")
      .orderBy("data_criacao", "desc");
  },

  /**
   * Busca um evento por ID
   * @param {number} id - ID do evento
   * @returns {Promise<Object>} Evento encontrado
   */
  async getById(id) {
    return await knex("evento").select("*").where("id_evento", id).first();
  },

  /**
   * Cria um novo evento
   * @param {Object} evento - Dados do evento
   * @returns {Promise<Object>} Evento criado
   */
  async create(evento) {
    const [id] = await knex("evento").insert(evento).returning("id_evento");
    return await this.getById(id);
  },

  /**
   * Atualiza um evento
   * @param {number} id - ID do evento
   * @param {Object} evento - Dados do evento
   * @returns {Promise<Object>} Evento atualizado
   */
  async update(id, evento) {
    await knex("evento")
      .where("id_evento", id)
      .update({
        ...evento,
        data_atualizacao: knex.fn.now(),
      });
    return await this.getById(id);
  },

  /**
   * Remove um evento
   * @param {number} id - ID do evento
   * @returns {Promise<number>} Número de registros removidos
   */
  async delete(id) {
    return await knex("evento").where("id_evento", id).del();
  },
};

export default EventoModel;
