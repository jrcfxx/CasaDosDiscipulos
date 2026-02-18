import ModuloModel from "../models/ModuloModel.js";
import CampoModel from "../models/CampoModel.js";
import ModuloQuizModel from "../models/ModuloQuizModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

/**
 * Service para operações relacionadas a módulos
 * Contém lógica de negócio para gerenciamento de módulos e seus campos
 */
const ModuloService = {
  /**
   * Busca todos os módulos com seus campos vinculados
   * @returns {Promise<Array>} Lista de módulos com campos
   */
  async getAll() {
    const modulos = await ModuloModel.getAll();

    // Busca campos de cada módulo
    const modulosComCampos = await Promise.all(
      modulos.map(async (modulo) => {
        const campos = await CampoModel.getByEntity("modulo", modulo.id_modulo);
        return { ...modulo, campos };
      })
    );

    return modulosComCampos;
  },

  /**
   * Busca módulo por ID com seus campos
   * @param {number} id - ID do módulo
   * @returns {Promise<Object>} Módulo com campos
   * @throws {ValidationError} Se ID for inválido
   * @throws {NotFoundError} Se módulo não for encontrado
   */
  async getById(id) {
    const parsedId = Number(id);

    if (isNaN(parsedId) || parsedId <= 0) {
      throw new ValidationError("ID inválido");
    }

    const modulo = await ModuloModel.getById(parsedId);
    if (!modulo) {
      throw new NotFoundError("Módulo não encontrado");
    }

    const campos = await CampoModel.getByEntity("modulo", parsedId);

    return { ...modulo, campos };
  },

  /**
   * Busca apenas módulos ativos
   * @returns {Promise<Array>} Lista de módulos ativos
   */
  async getActive() {
    const modulos = await ModuloModel.getActive();

    const modulosComCampos = await Promise.all(
      modulos.map(async (modulo) => {
        const campos = await CampoModel.getByEntity("modulo", modulo.id_modulo);
        return { ...modulo, campos };
      })
    );

    return modulosComCampos;
  },

  /**
   * Cria módulo com campos vinculados
   * @param {Object} data - Dados do módulo
   * @returns {Promise<Object>} Módulo criado com campos
   * @throws {ValidationError} Se dados forem inválidos
   */
  async createComCampos(data) {
    // Validações básicas
    if (!data.titulo || data.titulo.trim().length < 3) {
      throw new ValidationError(
        "Título do módulo deve ter no mínimo 3 caracteres"
      );
    }

    // Cria o módulo
    const novoModulo = await ModuloModel.create({
      titulo: data.titulo.trim(),
      descricao: data.descricao?.trim() || null,
      ordem: data.ordem || 0,
      ativo: data.ativo ?? true,
    });

    // Vincula campos se fornecidos
    if (data.campos && Array.isArray(data.campos) && data.campos.length > 0) {
      for (const campo of data.campos) {
        if (!campo.id_campo) {
          throw new ValidationError("Cada campo deve ter um id_campo válido");
        }

        await CampoModel.linkToEntity(
          "modulo",
          novoModulo.id_modulo,
          campo.id_campo,
          campo.conteudo || "",
          campo.label || "",
          campo.ordem || 0
        );
      }
    }

    // Busca campos vinculados
    const camposVinculados = await CampoModel.getByEntity(
      "modulo",
      novoModulo.id_modulo
    );

    return { ...novoModulo, campos: camposVinculados };
  },

  /**
   * Atualiza módulo e seus campos
   * @param {number} id - ID do módulo
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} Módulo atualizado
   * @throws {NotFoundError} Se módulo não for encontrado
   */
  async update(id, data) {
    // Verifica se módulo existe
    await this.getById(id);

    const dadosAtualizacao = {};

    if (data.titulo !== undefined) dadosAtualizacao.titulo = data.titulo.trim();
    if (data.descricao !== undefined)
      dadosAtualizacao.descricao = data.descricao?.trim() || null;
    if (data.ordem !== undefined) dadosAtualizacao.ordem = data.ordem;
    if (data.ativo !== undefined) dadosAtualizacao.ativo = data.ativo;

    // Atualiza módulo
    await ModuloModel.update(id, dadosAtualizacao);

    // Se campos foram enviados, atualiza vínculos
    if (data.campos && Array.isArray(data.campos)) {
      // Remove campos antigos
      await CampoModel.unlinkAllFromEntity("modulo", id);

      // Adiciona novos campos
      for (const campo of data.campos) {
        if (!campo.id_campo) continue;

        await CampoModel.linkToEntity(
          "modulo",
          id,
          campo.id_campo,
          campo.conteudo || "",
          campo.label || "",
          campo.ordem || 0
        );
      }
    }

    return this.getById(id);
  },

  /**
   * Alterna status ativo/inativo do módulo
   * @param {number} id - ID do módulo
   * @returns {Promise<Object>} Módulo atualizado
   */
  async toggleActive(id) {
    const modulo = await this.getById(id);
    await ModuloModel.toggleActive(id, !modulo.ativo);
    return this.getById(id);
  },

  /**
   * Remove módulo permanentemente
   * @param {number} id - ID do módulo
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.getById(id); // Verifica se existe
    await ModuloModel.delete(id);
  },

  /**
   * Vincula quiz a um módulo
   * @param {number} idModulo - ID do módulo
   * @param {number} idQuiz - ID do quiz
   * @returns {Promise<Object>} Vínculo criado
   */
  async vincularQuiz(idModulo, idQuiz) {
    // Verifica se módulo existe
    await this.getById(idModulo);

    // Verifica se já existe vínculo
    const jaVinculado = await ModuloQuizModel.existeVinculo(idModulo, idQuiz);
    if (jaVinculado) {
      throw new ValidationError("Este quiz já está vinculado a este módulo");
    }

    return ModuloQuizModel.vincular(idModulo, idQuiz);
  },

  /**
   * Remove vínculo entre módulo e quiz
   * @param {number} idModulo - ID do módulo
   * @param {number} idQuiz - ID do quiz
   * @returns {Promise<number>} Número de vínculos removidos
   */
  async desvincularQuiz(idModulo, idQuiz) {
    await this.getById(idModulo);
    return ModuloQuizModel.desvincular(idModulo, idQuiz);
  },

  /**
   * Atualiza quiz vinculado a um módulo
   * @param {number} idModulo - ID do módulo
   * @param {number} novoIdQuiz - ID do novo quiz (ou null para remover)
   * @returns {Promise<Object|null>} Novo vínculo ou null
   */
  async atualizarQuizVinculado(idModulo, novoIdQuiz) {
    await this.getById(idModulo);
    return ModuloQuizModel.atualizarVinculo(idModulo, novoIdQuiz);
  },

  /**
   * Busca quiz vinculado a um módulo
   * @param {number} idModulo - ID do módulo
   * @returns {Promise<Object|null>} Quiz vinculado ou null
   */
  async getQuizVinculado(idModulo) {
    return ModuloQuizModel.getQuizByModulo(idModulo);
  },
};

export default ModuloService;
