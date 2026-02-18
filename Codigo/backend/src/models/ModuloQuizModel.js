import knex from "../database/index.js";

/**
 * Model para operações de vinculação entre módulos e quizzes
 * Gerencia o relacionamento N:N
 */
const ModuloQuizModel = {
  /**
   * Vincula um quiz a um módulo
   * @param {number} idModulo - ID do módulo
   * @param {number} idQuiz - ID do quiz
   * @returns {Promise<Object>} Vínculo criado
   */
  async vincular(idModulo, idQuiz) {
    const [id] = await knex("modulo_quiz").insert({
      id_modulo: idModulo,
      id_quiz: idQuiz,
    });

    return knex("modulo_quiz").where({ id }).first();
  },

  /**
   * Remove vínculo entre módulo e quiz
   * @param {number} idModulo - ID do módulo
   * @param {number} idQuiz - ID do quiz
   * @returns {Promise<number>} Número de registros removidos
   */
  async desvincular(idModulo, idQuiz) {
    return knex("modulo_quiz")
      .where({ id_modulo: idModulo, id_quiz: idQuiz })
      .delete();
  },

  /**
   * Busca quiz vinculado a um módulo
   * @param {number} idModulo - ID do módulo
   * @returns {Promise<Object|null>} Quiz vinculado ou null
   */
  async getQuizByModulo(idModulo) {
    try {
      // Primeiro verifica se há vínculo
      const vinculo = await knex("modulo_quiz")
        .where({ id_modulo: idModulo })
        .first();

      if (!vinculo) {
        return null;
      }

      // Busca os dados do quiz
      const quiz = await knex("quiz")
        .where({ id_quiz: vinculo.id_quiz })
        .first();

      if (!quiz) {
        return null;
      }

      return {
        ...quiz,
        vinculado_em: vinculo.vinculado_em,
      };
    } catch (error) {
      console.error("Erro ao buscar quiz vinculado:", error);
      throw error;
    }
  },

  /**
   * Busca todos os módulos vinculados a um quiz
   * @param {number} idQuiz - ID do quiz
   * @returns {Promise<Array>} Lista de módulos
   */
  async getModulosByQuiz(idQuiz) {
    return knex("modulo_quiz")
      .where({ id_quiz: idQuiz })
      .join("modulo", "modulo_quiz.id_modulo", "modulo.id_modulo")
      .select("modulo.*", "modulo_quiz.vinculado_em");
  },

  /**
   * Verifica se já existe vínculo
   * @param {number} idModulo - ID do módulo
   * @param {number} idQuiz - ID do quiz
   * @returns {Promise<boolean>} True se existe vínculo
   */
  async existeVinculo(idModulo, idQuiz) {
    const resultado = await knex("modulo_quiz")
      .where({ id_modulo: idModulo, id_quiz: idQuiz })
      .first();

    return Boolean(resultado);
  },

  /**
   * Atualiza o quiz vinculado a um módulo
   * Remove vínculo antigo e cria novo
   * @param {number} idModulo - ID do módulo
   * @param {number} novoIdQuiz - ID do novo quiz
   * @returns {Promise<Object>} Novo vínculo criado
   */
  async atualizarVinculo(idModulo, novoIdQuiz) {
    await knex("modulo_quiz").where({ id_modulo: idModulo }).delete();

    if (novoIdQuiz) {
      return this.vincular(idModulo, novoIdQuiz);
    }

    return null;
  },
};

export default ModuloQuizModel;
