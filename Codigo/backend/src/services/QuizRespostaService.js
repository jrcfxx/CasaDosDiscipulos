import QuizRespostaModel from "../models/QuizRespostaModel.js";
import QuizQuestaoModel from "../models/QuizQuestaoModel.js";
import QuizModel from "../models/QuizModel.js";
import ModuloService from "./ModuloService.js";
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
   * Submete todas as respostas de um quiz de uma vez.
   * Regra: usuário só pode enviar 1 vez, exceto se tirou menos de 50% — aí pode tentar novamente.
   * @param {number} id_quiz - ID do quiz
   * @param {Object} payload - { id_usuario, id_modulo?, respostas: [{ id_questao, resposta }] }
   */
  async submitResponses(id_quiz, payload) {
    const { id_usuario, id_modulo, respostas } = payload;

    if (!id_usuario) {
      throw new ValidationError("id_usuario é obrigatório");
    }
    if (!respostas?.length) {
      throw new ValidationError("É necessário enviar pelo menos uma resposta");
    }

    const quiz = await QuizModel.getById(id_quiz);
    if (!quiz) {
      throw new NotFoundError("Quiz não encontrado");
    }

    const questoes = await QuizQuestaoModel.getByQuiz(id_quiz);
    if (!questoes.length) {
      throw new ValidationError("Este quiz não possui questões");
    }

    const id_modulo_efetivo = id_modulo ?? quiz.id_modulo;
    if (!id_modulo_efetivo) {
      throw new ValidationError(
        "id_modulo é obrigatório quando o quiz não está vinculado diretamente a um módulo"
      );
    }

    const podeAcessar = await ModuloService.podeAcessarModulo(
      id_modulo_efetivo,
      id_usuario
    );
    if (!podeAcessar) {
      throw new ValidationError(
        "Complete os módulos anteriores na sequência para realizar este quiz."
      );
    }

    const pontuacao_maxima = questoes.reduce((s, q) => s + (q.pontos || 0), 0);

    const moduloUsuario = await knex("usuario_modulo")
      .where({ id_usuario, id_modulo: id_modulo_efetivo })
      .first();

    if (moduloUsuario?.status === "concluido" && moduloUsuario.nota_quiz != null) {
      const notaAnterior = Number(moduloUsuario.nota_quiz);
      const limiteAprovacao = pontuacao_maxima * 0.5;
      if (notaAnterior >= limiteAprovacao) {
        throw new ValidationError(
          "Você já concluiu este módulo com sucesso. Não é permitido refazer o quiz."
        );
      }
    }

    const questoesMap = new Map(questoes.map((q) => [q.id_questao, q]));

    const respostasExistentes = await QuizRespostaModel.getByUsuarioAndQuiz(
      id_usuario,
      id_quiz
    );
    const ehRetentativa = respostasExistentes.length > 0;
    const notaAnteriorParaReverter = ehRetentativa && moduloUsuario?.nota_quiz != null
      ? Number(moduloUsuario.nota_quiz)
      : 0;

    const parseOpcoes = (opcoes) => {
      if (!opcoes) return [];
      if (Array.isArray(opcoes)) return opcoes;
      try {
        const parsed = typeof opcoes === "string" ? JSON.parse(opcoes) : opcoes;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const getTextoOpcao = (questao, idOpcao) => {
      if (!idOpcao) return idOpcao;
      const opts = parseOpcoes(questao.opcoes);
      const opt = opts.find((o) => (typeof o === "object" ? o.id : o) === idOpcao);
      return typeof opt === "object" ? opt?.texto : opt ?? idOpcao;
    };

    const now = new Date();
    const rows = [];
    let pontuacao_total = 0;
    const questoesErradas = [];

    for (const r of respostas) {
      const questao = questoesMap.get(r.id_questao);
      if (!questao) {
        throw new ValidationError(
          `Questão ${r.id_questao} não pertence a este quiz`
        );
      }

      let correta = null;
      let pontos_obtidos = 0;

      if (questao.tipo_questao !== "discursiva" && questao.resposta_correta) {
        correta = String(r.resposta || "").trim() === String(questao.resposta_correta || "").trim();
        pontos_obtidos = correta ? (questao.pontos || 0) : 0;
        pontuacao_total += pontos_obtidos;

        if (!correta) {
          const pontosQuestao = questao.pontos || 0;
          questoesErradas.push({
            id_questao: questao.id_questao,
            enunciado: questao.enunciado,
            ordem: questao.ordem ?? 0,
            resposta_usuario: getTextoOpcao(questao, String(r.resposta || "").trim()),
            resposta_correta: getTextoOpcao(questao, String(questao.resposta_correta || "").trim()),
            pontos_perdidos: pontosQuestao,
          });
        }
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

    return knex.transaction(async (trx) => {
      if (ehRetentativa) {
        await QuizRespostaModel.deleteByUsuarioAndQuiz(id_usuario, id_quiz, trx);
        if (notaAnteriorParaReverter > 0) {
          await trx("usuario")
            .where({ id_usuario })
            .decrement("pontuacao", notaAnteriorParaReverter);
        }
      }

      await QuizRespostaModel.createMany(rows, trx);

      const atingiu50 = pontuacao_maxima > 0 && pontuacao_total >= pontuacao_maxima * 0.5;
      const bonusPrimeiraTentativa = atingiu50 && !ehRetentativa ? Math.max(1, Math.floor(pontuacao_total * 0.1)) : 0;
      const pontuacaoFinalUsuario = pontuacao_total + bonusPrimeiraTentativa;

      if (pontuacaoFinalUsuario > 0) {
        await trx("usuario")
          .where({ id_usuario })
          .increment("pontuacao", pontuacaoFinalUsuario);
      }

      const dadosProgresso = {
        status: "concluido",
        nota_quiz: pontuacao_total,
        data_conclusao: now,
      };

      if (moduloUsuario) {
        await trx("usuario_modulo")
          .where({ id_usuario, id_modulo: id_modulo_efetivo })
          .update(dadosProgresso);
      } else {
        await trx("usuario_modulo").insert({
          id_usuario,
          id_modulo: id_modulo_efetivo,
          ...dadosProgresso,
        });
      }

      return {
        message: "Respostas submetidas com sucesso",
        total_questoes: respostas.length,
        pontos_obtidos: pontuacao_total,
        pontuacao_maxima,
        bonus_primeira_tentativa: bonusPrimeiraTentativa,
        eh_retentativa: ehRetentativa,
        atingiu_50: atingiu50,
        questoes_erradas: questoesErradas.sort((a, b) => a.ordem - b.ordem),
      };
    });
  }
}

export default new QuizRespostaService();
