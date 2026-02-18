// src/repository/QuizRespostaRepository.js
import knex from "../database/index.js";

class QuizRespostaRepository {

  async insertMany(rows, trx) {
    return trx("quiz_resposta").insert(rows);
  }

  async findByQuiz(quizId) {
    return knex("quiz_resposta")
      .where({ id_quiz: quizId })
      .orderBy("data_resposta", "desc");
  }

  async findByUsuarioAndQuiz(usuarioId, quizId) {
    return knex("quiz_resposta")
      .where({ id_usuario: usuarioId, id_quiz: quizId })
      .orderBy("data_resposta", "desc");
  }
}

export default new QuizRespostaRepository();
