import knex from "../database/index.js";

/**
 * Model para células da igreja
 * Gerencia operações CRUD para a tabela celula
 * Suporta múltiplos líderes via tabela celula_lider
 */
const CelulaModel = {
  /**
   * Monta query base com líderes (lideres como array, nome_lider concatenado)
   * @param {import("knex").Knex.QueryBuilder} qb
   */
  _withLideres(qb) {
    return qb
      .select("celula.*")
      .select(
        knex.raw(
          `(SELECT GROUP_CONCAT(u.nome ORDER BY cl.principal DESC, u.nome) 
            FROM celula_lider cl 
            JOIN usuario u ON u.id_usuario = cl.id_usuario 
            WHERE cl.id_celula = celula.id_celula) as nome_lider`
        )
      )
      .select(
        knex.raw(
          `(SELECT GROUP_CONCAT(u.id_usuario ORDER BY cl.principal DESC, u.nome) 
            FROM celula_lider cl 
            JOIN usuario u ON u.id_usuario = cl.id_usuario 
            WHERE cl.id_celula = celula.id_celula) as ids_lideres`
        )
      );
  },

  /**
   * Busca todas as células
   * @returns {Promise<Array>} Lista de células
   */
  async getAll() {
    const rows = await this._withLideres(knex("celula")).orderBy("celula.nome");
    return rows.map(this._parseLideres);
  },

  /**
   * Busca apenas células ativas
   * @returns {Promise<Array>} Lista de células ativas
   */
  async getActive() {
    const rows = await this._withLideres(knex("celula"))
      .where({ "celula.ativa": true })
      .orderBy("celula.nome");
    return rows.map(this._parseLideres);
  },

  /**
   * Busca célula por ID
   * @param {number} id_celula - ID da célula
   * @returns {Promise<Object|null>} Célula encontrada ou null
   */
  async getById(id_celula) {
    const row = await this._withLideres(knex("celula"))
      .where({ "celula.id_celula": id_celula })
      .first();
    if (!row) return null;
    const lideresRows = await knex("celula_lider")
      .select("usuario.id_usuario", "usuario.nome", "usuario.email", "celula_lider.principal")
      .join("usuario", "celula_lider.id_usuario", "usuario.id_usuario")
      .where({ "celula_lider.id_celula": id_celula })
      .orderBy("celula_lider.principal", "desc")
      .orderBy("usuario.nome");
    const lideres = lideresRows.map((l) => ({
      id_usuario: l.id_usuario,
      nome: l.nome,
      email: l.email,
      principal: Boolean(l.principal),
    }));
    return this._parseLideres({ ...row, lideres });
  },

  /**
   * Parseia ids_lideres e lideres para formato padronizado
   * @param {Object} row
   * @returns {Object}
   */
  _parseLideres(row) {
    const ids = row.ids_lideres
      ? String(row.ids_lideres)
          .split(",")
          .map((x) => parseInt(x.trim(), 10))
          .filter((n) => !isNaN(n))
      : [];
    const result = { ...row };
    delete result.ids_lideres;
    result.id_lideres = ids;
    result.id_lider = ids[0] ?? null; // retrocompat
    if (row.lideres && Array.isArray(row.lideres)) {
      result.lideres = row.lideres;
    } else {
      const nomes = row.nome_lider ? row.nome_lider.split(", ") : [];
      result.lideres = ids.map((id, i) => ({ id_usuario: id, nome: nomes[i] ?? "" }));
    }
    return result;
  },

  /**
   * Busca células de um líder específico (qualquer célula onde ele é líder)
   * @param {number} id_lider - ID do líder
   * @returns {Promise<Array>} Lista de células do líder
   */
  async getByLider(id_lider) {
    const rows = await this._withLideres(knex("celula"))
      .join("celula_lider", "celula.id_celula", "celula_lider.id_celula")
      .where({ "celula_lider.id_usuario": id_lider })
      .orderBy("celula.nome");
    return rows.map(this._parseLideres);
  },

  /**
   * Cria nova célula
   * @param {Object} data - Dados da célula (sem id_lider; usa id_lideres)
   * @returns {Promise<Object>} Célula criada
   */
  async create(data) {
    const { id_lideres, ...celulaData } = data;
    const [id_celula] = await knex("celula").insert(celulaData);
    if (id_lideres && id_lideres.length > 0) {
      for (let i = 0; i < id_lideres.length; i++) {
        await knex("celula_lider").insert({
          id_celula,
          id_usuario: id_lideres[i],
          principal: i === 0,
        });
      }
    }
    return this.getById(id_celula);
  },

  /**
   * Atualiza célula existente
   * @param {number} id_celula - ID da célula
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Object|null>} Célula atualizada ou null
   */
  async update(id_celula, data) {
    const { id_lideres, ...celulaData } = data;
    const updated = await knex("celula").where({ id_celula }).update(celulaData);
    if (!updated) return null;
    if (id_lideres !== undefined) {
      await knex("celula_lider").where({ id_celula }).del();
      if (Array.isArray(id_lideres) && id_lideres.length > 0) {
        for (let i = 0; i < id_lideres.length; i++) {
          await knex("celula_lider").insert({
            id_celula,
            id_usuario: id_lideres[i],
            principal: i === 0,
          });
        }
      }
    }
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
