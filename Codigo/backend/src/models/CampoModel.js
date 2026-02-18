import knex from "../database/index.js";

/**
 * Model para operações de banco de dados relacionadas a campos personalizados
 * Gerencia campos personalizados e seus vínculos com módulos, quizzes, lições e formulários
 */
const CampoModel = {
  /**
   * Busca todos os tipos de campos personalizados disponíveis
   * @returns {Promise<Array>} Lista de campos personalizados
   */
  async getAll() {
    const campos = await knex("campo_personalizado")
      .select("id_campo", "tipo_campo", "modalidades")
      .orderBy("id_campo", "asc");

    return campos.map((campo) => ({
      ...campo,
      modalidades:
        typeof campo.modalidades === "string"
          ? JSON.parse(campo.modalidades)
          : campo.modalidades,
    }));
  },

  /**
   * Busca campos personalizados permitidos para uma modalidade específica
   * @param {string} modalidade - Modalidade ('modulo', 'quiz', 'licao', 'formulario')
   * @returns {Promise<Array>} Lista de campos permitidos
   */
  async getByModalidade(modalidade) {
    const campos = await knex("campo_personalizado")
      .select("id_campo", "tipo_campo", "modalidades")
      .orderBy("id_campo", "asc");

    // Filtrar campos que incluem a modalidade no array JSON
    return campos.filter((campo) => {
      try {
        const modalidades =
          typeof campo.modalidades === "string"
            ? JSON.parse(campo.modalidades)
            : campo.modalidades;
        return modalidades.includes(modalidade);
      } catch (error) {
        console.error("Erro ao parsear modalidades:", error);
        return false;
      }
    });
  },

  /**
   * Busca campo personalizado por ID
   * @param {number} id - ID do campo
   * @returns {Promise<Object|null>} Dados do campo ou null
   */
  async getById(id) {
    return knex("campo_personalizado").where({ id_campo: id }).first();
  },

  /**
   * Busca campos vinculados a uma entidade específica
   * @param {string} entity - Tipo da entidade ('modulo', 'quiz', 'licao', 'formulario')
   * @param {number} entityId - ID da entidade
   * @returns {Promise<Array>} Lista de campos vinculados
   */
  async getByEntity(entity, entityId) {
    const tableMap = {
      modulo: { table: "modulo_campo", idField: "id_modulo" },
      quiz: { table: "quiz_campo", idField: "id_quiz" },
      licao: { table: "licao_campo", idField: "id_licao" },
      formulario: { table: "formulario_campo", idField: "id_formulario" },
    };

    const config = tableMap[entity];
    if (!config) {
      throw new Error(`Entidade inválida: ${entity}`);
    }

    return knex(config.table)
      .where({ [config.idField]: entityId })
      .join(
        "campo_personalizado",
        `${config.table}.id_campo`,
        "campo_personalizado.id_campo"
      )
      .select(
        `${config.table}.id`,
        `${config.table}.id_campo`,
        "campo_personalizado.tipo_campo",
        `${config.table}.label`,
        `${config.table}.conteudo`
      )
      .orderBy(`${config.table}.id`, "asc");
  },

  /**
   * Alias para compatibilidade com código existente
   */
  async getByOption(option, id) {
    return this.getByEntity(option, id);
  },

  /**
   * Vincula campo a uma entidade específica
   * @param {string} entity - Tipo da entidade
   * @param {number} entityId - ID da entidade
   * @param {number} id_campo - ID do campo personalizado
   * @param {string} conteudo - Conteúdo do campo
   * @param {string} label - Rótulo do campo
   * @param {number} ordem - Ordem de exibição (opcional, padrão 0)
   * @returns {Promise<Object>} Campo vinculado criado
   */
  async linkToEntity(entity, entityId, id_campo, conteudo, label, ordem = 0) {
    const tableMap = {
      modulo: { table: "modulo_campo", idField: "id_modulo" },
      quiz: { table: "quiz_campo", idField: "id_quiz" },
      licao: { table: "licao_campo", idField: "id_licao" },
      formulario: { table: "formulario_campo", idField: "id_formulario" },
    };

    const config = tableMap[entity];
    if (!config) {
      throw new Error(`Entidade inválida: ${entity}`);
    }

    const [novoId] = await knex(config.table).insert({
      [config.idField]: entityId,
      id_campo,
      conteudo: conteudo || "",
      label: label || "",
      ordem: ordem || 0,
    });

    return {
      id: novoId,
      [config.idField]: entityId,
      id_campo,
      conteudo,
      label,
      ordem,
    };
  },

  /**
   * Alias para compatibilidade com código existente
   */
  async createByOption(option, id, id_campo, conteudo, label) {
    return this.linkToEntity(option, id, id_campo, conteudo, label);
  },

  /**
   * Remove vínculo de campo com entidade
   * @param {string} entity - Tipo da entidade
   * @param {number} entityId - ID da entidade
   * @param {number} campoId - ID do vínculo (não do campo personalizado)
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async unlinkFromEntity(entity, entityId, campoId) {
    const tableMap = {
      modulo: { table: "modulo_campo", idField: "id_modulo" },
      quiz: { table: "quiz_campo", idField: "id_quiz" },
      licao: { table: "licao_campo", idField: "id_licao" },
      formulario: { table: "formulario_campo", idField: "id_formulario" },
    };

    const config = tableMap[entity];
    if (!config) {
      throw new Error(`Entidade inválida: ${entity}`);
    }

    return knex(config.table)
      .where({ [config.idField]: entityId, id: campoId })
      .del();
  },

  /**
   * Remove todos os vínculos de uma entidade
   * @param {string} entity - Tipo da entidade
   * @param {number} entityId - ID da entidade
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async unlinkAllFromEntity(entity, entityId) {
    const tableMap = {
      modulo: { table: "modulo_campo", idField: "id_modulo" },
      quiz: { table: "quiz_campo", idField: "id_quiz" },
      licao: { table: "licao_campo", idField: "id_licao" },
      formulario: { table: "formulario_campo", idField: "id_formulario" },
    };

    const config = tableMap[entity];
    if (!config) {
      throw new Error(`Entidade inválida: ${entity}`);
    }

    return knex(config.table)
      .where({ [config.idField]: entityId })
      .del();
  },

  /**
   * Cria novo tipo de campo personalizado
   * @param {Object} campo - Dados do campo
   * @returns {Promise<Object>} Campo criado
   */
  async create(campo) {
    const [id_campo] = await knex("campo_personalizado").insert(campo);
    return this.getById(id_campo);
  },

  /**
   * Atualiza tipo de campo personalizado
   * @param {number} id_campo - ID do campo
   * @param {Object} campo - Dados para atualizar
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async update(id_campo, campo) {
    return knex("campo_personalizado").where({ id_campo }).update(campo);
  },

  /**
   * Remove tipo de campo personalizado
   * @param {number} id_campo - ID do campo
   * @returns {Promise<number>} Número de linhas afetadas
   */
  async remove(id_campo) {
    return knex("campo_personalizado").where({ id_campo }).del();
  },
};

export default CampoModel;
