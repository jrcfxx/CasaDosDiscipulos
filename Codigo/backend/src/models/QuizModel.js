import knex from "../database/index.js";

/**
 * Model para operações de banco de dados relacionadas a quizzes
 * Responsável apenas por interações diretas com a tabela 'quiz'
 */
const QuizModel = {
  /**
   * Busca todos os quizzes
   * @returns {Promise<Array>} Lista de quizzes
   */
  async getAll() {
    return knex("quiz")
      .select("id_quiz", "id_modulo", "titulo", "descricao", "ativo")
      .orderBy("id_quiz", "asc");
  },

  /**
   * Busca campos de um quiz
   * @param {number} id_quiz - ID do quiz
   * @returns {Promise<Array>} Lista de campos do quiz
   */
  async getCampos(id_quiz) {
    return knex("quiz_campo")
      .join(
        "campo_personalizado",
        "quiz_campo.id_campo",
        "campo_personalizado.id_campo"
      )
      .where("quiz_campo.id_quiz", id_quiz)
      .select(
        "quiz_campo.id",
        "quiz_campo.id_campo",
        "campo_personalizado.tipo_campo",
        "quiz_campo.label",
        "quiz_campo.conteudo",
        "quiz_campo.ordem"
      )
      .orderBy("quiz_campo.ordem", "asc");
  },

  /**
   * Busca quiz por ID
   * @param {number} id_quiz - ID do quiz
   * @returns {Promise<Object|null>} Dados do quiz ou null
   */
  async getById(id_quiz) {
    return knex("quiz").where({ id_quiz }).first();
  },

  /**
   * Busca apenas quizzes ativos
   * @returns {Promise<Array>} Lista de quizzes ativos
   */
  async getActive() {
    return knex("quiz")
      .where({ ativo: true })
      .select("id_quiz", "id_modulo", "titulo", "descricao")
      .orderBy("id_quiz", "asc");
  },

  /**
   * Cria novo quiz
   * @param {Object} data - Dados do quiz
   * @returns {Promise<Object>} Quiz criado
   */
  async create(data) {
    const [id_quiz] = await knex("quiz").insert({
      id_modulo: data.id_modulo,
      titulo: data.titulo,
      descricao: data.descricao || null,
      ativo: data.ativo ?? true,
    });
    return this.getById(id_quiz);
  },

  /**
   * Atualiza quiz
   * @param {number} id_quiz - ID do quiz
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async update(id_quiz, data) {
    return knex("quiz").where({ id_quiz }).update(data);
  },

  /**
   * Remove quiz permanentemente
   * @param {number} id_quiz - ID do quiz
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async delete(id_quiz) {
    return knex("quiz").where({ id_quiz }).del();
  },

  /**
   * Alterna status ativo/inativo do quiz
   * @param {number} id_quiz - ID do quiz
   * @param {boolean} ativo - Novo status
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async toggleActive(id_quiz, ativo) {
    return knex("quiz").where({ id_quiz }).update({ ativo });
  },
};

export default QuizModel;
