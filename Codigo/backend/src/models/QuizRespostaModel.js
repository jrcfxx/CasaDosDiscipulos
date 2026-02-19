import knex from "../database/index.js";

/**
 * Model para respostas de quiz
 * Gerencia operações CRUD para a tabela quiz_resposta
 */
const QuizRespostaModel = {
  /**
   * Busca todas as respostas
   * @returns {Promise<Array>} Lista de respostas
   */
  async getAll() {
    return knex("quiz_resposta")
      .select(
        "quiz_resposta.*",
        "quiz_questao.enunciado",
        "quiz_questao.tipo_questao",
        "usuario.nome as nome_usuario"
      )
      .leftJoin(
        "quiz_questao",
        "quiz_resposta.id_questao",
        "quiz_questao.id_questao"
      )
      .leftJoin("usuario", "quiz_resposta.id_usuario", "usuario.id_usuario")
      .orderBy("quiz_resposta.respondido_em", "desc");
  },

  /**
   * Busca resposta por ID
   * @param {number} id_resposta - ID da resposta
   * @returns {Promise<Object|null>} Resposta encontrada ou null
   */
  async getById(id_resposta) {
    return knex("quiz_resposta")
      .select(
        "quiz_resposta.*",
        "quiz_questao.enunciado",
        "quiz_questao.tipo_questao",
        "quiz_questao.pontos as pontos_questao",
        "usuario.nome as nome_usuario"
      )
      .leftJoin(
        "quiz_questao",
        "quiz_resposta.id_questao",
        "quiz_questao.id_questao"
      )
      .leftJoin("usuario", "quiz_resposta.id_usuario", "usuario.id_usuario")
      .where({ "quiz_resposta.id_resposta": id_resposta })
      .first();
  },

  /**
   * Busca respostas de um usuário para um quiz específico
   * @param {number} id_usuario - ID do usuário
   * @param {number} id_quiz - ID do quiz
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByUsuarioAndQuiz(id_usuario, id_quiz) {
    return knex("quiz_resposta")
      .select(
        "quiz_resposta.*",
        "quiz_questao.enunciado",
        "quiz_questao.tipo_questao",
        "quiz_questao.pontos as pontos_questao",
        "quiz_questao.ordem"
      )
      .join(
        "quiz_questao",
        "quiz_resposta.id_questao",
        "quiz_questao.id_questao"
      )
      .where({
        "quiz_resposta.id_usuario": id_usuario,
        "quiz_questao.id_quiz": id_quiz,
      })
      .orderBy("quiz_questao.ordem");
  },

  /**
   * Busca todas as respostas de um quiz (todas questões, todos usuários)
   * @param {number} id_quiz - ID do quiz
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByQuiz(id_quiz) {
    return knex("quiz_resposta")
      .select(
        "quiz_resposta.*",
        "quiz_questao.enunciado",
        "quiz_questao.tipo_questao",
        "usuario.nome as nome_usuario",
        "usuario.email as email_usuario"
      )
      .join(
        "quiz_questao",
        "quiz_resposta.id_questao",
        "quiz_questao.id_questao"
      )
      .leftJoin("usuario", "quiz_resposta.id_usuario", "usuario.id_usuario")
      .where({ "quiz_questao.id_quiz": id_quiz })
      .orderBy(["usuario.nome", "quiz_questao.ordem"]);
  },

  /**
   * Busca resposta específica de um usuário para uma questão
   * @param {number} id_usuario - ID do usuário
   * @param {number} id_questao - ID da questão
   * @returns {Promise<Object|null>} Resposta encontrada ou null
   */
  async getByUsuarioAndQuestao(id_usuario, id_questao) {
    return knex("quiz_resposta").where({ id_usuario, id_questao }).first();
  },

  /**
   * Calcula pontuação total de um usuário em um quiz
   * @param {number} id_usuario - ID do usuário
   * @param {number} id_quiz - ID do quiz
   * @returns {Promise<Object>} Objeto com total de pontos e quantidade de questões
   */
  async calcularPontuacao(id_usuario, id_quiz) {
    const resultado = await knex("quiz_resposta")
      .join(
        "quiz_questao",
        "quiz_resposta.id_questao",
        "quiz_questao.id_questao"
      )
      .where({
        "quiz_resposta.id_usuario": id_usuario,
        "quiz_questao.id_quiz": id_quiz,
      })
      .sum("quiz_resposta.pontos_obtidos as total_pontos")
      .count("* as total_questoes")
      .first();

    return {
      pontos: resultado.total_pontos || 0,
      questoes_respondidas: resultado.total_questoes || 0,
    };
  },

  /**
   * Cria nova resposta
   * @param {Object} data - Dados da resposta
   * @returns {Promise<Object>} Resposta criada
   */
  async create(data) {
    const [id_resposta] = await knex("quiz_resposta").insert(data);
    return this.getById(id_resposta);
  },

  /**
   * Cria múltiplas respostas em uma transação
   * @param {Array} rows - Array de respostas
   * @param {Object} trx - Objeto de transação Knex (opcional)
   * @returns {Promise<Array>} IDs inseridos
   */
  async createMany(rows, trx = null) {
    const executor = trx || knex;
    return executor("quiz_resposta").insert(rows);
  },

  /**
   * Atualiza resposta existente
   * @param {number} id_resposta - ID da resposta
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Object|null>} Resposta atualizada ou null
   */
  async update(id_resposta, data) {
    const updated = await knex("quiz_resposta")
      .where({ id_resposta })
      .update(data);

    if (!updated) return null;
    return this.getById(id_resposta);
  },

  /**
   * Remove resposta
   * @param {number} id_resposta - ID da resposta
   * @returns {Promise<number>} Número de registros removidos
   */
  async delete(id_resposta) {
    return knex("quiz_resposta").where({ id_resposta }).del();
  },

  /**
   * Remove todas as respostas de um usuário em um quiz
   * @param {number} id_usuario - ID do usuário
   * @param {number} id_quiz - ID do quiz
   * @param {Object} trx - Transação Knex (opcional)
   * @returns {Promise<number>} Número de registros removidos
   */
  async deleteByUsuarioAndQuiz(id_usuario, id_quiz, trx = null) {
    const executor = trx || knex;
    const ids = await executor("quiz_resposta")
      .join("quiz_questao", "quiz_resposta.id_questao", "quiz_questao.id_questao")
      .where({
        "quiz_resposta.id_usuario": id_usuario,
        "quiz_questao.id_quiz": id_quiz,
      })
      .select("quiz_resposta.id_resposta");
    if (ids.length === 0) return 0;
    return executor("quiz_resposta")
      .whereIn(
        "id_resposta",
        ids.map((r) => r.id_resposta)
      )
      .del();
  },
};

export default QuizRespostaModel;
