import knex from "../database/index.js";

/**
 * Model para questões de quiz
 * Gerencia operações CRUD para a tabela quiz_questao
 */
const QuizQuestaoModel = {
  /**
   * Busca todas as questões
   * @returns {Promise<Array>} Lista de questões
   */
  async getAll() {
    return knex("quiz_questao").select("*").orderBy("ordem");
  },

  /**
   * Busca questão por ID
   * @param {number} id_questao - ID da questão
   * @returns {Promise<Object|null>} Questão encontrada ou null
   */
  async getById(id_questao) {
    return knex("quiz_questao").where({ id_questao }).first();
  },

  /**
   * Busca questões de um quiz específico
   * @param {number} id_quiz - ID do quiz
   * @returns {Promise<Array>} Lista de questões do quiz
   */
  async getByQuiz(id_quiz) {
    return knex("quiz_questao").where({ id_quiz }).orderBy("ordem");
  },

  /**
   * Cria nova questão
   * @param {Object} data - Dados da questão
   * @returns {Promise<Object>} Questão criada
   */
  async create(data) {
    const [id_questao] = await knex("quiz_questao").insert(data);
    return this.getById(id_questao);
  },

  /**
   * Atualiza questão existente
   * @param {number} id_questao - ID da questão
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Object|null>} Questão atualizada ou null
   */
  async update(id_questao, data) {
    const updated = await knex("quiz_questao")
      .where({ id_questao })
      .update(data);

    if (!updated) return null;
    return this.getById(id_questao);
  },

  /**
   * Remove questão
   * @param {number} id_questao - ID da questão
   * @returns {Promise<number>} Número de registros removidos
   */
  async delete(id_questao) {
    return knex("quiz_questao").where({ id_questao }).del();
  },

  /**
   * Remove todas as questões de um quiz
   * @param {number} id_quiz - ID do quiz
   * @returns {Promise<number>} Número de registros removidos
   */
  async deleteByQuiz(id_quiz) {
    return knex("quiz_questao").where({ id_quiz }).del();
  },
};

export default QuizQuestaoModel;
