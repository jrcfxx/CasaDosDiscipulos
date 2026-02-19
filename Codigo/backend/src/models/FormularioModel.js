import knex from "../database/index.js";

/**
 * Model para operações de banco de dados relacionadas a formulários
 * Responsável apenas por interações diretas com a tabela 'formulario'
 */
const FormularioModel = {
  /**
   * Busca todos os formulários
   * @returns {Promise<Array>} Lista de formulários
   */
  async getAll() {
    return knex("formulario")
      .select("id_formulario", "titulo", "descricao", "ativo", "frequencia")
      .orderBy("id_formulario", "asc");
  },

  /**
   * Busca formulário por ID
   * @param {number} id_formulario - ID do formulário
   * @returns {Promise<Object|null>} Dados do formulário ou null
   */
  async getById(id_formulario) {
    return knex("formulario").where({ id_formulario }).first();
  },

  /**
   * Busca apenas formulários ativos
   * @returns {Promise<Array>} Lista de formulários ativos
   */
  async getActive() {
    return knex("formulario")
      .where({ ativo: true })
      .select("id_formulario", "titulo", "descricao")
      .orderBy("id_formulario", "asc");
  },

  /**
   * Cria novo formulário
   * @param {Object} data - Dados do formulário
   * @returns {Promise<Object>} Formulário criado
   */
  async create(data) {
    const [id_formulario] = await knex("formulario").insert({
      titulo: data.titulo,
      descricao: data.descricao || null,
      ativo: data.ativo ?? true,
      frequencia: data.frequencia || null,
    });
    return this.getById(id_formulario);
  },

  /**
   * Atualiza formulário
   * @param {number} id_formulario - ID do formulário
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async update(id_formulario, data) {
    return knex("formulario").where({ id_formulario }).update(data);
  },

  /**
   * Remove formulário permanentemente
   * @param {number} id_formulario - ID do formulário
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async delete(id_formulario) {
    return knex("formulario").where({ id_formulario }).del();
  },

  /**
   * Alterna status ativo/inativo do formulário
   * @param {number} id_formulario - ID do formulário
   * @param {boolean} ativo - Novo status
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async toggleActive(id_formulario, ativo) {
    return knex("formulario").where({ id_formulario }).update({ ativo });
  },
};

export default FormularioModel;
