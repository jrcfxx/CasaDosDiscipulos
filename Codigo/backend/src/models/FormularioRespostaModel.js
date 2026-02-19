import knex from "../database/index.js";

/**
 * Model para respostas de formulário
 * Gerencia operações CRUD para a tabela formulario_resposta
 */
const FormularioRespostaModel = {
  /**
   * Busca todas as respostas de formulário
   * @returns {Promise<Array>} Lista de respostas
   */
  async getAll() {
    return knex("formulario_resposta")
      .select(
        "formulario_resposta.*",
        "formulario.titulo as titulo_formulario",
        "celula.nome as nome_celula",
        "usuario.nome as nome_lider"
      )
      .leftJoin(
        "formulario",
        "formulario_resposta.id_formulario",
        "formulario.id_formulario"
      )
      .leftJoin("celula", "formulario_resposta.id_celula", "celula.id_celula")
      .leftJoin("usuario", "formulario_resposta.id_usuario", "usuario.id_usuario")
      .orderBy("formulario_resposta.data_resposta", "desc");
  },

  /**
   * Busca resposta por ID
   * @param {number} id_resposta - ID da resposta
   * @returns {Promise<Object|null>} Resposta encontrada ou null
   */
  async getById(id_resposta) {
    return knex("formulario_resposta")
      .select(
        "formulario_resposta.*",
        "formulario.titulo as titulo_formulario",
        "celula.nome as nome_celula",
        "usuario.nome as nome_lider"
      )
      .leftJoin(
        "formulario",
        "formulario_resposta.id_formulario",
        "formulario.id_formulario"
      )
      .leftJoin("celula", "formulario_resposta.id_celula", "celula.id_celula")
      .leftJoin("usuario", "formulario_resposta.id_usuario", "usuario.id_usuario")
      .where({ "formulario_resposta.id_resposta": id_resposta })
      .first();
  },

  /**
   * Busca respostas de um formulário específico
   * @param {number} id_formulario - ID do formulário
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByFormulario(id_formulario) {
    return knex("formulario_resposta")
      .select(
        "formulario_resposta.*",
        "celula.nome as nome_celula",
        "usuario.nome as nome_lider"
      )
      .leftJoin("celula", "formulario_resposta.id_celula", "celula.id_celula")
      .leftJoin("usuario", "formulario_resposta.id_usuario", "usuario.id_usuario")
      .where({ "formulario_resposta.id_formulario": id_formulario })
      .orderBy("formulario_resposta.data_resposta", "desc");
  },

  /**
   * Busca respostas de uma célula específica
   * @param {number} id_celula - ID da célula
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByCelula(id_celula) {
    return knex("formulario_resposta")
      .select("formulario_resposta.*", "formulario.titulo as titulo_formulario")
      .leftJoin(
        "formulario",
        "formulario_resposta.id_formulario",
        "formulario.id_formulario"
      )
      .where({ "formulario_resposta.id_celula": id_celula })
      .orderBy("formulario_resposta.data_resposta", "desc");
  },

  /**
   * Busca campos preenchidos de uma resposta
   * @param {number} id_resposta - ID da resposta
   * @returns {Promise<Array>} Lista de campos preenchidos
   */
  async getCampos(id_resposta) {
    return knex("formulario_resposta_campo")
      .select(
        "formulario_resposta_campo.*",
        "formulario_campo.label",
        "campo_personalizado.tipo_campo"
      )
      .leftJoin(
        "formulario_campo",
        "formulario_resposta_campo.id_formulario_campo",
        "formulario_campo.id"
      )
      .leftJoin(
        "campo_personalizado",
        "formulario_campo.id_campo",
        "campo_personalizado.id_campo"
      )
      .where({ "formulario_resposta_campo.id_resposta": id_resposta })
      .orderBy("formulario_campo.ordem");
  },

  /**
   * Cria nova resposta de formulário
   * @param {Object} data - Dados da resposta
   * @returns {Promise<Object>} Resposta criada
   */
  async create(data) {
    const [id_resposta] = await knex("formulario_resposta").insert(data);
    return this.getById(id_resposta);
  },

  /**
   * Cria campo preenchido da resposta
   * @param {Object} data - Dados do campo
   * @returns {Promise<number>} ID do registro criado
   */
  async createCampo(data) {
    const [id] = await knex("formulario_resposta_campo").insert(data);
    return id;
  },

  /**
   * Atualiza resposta existente
   * @param {number} id_resposta - ID da resposta
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Object|null>} Resposta atualizada ou null
   */
  async update(id_resposta, data) {
    const updated = await knex("formulario_resposta")
      .where({ id_resposta })
      .update(data);

    if (!updated) return null;
    return this.getById(id_resposta);
  },

  /**
   * Remove resposta
   * @param {number} id_resposta - ID da resposta
   * @returns {Promise<number>} Número de registros removidos
   */
  async delete(id_resposta) {
    return knex("formulario_resposta").where({ id_resposta }).del();
  },
};

export default FormularioRespostaModel;
