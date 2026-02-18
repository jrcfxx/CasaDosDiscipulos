import QuizRespostaModel from "../models/QuizRespostaModel.js";
import QuizQuestaoModel from "../models/QuizQuestaoModel.js";
import QuizModel from "../models/QuizModel.js";
import knex from "../database/index.js";
import AppError, { NotFoundError, ValidationError } from "../utils/AppError.js";

/**
 * Service para gerenciar respostas de quiz
 * Contém lógica de negócio para submissão e correção de respostas
 */
class QuizRespostaService {
  /**
   * Lista todas as respostas
   */
  async getAll() {
    return QuizRespostaModel.getAll();
  }

  /**
   * Busca resposta por ID
   */
  async getById(id) {
    const row = await QuizRespostaModel.getById(id);
    if (!row) throw new NotFoundError("Resposta não encontrada");
    return row;
  }

  /**
   * Cria nova resposta individual
   */
  async create(data) {
    if (!data.id_questao || !data.id_usuario) {
      throw new ValidationError("id_questao e id_usuario são obrigatórios");
    }

    // Verificar se questão existe
    const questao = await QuizQuestaoModel.getById(data.id_questao);
    if (!questao) {
      throw new NotFoundError("Questão não encontrada");
    }

    // Verificar se já respondeu
    const jaRespondeu = await QuizRespostaModel.getByUsuarioAndQuestao(
      data.id_usuario,
      data.id_questao
    );
    if (jaRespondeu) {
      throw new ValidationError("Usuário já respondeu esta questão");
    }

    // Avaliar resposta (se não for discursiva)
    let correta = null;
    let pontos_obtidos = 0;

    if (questao.tipo_questao !== "discursiva" && questao.resposta_correta) {
      correta = data.resposta.trim() === questao.resposta_correta.trim();
      pontos_obtidos = correta ? questao.pontos : 0;
    }

    return QuizRespostaModel.create({
      id_questao: data.id_questao,
      id_usuario: data.id_usuario,
      resposta: data.resposta,
      correta,
      pontos_obtidos,
    });
  }

  /**
   * Atualiza resposta existente
   */
  async update(id, data) {
    const updated = await QuizRespostaModel.update(id, data);
    if (!updated) throw new NotFoundError("Resposta não encontrada");
    return updated;
  }

  /**
   * Remove resposta
   */
  async delete(id) {
    const deleted = await QuizRespostaModel.delete(id);
    if (!deleted) throw new NotFoundError("Resposta não encontrada");
    return deleted;
  }

  /**
   * Lista respostas de um quiz
   */
  async listByQuiz(id_quiz) {
    const quiz = await QuizModel.getById(id_quiz);
    if (!quiz) throw new NotFoundError("Quiz não encontrado");

    return QuizRespostaModel.getByQuiz(id_quiz);
  }

  /**
   * Lista respostas de um usuário para um quiz
   */
  async listByUsuarioAndQuiz(id_usuario, id_quiz) {
    const quiz = await QuizModel.getById(id_quiz);
    if (!quiz) throw new NotFoundError("Quiz não encontrado");

    const respostas = await QuizRespostaModel.getByUsuarioAndQuiz(
      id_usuario,
      id_quiz
    );

    const pontuacao = await QuizRespostaModel.calcularPontuacao(
      id_usuario,
      id_quiz
    );

    return {
      respostas,
      pontuacao,
    };
  }

  /**
   * Submete todas as respostas de um quiz de uma vez
   * @param {number} id_quiz - ID do quiz
   * @param {Object} payload - { id_usuario, respostas: [{ id_questao, resposta }] }
   */
  async submitResponses(id_quiz, payload) {
    const { id_usuario, respostas } = payload;

    if (!id_usuario) {
      throw new ValidationError("id_usuario é obrigatório");
    }
    if (!respostas?.length) {
      throw new ValidationError("É necessário enviar pelo menos uma resposta");
    }

    // Verificar se quiz existe
    const quiz = await QuizModel.getById(id_quiz);
    if (!quiz) {
      throw new NotFoundError("Quiz não encontrado");
    }

    // Buscar todas as questões do quiz
    const questoes = await QuizQuestaoModel.getByQuiz(id_quiz);
    if (!questoes.length) {
      throw new ValidationError("Este quiz não possui questões");
    }

    // Criar mapa de questões para fácil acesso
    const questoesMap = new Map(questoes.map((q) => [q.id_questao, q]));

    // Verificar se já respondeu alguma questão
    const respostasExistentes = await QuizRespostaModel.getByUsuarioAndQuiz(
      id_usuario,
      id_quiz
    );
    if (respostasExistentes.length > 0) {
      throw new ValidationError("Você já respondeu este quiz");
    }

    const now = new Date();
    const rows = [];
    let pontuacao_total = 0;

    // Processar cada resposta
    for (const r of respostas) {
      const questao = questoesMap.get(r.id_questao);
      if (!questao) {
        throw new ValidationError(
          `Questão ${r.id_questao} não pertence a este quiz`
        );
      }

      // Avaliar resposta
      let correta = null;
      let pontos_obtidos = 0;

      if (questao.tipo_questao !== "discursiva" && questao.resposta_correta) {
        correta = r.resposta.trim() === questao.resposta_correta.trim();
        pontos_obtidos = correta ? questao.pontos : 0;
        pontuacao_total += pontos_obtidos;
      }

      rows.push({
        id_questao: r.id_questao,
        id_usuario,
        resposta: r.resposta,
        correta,
        pontos_obtidos,
        respondido_em: now,
      });
    }

    // Inserir todas as respostas em uma transação
    return knex.transaction(async (trx) => {
      await QuizRespostaModel.createMany(rows, trx);

      // Atualizar pontuação do usuário se houver pontos
      if (pontuacao_total > 0) {
        await trx("usuario")
          .where({ id_usuario })
          .increment("pontuacao", pontuacao_total);
      }

      // Atualizar progresso do módulo
      const moduloUsuario = await trx("usuario_modulo")
        .where({ id_usuario, id_modulo: quiz.id_modulo })
        .first();

      if (moduloUsuario) {
        await trx("usuario_modulo")
          .where({ id_usuario, id_modulo: quiz.id_modulo })
          .update({
            status: "concluido",
            nota_quiz: pontuacao_total,
            data_conclusao: now,
          });
      }

      return {
        message: "Respostas submetidas com sucesso",
        total_questoes: respostas.length,
        pontos_obtidos: pontuacao_total,
      };
    });
  }
}

export default new QuizRespostaService();
