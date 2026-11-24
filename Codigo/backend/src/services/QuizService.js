import knex from "../database/index.js";
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
  checkbox: "checkbox",
  select: "multipla_escolha",
  verdadeiro_falso: "verdadeiro_falso",
  discursiva: "discursiva",
};

/**
 * O banco guarda o conteúdo como texto. Verdadeiro/Falso chega como boolean do formulário:
 * sem converter, `true` virava "1" e a resposta certa era salva como "Falso".
 */
function lerJson(v) {
  if (!v) return null;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

const normalizar = (t) => String(t ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");

/** Textos das alternativas + quais são certas, independente dos ids gravados */
function assinaturaOpcoes(q) {
  const ops = lerJson(q.opcoes) || [];
  const certas = String(q.resposta_correta ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return JSON.stringify(ops.map((o) => [normalizar(o.texto), certas.includes(String(o.id).toLowerCase())]));
}

function conteudoComoTexto(conteudo) {
  if (conteudo === null || conteudo === undefined) return "";
  if (typeof conteudo === "boolean") return conteudo ? "true" : "false";
  return String(conteudo);
}

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

    // ATENÇÃO: nunca apagar e recriar as questões. quiz_resposta tem ON DELETE CASCADE
    // para quiz_questao — recriar apagaria as respostas e notas de todos os usuários.
    // Monta a lista desejada e reconcilia por posição, mantendo os ids existentes.
    const desejadas = [];
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
          if (tipoCampo === "checkbox") {
            resposta_correta = alternativas
              .map((alt, idx) => (alt.correta ? String.fromCharCode(65 + idx) : null))
              .filter(Boolean)
              .join(",") || null;
          } else {
            const correta = alternativas.findIndex((a) => a.correta);
            resposta_correta = correta >= 0 ? String.fromCharCode(65 + correta) : null;
          }
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
          // A tela guarda a posição da certa (correta_indice); sem ela, procura pelo texto
          const indice = parsed?.correta_indice;
          const corretaIdx =
            Number.isInteger(indice) && indice >= 0 && indice < opcoesArr.length
              ? indice
              : opcoesArr.findIndex((o) => String(o) === String(corretaVal));
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
        resposta_correta = ["true", "1"].includes(String(c.conteudo ?? "").toLowerCase()) ? "v" : "f";
      }
      // discursiva: opcoes e resposta_correta permanecem null

      desejadas.push({
        id_quiz,
        tipo_questao: tipoQuestao,
        enunciado,
        pontos: 10,
        ordem: i,
        opcoes,
        resposta_correta,
      });
    }

    const existentes = await QuizQuestaoModel.getByQuiz(id_quiz);

    // Casa cada pergunta desejada com uma existente: primeiro pelo mesmo tipo + enunciado
    // (reordenar ou tirar uma do meio não troca as respostas de pergunta), depois pela posição.
    const usadas = new Set();
    const par = new Array(desejadas.length).fill(null);
    desejadas.forEach((d, i) => {
      const achou = existentes.find(
        (e) => !usadas.has(e.id_questao) && e.tipo_questao === d.tipo_questao && normalizar(e.enunciado) === normalizar(d.enunciado)
      );
      if (achou) {
        par[i] = achou;
        usadas.add(achou.id_questao);
      }
    });
    const livres = existentes.filter((e) => !usadas.has(e.id_questao));
    desejadas.forEach((d, i) => {
      if (!par[i] && livres.length) {
        par[i] = livres.shift();
        usadas.add(par[i].id_questao);
      }
    });

    for (let i = 0; i < desejadas.length; i++) {
      const atual = par[i];
      const nova = desejadas[i];
      if (!atual) {
        await QuizQuestaoModel.create(nova);
        continue;
      }
      // Atualiza no lugar: o id (e as respostas ligadas a ele) é preservado
      const patch = {};
      if (atual.tipo_questao !== nova.tipo_questao) patch.tipo_questao = nova.tipo_questao;
      if (String(atual.enunciado ?? "") !== nova.enunciado) patch.enunciado = nova.enunciado;
      if (Number(atual.ordem) !== nova.ordem) patch.ordem = nova.ordem;
      // Alternativas iguais (mesmos textos e mesma certa) ficam como estão, mesmo que os ids
      // gravados sejam outros ("a" x "A"): trocar os ids desalinharia as respostas antigas.
      if (assinaturaOpcoes(atual) !== assinaturaOpcoes(nova)) {
        patch.opcoes = nova.opcoes;
        patch.resposta_correta = nova.resposta_correta;
      }
      if (Object.keys(patch).length) await QuizQuestaoModel.update(atual.id_questao, patch);
    }
    // Perguntas removidas pelo admin na Secretaria
    for (const sobra of existentes.filter((e) => !usadas.has(e.id_questao))) {
      await QuizQuestaoModel.delete(sobra.id_questao);
    }
  }

  /**
   * Quiz antigo (ou de exemplo) que tem perguntas mas nenhum campo: monta os campos a partir
   * das perguntas para o admin ver e editar (antes aparecia "0 campos" e o editor vinha vazio).
   */
  async _camposDasQuestoes(questoes) {
    if (!questoes.length) return [];
    const tipos = new Map((await CampoModel.getByModalidade("quiz")).map((c) => [c.tipo_campo, c.id_campo]));
    return questoes.map((q, i) => {
      const ops = lerJson(q.opcoes) || [];
      const certas = String(q.resposta_correta ?? "").split(",").map((x) => x.trim().toLowerCase());
      let conteudo = "";
      if (q.tipo_questao === "multipla_escolha" || q.tipo_questao === "checkbox") {
        conteudo = JSON.stringify({
          alternativas: ops.map((o) => ({ texto: o.texto || "", correta: certas.includes(String(o.id).toLowerCase()) })),
        });
      } else if (q.tipo_questao === "verdadeiro_falso") {
        conteudo = String(q.resposta_correta).toLowerCase() === "v" ? "true" : "false";
      }
      return {
        id: null,
        id_campo: tipos.get(q.tipo_questao) ?? null,
        tipo_campo: q.tipo_questao,
        label: q.enunciado,
        conteudo,
        ordem: i,
        derivado_das_questoes: true,
      };
    });
  }

  async _comCampos(quiz, campos, questoes) {
    const efetivos = campos.length ? campos : await this._camposDasQuestoes(questoes);
    return { ...quiz, questoes, campos: efetivos };
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
        return this._comCampos(quiz, campos, questoes);
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

    const campos = await CampoModel.getByEntity("quiz", parsedId);

    // Sincroniza campos tipo pergunta para quiz_questao sempre que houver campos
    // (garante que quizzes da secretaria tenham todas as questões ao realizar módulo)
    if (campos.length > 0) {
      await this._syncCamposToQuestoes(parsedId, campos);
    }

    const questoes = await QuizQuestaoModel.getByQuiz(parsedId);
    return this._comCampos(quiz, campos, questoes);
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
        return this._comCampos(quiz, campos, questoes);
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

    try {
      // Vincula campos se fornecidos
      if (data.campos && Array.isArray(data.campos) && data.campos.length > 0) {
        for (const [idx, campo] of data.campos.entries()) {
          if (!campo.id_campo) {
            throw new ValidationError("Cada campo deve ter um id_campo válido");
          }

          await CampoModel.linkToEntity(
            "quiz",
            novoQuiz.id_quiz,
            campo.id_campo,
            conteudoComoTexto(campo.conteudo),
            String(campo.label || "").trim(),
            // ordem única por quiz (índice único id_quiz+ordem)
            idx
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
    } catch (err) {
      // Não deixa um quiz pela metade (sem perguntas) aparecendo na lista
      await QuizModel.delete(novoQuiz.id_quiz).catch(() => {});
      throw err;
    }
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

    // Atualiza quiz (só se veio algo: salvar só as perguntas dava erro 500 com update vazio)
    if (Object.keys(dadosAtualizacao).length) await QuizModel.update(id, dadosAtualizacao);

    // Se campos foram enviados, atualiza vínculos
    if (data.campos && Array.isArray(data.campos)) {
      // Remove campos antigos
      await CampoModel.unlinkAllFromEntity("quiz", id);

      // Adiciona novos campos (ordem sequencial: índice único id_quiz+ordem)
      let ordem = 0;
      for (const campo of data.campos) {
        if (!campo.id_campo) continue;

        await CampoModel.linkToEntity(
          "quiz",
          id,
          campo.id_campo,
          conteudoComoTexto(campo.conteudo),
          String(campo.label || "").trim(),
          ordem++
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
  /** Quantas respostas de alunos o quiz tem (a tela avisa antes de excluir: vão junto) */
  async contarRespostas(id) {
    const quiz = await QuizModel.getById(Number(id));
    if (!quiz) throw new NotFoundError("Quiz não encontrado");
    const questoes = await QuizQuestaoModel.getByQuiz(quiz.id_quiz);
    if (!questoes.length) return { respostas: 0, alunos: 0 };
    const [linha] = await knex("quiz_resposta")
      .whereIn("id_questao", questoes.map((q) => q.id_questao))
      .count({ respostas: "*" })
      .countDistinct({ alunos: "id_usuario" });
    return { respostas: Number(linha.respostas), alunos: Number(linha.alunos) };
  }

  async toggleActive(id, ativo) {
    await this.getById(id);

    await QuizModel.toggleActive(id, ativo);

    return this.getById(id);
  }
}

export default new QuizService();
