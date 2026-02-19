import QuizModel from "../models/QuizModel.js";
import QuizQuestaoModel from "../models/QuizQuestaoModel.js";
import CampoModel from "../models/CampoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

/**
 * Service para operações relacionadas a quizzes
 * Contém lógica de negócio para gerenciamento de quizzes e suas questões
 */
const QUESTOES_TIPOS = [
  "multipla_escolha",
  "verdadeiro_falso",
  "discursiva",
  "checkbox",
  "select",
];
const TIPO_TO_QUIZ_QUESTAO = {
  multipla_escolha: "multipla_escolha",
  checkbox: "multipla_escolha",
  select: "multipla_escolha",
  verdadeiro_falso: "verdadeiro_falso",
  discursiva: "discursiva",
};

class QuizService {
  /**
   * Sincroniza campos do quiz (tipo questão) para quiz_questao
   * Permite que quizzes criados na secretaria com campos apareçam ao realizar módulo
   * @param {number} id_quiz - ID do quiz
   * @param {Array} campos - Campos do quiz (de getByEntity, com tipo_campo)
   */
  async _syncCamposToQuestoes(id_quiz, campos) {
    const questionCampos = (campos || []).filter(
      (c) => c.tipo_campo && QUESTOES_TIPOS.includes(String(c.tipo_campo).toLowerCase())
    );
    if (questionCampos.length === 0) return;

    await QuizQuestaoModel.deleteByQuiz(id_quiz);

    for (let i = 0; i < questionCampos.length; i++) {
      const c = questionCampos[i];
      const tipoCampo = String(c.tipo_campo).toLowerCase();
      const tipoQuestao =
        TIPO_TO_QUIZ_QUESTAO[tipoCampo] || "multipla_escolha";
      const enunciado = (c.label || "").trim() || `Questão ${i + 1}`;
      let opcoes = null;
      let resposta_correta = null;

      if (tipoCampo === "multipla_escolha" || tipoCampo === "checkbox") {
        try {
          const parsed = typeof c.conteudo === "string" ? JSON.parse(c.conteudo || "{}") : c.conteudo;
          const alternativas = parsed?.alternativas || [];
          const ops = alternativas.map((alt, idx) => ({
            id: String.fromCharCode(65 + idx),
            texto: alt.texto || "",
          }));
          opcoes = JSON.stringify(ops);
          const correta = alternativas.findIndex((a) => a.correta);
          resposta_correta = correta >= 0 ? String.fromCharCode(65 + correta) : null;
        } catch {
          opcoes = JSON.stringify([{ id: "A", texto: "Opção A" }]);
        }
      } else if (tipoCampo === "select") {
        try {
          const parsed = typeof c.conteudo === "string" ? JSON.parse(c.conteudo || "{}") : c.conteudo;
          const opcoesArr = parsed?.opcoes || [];
          const ops = opcoesArr.map((o, idx) => ({
            id: String(idx),
            texto: typeof o === "string" ? o : String(o),
          }));
          opcoes = JSON.stringify(ops);
          const corretaVal = parsed?.correta;
          const corretaIdx = opcoesArr.findIndex(
            (o) => String(o) === String(corretaVal)
          );
          resposta_correta =
            corretaIdx >= 0 ? String(corretaIdx) : (opcoesArr[0] ? "0" : null);
        } catch {
          opcoes = JSON.stringify([{ id: "0", texto: "Opção" }]);
        }
      } else if (tipoCampo === "verdadeiro_falso") {
        opcoes = JSON.stringify([
          { id: "v", texto: "Verdadeiro" },
          { id: "f", texto: "Falso" },
        ]);
        resposta_correta = String(c.conteudo || "").toLowerCase() === "true" ? "v" : "f";
      }
      // discursiva: opcoes e resposta_correta permanecem null

      await QuizQuestaoModel.create({
        id_quiz,
        tipo_questao: tipoQuestao,
        enunciado,
        pontos: 10,
        ordem: i,
        opcoes,
        resposta_correta,
      });
    }
  }
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

    let questoes = await QuizQuestaoModel.getByQuiz(parsedId);
    const campos = await CampoModel.getByEntity("quiz", parsedId);

    // Se não há questões mas há campos tipo pergunta, sincroniza (quizzes antigos da secretaria)
    if (questoes.length === 0 && campos.length > 0) {
      await this._syncCamposToQuestoes(parsedId, campos);
      questoes = await QuizQuestaoModel.getByQuiz(parsedId);
    }

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

    // Sincroniza campos tipo questão para quiz_questao (para exibir na página de realizar módulo)
    await this._syncCamposToQuestoes(novoQuiz.id_quiz, camposVinculados);

    const questoes = await QuizQuestaoModel.getByQuiz(novoQuiz.id_quiz);
    return { ...novoQuiz, questoes, campos: camposVinculados };
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
          campo.ordem ?? 0
        );
      }

      // Sincroniza campos tipo questão para quiz_questao
      const camposAtualizados = await CampoModel.getByEntity("quiz", id);
      await this._syncCamposToQuestoes(id, camposAtualizados);
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
