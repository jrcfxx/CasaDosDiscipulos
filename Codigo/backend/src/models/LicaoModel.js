import knex from "../database/index.js";

/**
 * Model para operações de banco de dados relacionadas a lições
 * Responsável apenas por interações diretas com a tabela 'licao'
 */
const LicaoModel = {
  /**
   * Busca todas as lições
   * @returns {Promise<Array>} Lista de lições
   */
  async getAll() {
    return knex("licao")
      .select("id_licao", "titulo", "descricao", "ativo")
      .orderBy("id_licao", "asc");
  },

  /**
   * Busca lição por ID
   * @param {number} id_licao - ID da lição
   * @returns {Promise<Object|null>} Dados da lição ou null
   */
  async getById(id_licao) {
    return knex("licao").where({ id_licao }).first();
  },

  /**
   * Busca apenas lições ativas
   * @returns {Promise<Array>} Lista de lições ativas
   */
  async getActive() {
    return knex("licao")
      .where({ ativo: true })
      .select("id_licao", "titulo", "descricao")
      .orderBy("id_licao", "asc");
  },

  /**
   * Cria nova lição
   * @param {Object} data - Dados da lição
   * @returns {Promise<Object>} Lição criada
   */
  async create(data) {
    const [id_licao] = await knex("licao").insert({
      titulo: data.titulo,
      descricao: data.descricao || null,
      ativo: data.ativo ?? true,
    });
    return this.getById(id_licao);
  },

  /**
   * Atualiza lição
   * @param {number} id_licao - ID da lição
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async update(id_licao, data) {
    return knex("licao").where({ id_licao }).update(data);
  },

  /**
   * Remove lição permanentemente
   * @param {number} id_licao - ID da lição
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async delete(id_licao) {
    return knex("licao").where({ id_licao }).del();
  },

  /**
   * Alterna status ativo/inativo da lição
   * @param {number} id_licao - ID da lição
   * @param {boolean} ativo - Novo status
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async toggleActive(id_licao, ativo) {
    return knex("licao").where({ id_licao }).update({ ativo });
  },
};

export default LicaoModel;
