import QuizModel from "../models/QuizModel.js";
import QuizQuestaoModel from "../models/QuizQuestaoModel.js";
import CampoModel from "../models/CampoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

/**
 * Service para operações relacionadas a quizzes
 * Contém lógica de negócio para gerenciamento de quizzes e suas questões
 */
class QuizService {
  /**
   * Busca todos os quizzes com suas questões e campos
   * @returns {Promise<Array>} Lista de quizzes com questões e campos
   */
  async getAll() {
    const quizzes = await QuizModel.getAll();

    const quizzesComDados = await Promise.all(
      quizzes.map(async (quiz) => {
        const questoes = await QuizQuestaoModel.getByQuiz(quiz.id_quiz);
        const campos = await CampoModel.getByEntity("quiz", quiz.id_quiz);
        return { ...quiz, questoes, campos };
      })
    );

    return quizzesComDados;
  }

  /**
   * Busca quiz por ID com suas questões e campos
   * @param {number} id - ID do quiz
   * @returns {Promise<Object>} Quiz com questões e campos
   * @throws {ValidationError} Se ID for inválido
   * @throws {NotFoundError} Se quiz não for encontrado
   */
  async getById(id) {
    const parsedId = Number(id);

    if (isNaN(parsedId) || parsedId <= 0) {
      throw new ValidationError("ID inválido");
    }

    const quiz = await QuizModel.getById(parsedId);
    if (!quiz) {
      throw new NotFoundError("Quiz não encontrado");
    }

    const questoes = await QuizQuestaoModel.getByQuiz(parsedId);
    const campos = await CampoModel.getByEntity("quiz", parsedId);

    return { ...quiz, questoes, campos };
  }

  /**
   * Busca apenas quizzes ativos
   * @returns {Promise<Array>} Lista de quizzes ativos com questões e campos
   */
  async getActive() {
    const quizzes = await QuizModel.getActive();

    const quizzesComDados = await Promise.all(
      quizzes.map(async (quiz) => {
        const questoes = await QuizQuestaoModel.getByQuiz(quiz.id_quiz);
        const campos = await CampoModel.getByEntity("quiz", quiz.id_quiz);
        return { ...quiz, questoes, campos };
      })
    );

    return quizzesComDados;
  }

  /**
   * Cria quiz com campos vinculados
   * @param {Object} data - Dados do quiz
   * @returns {Promise<Object>} Quiz criado
   * @throws {ValidationError} Se dados forem inválidos
   */
  async create(data) {
    // Validações
    if (!data.titulo || data.titulo.trim().length < 3) {
      throw new ValidationError(
        "Título do quiz deve ter no mínimo 3 caracteres"
      );
    }

    // Cria o quiz (id_modulo agora é opcional - vinculação via modulo_quiz)
    const novoQuiz = await QuizModel.create({
      id_modulo: data.id_modulo || null,
      titulo: data.titulo.trim(),
      descricao: data.descricao?.trim() || null,
      ativo: data.ativo ?? true,
    });

    // Vincula campos se fornecidos
    if (data.campos && Array.isArray(data.campos) && data.campos.length > 0) {
      for (const campo of data.campos) {
        if (!campo.id_campo) {
          throw new ValidationError("Cada campo deve ter um id_campo válido");
        }

        await CampoModel.linkToEntity(
          "quiz",
          novoQuiz.id_quiz,
          campo.id_campo,
          campo.conteudo || "",
          campo.label || "",
          campo.ordem || 0
        );
      }
    }

    // Busca campos vinculados
    const camposVinculados = await CampoModel.getByEntity(
      "quiz",
      novoQuiz.id_quiz
    );

    return { ...novoQuiz, questoes: [], campos: camposVinculados };
  }

  /**
   * Atualiza quiz e seus campos
   * @param {number} id - ID do quiz
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} Quiz atualizado
   * @throws {NotFoundError} Se quiz não for encontrado
   */
  async update(id, data) {
    // Verifica se quiz existe
    await this.getById(id);

    const dadosAtualizacao = {};

    if (data.titulo !== undefined) {
      if (data.titulo.trim().length < 3) {
        throw new ValidationError("Título deve ter no mínimo 3 caracteres");
      }
      dadosAtualizacao.titulo = data.titulo.trim();
    }
    if (data.descricao !== undefined)
      dadosAtualizacao.descricao = data.descricao?.trim() || null;
    if (data.ativo !== undefined) dadosAtualizacao.ativo = data.ativo;
    if (data.id_modulo !== undefined)
      dadosAtualizacao.id_modulo = data.id_modulo;

    // Atualiza quiz
    await QuizModel.update(id, dadosAtualizacao);

    // Se campos foram enviados, atualiza vínculos
    if (data.campos && Array.isArray(data.campos)) {
      // Remove campos antigos
      await CampoModel.unlinkAllFromEntity("quiz", id);

      // Adiciona novos campos
      for (const campo of data.campos) {
        if (!campo.id_campo) continue;

        await CampoModel.linkToEntity(
          "quiz",
          id,
          campo.id_campo,
          campo.conteudo || "",
          campo.label || "",
          campo.ordem || 0
        );
      }
    }

    // Retorna quiz atualizado com questões e campos
    return this.getById(id);
  }

  /**
   * Remove quiz permanentemente
   * CUIDADO: Remove também todas as questões e respostas (CASCADE)
   * @param {number} id - ID do quiz
   * @returns {Promise<number>} Número de registros removidos
   * @throws {NotFoundError} Se quiz não for encontrado
   */
  async delete(id) {
    // Verifica se existe
    await this.getById(id);

    const deleted = await QuizModel.delete(id);
    if (!deleted) {
      throw new NotFoundError("Quiz não encontrado");
    }

    return deleted;
  }

  /**
   * Alterna status ativo/inativo do quiz
   * @param {number} id - ID do quiz
   * @param {boolean} ativo - Novo status (true/false)
   * @returns {Promise<Object>} Quiz atualizado
   * @throws {NotFoundError} Se quiz não for encontrado
   */
  async toggleActive(id, ativo) {
    await this.getById(id);

    await QuizModel.toggleActive(id, ativo);

    return this.getById(id);
  }
}

export default new QuizService();
