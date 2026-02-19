import knex from "../database/index.js";

/**
 * Model para operações de banco de dados relacionadas a módulos
 * Responsável apenas por interações diretas com a tabela 'modulo'
 */
const ModuloModel = {
  /**
   * Busca todos os módulos
   * @returns {Promise<Array>} Lista de módulos
   */
  async getAll() {
    return knex("modulo")
      .select(
        "id_modulo",
        "titulo",
        "descricao",
        "ordem",
        "ativo",
        "obrigatorio",
        "id_nivel",
        "created_at",
        "updated_at"
      )
      .orderBy("ordem", "asc");
  },

  /**
   * Busca módulo por ID
   * @param {number} id - ID do módulo
   * @returns {Promise<Object|null>} Dados do módulo ou null
   */
  async getById(id) {
    return knex("modulo").where({ id_modulo: id }).first();
  },

  /**
   * Busca apenas módulos ativos
   * @returns {Promise<Array>} Lista de módulos ativos
   */
  async getActive() {
    return knex("modulo")
      .where({ ativo: true })
      .select("id_modulo", "titulo", "descricao", "ordem", "obrigatorio", "id_nivel")
      .orderBy("ordem", "asc");
  },

  /**
   * Cria novo módulo
   * @param {Object} data - Dados do módulo
   * @returns {Promise<Object>} Módulo criado
   */
  async create(data) {
    const [id_modulo] = await knex("modulo").insert({
      titulo: data.titulo,
      descricao: data.descricao || null,
      ordem: data.ordem || 0,
      ativo: data.ativo ?? true,
      obrigatorio: data.obrigatorio ?? true,
      id_nivel: data.id_nivel ?? null,
    });

    return this.getById(id_modulo);
  },

  /**
   * Atualiza módulo
   * @param {number} id - ID do módulo
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async update(id, data) {
    return knex("modulo").where({ id_modulo: id }).update(data);
  },

  /**
   * Remove módulo permanentemente
   * @param {number} id - ID do módulo
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async delete(id) {
    return knex("modulo").where({ id_modulo: id }).del();
  },

  /**
   * Alterna status ativo/inativo do módulo
   * @param {number} id - ID do módulo
   * @param {boolean} ativo - Novo status
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async toggleActive(id, ativo) {
    return knex("modulo").where({ id_modulo: id }).update({ ativo });
  },
};

export default ModuloModel;
