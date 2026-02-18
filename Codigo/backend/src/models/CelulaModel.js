import knex from "../database/index.js";

/**
 * Model para células da igreja
 * Gerencia operações CRUD para a tabela celula
 */
const CelulaModel = {
  /**
   * Busca todas as células
   * @returns {Promise<Array>} Lista de células
   */
  async getAll() {
    return knex("celula")
      .select(
        "celula.*",
        "usuario.nome as nome_lider",
        "usuario.email as email_lider"
      )
      .leftJoin("usuario", "celula.id_lider", "usuario.id_usuario")
      .orderBy("celula.nome");
  },

  /**
   * Busca apenas células ativas
   * @returns {Promise<Array>} Lista de células ativas
   */
  async getActive() {
    return knex("celula")
      .select(
        "celula.*",
        "usuario.nome as nome_lider",
        "usuario.email as email_lider"
      )
      .leftJoin("usuario", "celula.id_lider", "usuario.id_usuario")
      .where({ "celula.ativa": true })
      .orderBy("celula.nome");
  },

  /**
   * Busca célula por ID
   * @param {number} id_celula - ID da célula
   * @returns {Promise<Object|null>} Célula encontrada ou null
   */
  async getById(id_celula) {
    return knex("celula")
      .select(
        "celula.*",
        "usuario.nome as nome_lider",
        "usuario.email as email_lider"
      )
      .leftJoin("usuario", "celula.id_lider", "usuario.id_usuario")
      .where({ "celula.id_celula": id_celula })
      .first();
  },

  /**
   * Busca células de um líder específico
   * @param {number} id_lider - ID do líder
   * @returns {Promise<Array>} Lista de células do líder
   */
  async getByLider(id_lider) {
    return knex("celula").where({ id_lider }).orderBy("nome");
  },

  /**
   * Cria nova célula
   * @param {Object} data - Dados da célula
   * @returns {Promise<Object>} Célula criada
   */
  async create(data) {
    const [id_celula] = await knex("celula").insert(data);
    return this.getById(id_celula);
  },

  /**
   * Atualiza célula existente
   * @param {number} id_celula - ID da célula
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Object|null>} Célula atualizada ou null
   */
  async update(id_celula, data) {
    const updated = await knex("celula").where({ id_celula }).update(data);

    if (!updated) return null;
    return this.getById(id_celula);
  },

  /**
   * Remove célula
   * @param {number} id_celula - ID da célula
   * @returns {Promise<number>} Número de registros removidos
   */
  async delete(id_celula) {
    return knex("celula").where({ id_celula }).del();
  },

  /**
   * Ativa/desativa célula
   * @param {number} id_celula - ID da célula
   * @param {boolean} ativa - Status desejado
   * @returns {Promise<Object|null>} Célula atualizada ou null
   */
  async toggleActive(id_celula, ativa) {
    return this.update(id_celula, { ativa });
  },
};

export default CelulaModel;
