import knex from "../database/index.js";

/**
 * Model para operações de banco de dados relacionadas a usuários
 * Responsável apenas por interações diretas com a tabela 'usuario'
 */
const UsuarioModel = {
  /**
   * Busca todos os usuários (sem retornar senha)
   * @returns {Promise<Array>} Lista de usuários
   */
  async getAll() {
    return knex("usuario").select(
      "id_usuario",
      "nome",
      "email",
      "tipo",
      "id_nivel",
      "pontuacao",
      "foto",
      "data_criacao",
      "ativo",
      "ultimo_login",
      "lider_celula",
      "lider_ministerio"
    );
  },

  /**
   * Busca usuário por ID
   * @param {number} id_usuario - ID do usuário
   * @returns {Promise<Object|null>} Dados do usuário ou null
   */
  async getById(id_usuario) {
    return knex("usuario")
      .where({ id_usuario })
      .select(
        "id_usuario",
        "nome",
        "email",
        "tipo",
        "id_nivel",
        "pontuacao",
        "foto",
        "data_criacao",
        "ativo",
        "ultimo_login",
        "lider_celula",
        "lider_ministerio"
      )
      .first();
  },

  /**
   * Busca usuário por email (incluindo senha para autenticação)
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} Dados do usuário ou null
   */
  async getByEmail(email) {
    return knex("usuario").where({ email }).first();
  },

  /**
   * Cria novo usuário
   * @param {Object} usuario - Dados do usuário
   * @returns {Promise<Object>} Usuário criado
   */
  async create(usuario) {
    const [id_usuario] = await knex("usuario").insert(usuario);
    return this.getById(id_usuario);
  },

  /**
   * Atualiza dados do usuário
   * @param {number} id_usuario - ID do usuário
   * @param {Object} dados - Dados para atualizar
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async update(id_usuario, dados) {
    return knex("usuario").where({ id_usuario }).update(dados);
  },

  /**
   * Remove usuário (soft delete - apenas desativa)
   * @param {number} id_usuario - ID do usuário
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async softDelete(id_usuario) {
    return knex("usuario").where({ id_usuario }).update({ ativo: false });
  },

  /**
   * Remove usuário permanentemente
   * @param {number} id_usuario - ID do usuário
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async delete(id_usuario) {
    return knex("usuario").where({ id_usuario }).del();
  },

  /**
   * Atualiza timestamp do último login
   * @param {number} id_usuario - ID do usuário
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async updateLastLogin(id_usuario) {
    return knex("usuario")
      .where({ id_usuario })
      .update({ ultimo_login: knex.fn.now() });
  },

  /**
   * Atualiza pontuação do usuário
   * @param {number} id_usuario - ID do usuário
   * @param {number} pontos - Pontos a adicionar (pode ser negativo)
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async updateScore(id_usuario, pontos) {
    return knex("usuario").where({ id_usuario }).increment("pontuacao", pontos);
  },
};

export default UsuarioModel;
