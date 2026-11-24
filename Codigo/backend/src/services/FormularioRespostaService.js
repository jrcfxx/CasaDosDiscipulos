import FormularioRespostaModel from "../models/FormularioRespostaModel.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/AppError.js";
import knex from "../database/index.js";
import { USER_TYPES } from "../utils/constants.js";
import { montarRelatorio, dataDeReferencia } from "../utils/relatorioFormulario.js";

/**
 * Service para gerenciar respostas de formulário
 */
const FormularioRespostaService = {
  /**
   * Células que o usuário pode ver/alterar. null = todas (administrador).
   * Líder enxerga apenas as células em que está em celula_lider.
   */
  async _celulasPermitidas(usuario) {
    if (usuario?.tipo === USER_TYPES.ADMIN) return null;
    if (!usuario?.id_usuario) return new Set();
    const rows = await knex("celula_lider")
      .where({ id_usuario: usuario.id_usuario })
      .select("id_celula");
    return new Set(rows.map((r) => Number(r.id_celula)));
  },

  _filtrar(rows, permitidas) {
    if (!permitidas) return rows;
    return rows.filter((r) => permitidas.has(Number(r.id_celula)));
  },

  async _assertAcesso(resposta, usuario) {
    const permitidas = await this._celulasPermitidas(usuario);
    if (permitidas && !permitidas.has(Number(resposta.id_celula))) {
      // 404 em vez de 403: não revela que o relatório de outra célula existe
      throw new NotFoundError("Resposta de formulário não encontrada");
    }
  },

  /**
   * Lista as respostas de formulário visíveis para o usuário
   * @returns {Promise<Array>} Lista de respostas
   */
  async getAll(usuario = null) {
    const rows = await FormularioRespostaModel.getAll();
    return this._filtrar(rows, await this._celulasPermitidas(usuario));
  },

  /**
   * Busca resposta por ID
   * @param {number} id - ID da resposta
   * @returns {Promise<Object>} Resposta encontrada
   * @throws {NotFoundError} Se resposta não encontrada
   */
  async getById(id, usuario = null) {
    const resposta = await FormularioRespostaModel.getById(id);
    if (!resposta) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }
    if (usuario) await this._assertAcesso(resposta, usuario);

    // Buscar campos preenchidos
    const campos = await FormularioRespostaModel.getCampos(id);
    return { ...resposta, campos };
  },

  /**
   * Busca respostas de um formulário específico
   * @param {number} idFormulario - ID do formulário
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByFormulario(idFormulario, usuario = null) {
    const rows = this._filtrar(
      await FormularioRespostaModel.getByFormulario(idFormulario),
      await this._celulasPermitidas(usuario)
    );
    // Valores curtos (data e números) para a lista mostrar sem abrir cada resposta
    const campos = await this._camposDoFormulario(idFormulario);
    const curtos = campos.filter((c) => c.tipo === "data" || c.tipo === "numero");
    const valores = await this._valoresPorResposta(rows.map((r) => r.id_resposta), curtos);
    const campoData = curtos.find((c) => c.tipo === "data");
    return rows.map((r) => {
      const v = valores.get(r.id_resposta) || {};
      return {
        ...r,
        data_referencia: dataDeReferencia({ ...r, valores: v }, campoData?.id),
        resumo: curtos.map((c) => ({ id: c.id, label: c.label, tipo: c.tipo, valor: v[c.id] ?? null })),
      };
    });
  },

  /**
   * Todas as respostas do formulário com todos os campos preenchidos (para exportar em Excel).
   * Líder recebe só as das células dele.
   */
  async getExportacao(idFormulario, usuario = null) {
    const respostas = this._filtrar(
      await FormularioRespostaModel.getByFormulario(idFormulario),
      await this._celulasPermitidas(usuario)
    );
    const campos = await this._camposDoFormulario(idFormulario);
    const valores = await this._valoresPorResposta(respostas.map((r) => r.id_resposta), campos);
    const campoData = campos.find((c) => c.tipo === "data");
    return {
      campos,
      respostas: respostas.map((r) => {
        const v = valores.get(r.id_resposta) || {};
        return {
          id_resposta: r.id_resposta,
          id_celula: r.id_celula,
          nome_celula: r.nome_celula || null,
          nome_lider: r.nome_lider || null,
          data_resposta: r.data_resposta,
          data_referencia: dataDeReferencia({ ...r, valores: v }, campoData?.id),
          valores: v,
        };
      }),
    };
  },

  /** Campos do formulário com o tipo (data, numero, texto...) */
  async _camposDoFormulario(idFormulario) {
    const rows = await knex("formulario_campo as fc")
      .leftJoin("campo_personalizado as cp", "cp.id_campo", "fc.id_campo")
      .where("fc.id_formulario", idFormulario)
      .orderBy("fc.ordem", "asc")
      .select("fc.id", "fc.label", "cp.tipo_campo as tipo");
    return rows.map((r) => ({ id: Number(r.id), label: r.label || "", tipo: r.tipo || "" }));
  },

  /** Map id_resposta -> { id_formulario_campo: valor } só dos campos pedidos */
  async _valoresPorResposta(idsRespostas, campos) {
    const mapa = new Map();
    if (!idsRespostas.length || !campos.length) return mapa;
    const rows = await knex("formulario_resposta_campo")
      .whereIn("id_resposta", idsRespostas)
      .whereIn("id_formulario_campo", campos.map((c) => c.id))
      .select("id_resposta", "id_formulario_campo", "valor");
    for (const r of rows) {
      const v = mapa.get(r.id_resposta) || {};
      v[r.id_formulario_campo] = r.valor;
      mapa.set(r.id_resposta, v);
    }
    return mapa;
  },

  /**
   * Relatório do formulário no período: por célula e por janela da frequência
   * (enviado / faltou / aguardando), totais dos campos numéricos. Líder vê só as células dele.
   */
  async getRelatorio(idFormulario, inicio, fim, usuario = null) {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (!iso.test(String(inicio || "")) || !iso.test(String(fim || ""))) {
      throw new ValidationError("Informe inicio e fim no formato AAAA-MM-DD");
    }
    if (inicio > fim) throw new ValidationError("A data inicial deve ser anterior à final");
    const formulario = await knex("formulario").where({ id_formulario: idFormulario }).first();
    if (!formulario) throw new NotFoundError("Formulário não encontrado");

    const permitidas = await this._celulasPermitidas(usuario);
    const campos = await this._camposDoFormulario(idFormulario);

    let celulas = await knex("celula").select("id_celula", "nome", "ativa");
    celulas = this._filtrar(celulas, permitidas);
    const lideres = await knex("celula_lider as cl")
      .join("usuario as u", "u.id_usuario", "cl.id_usuario")
      .select("cl.id_celula", "u.nome");
    const lideresPorCelula = new Map();
    for (const l of lideres) {
      lideresPorCelula.set(l.id_celula, [...(lideresPorCelula.get(l.id_celula) || []), l.nome]);
    }

    const respostas = this._filtrar(await FormularioRespostaModel.getByFormulario(idFormulario), permitidas);
    const usados = campos.filter((c) => c.tipo === "data" || c.tipo === "numero");
    const valores = await this._valoresPorResposta(respostas.map((r) => r.id_resposta), usados);

    return montarRelatorio({
      frequencia: formulario.frequencia || "",
      inicio,
      fim,
      campos: usados,
      celulas: celulas.map((c) => ({ ...c, lideres: lideresPorCelula.get(c.id_celula) || [] })),
      respostas: respostas.map((r) => ({ ...r, valores: valores.get(r.id_resposta) || {} })),
    });
  },

  /**
   * Busca respostas de uma célula específica
   * @param {number} idCelula - ID da célula
   * @returns {Promise<Array>} Lista de respostas
   */
  async getByCelula(idCelula, usuario = null) {
    const permitidas = await this._celulasPermitidas(usuario);
    if (permitidas && !permitidas.has(Number(idCelula))) return [];
    return FormularioRespostaModel.getByCelula(idCelula);
  },

  /**
   * Cria nova resposta de formulário
   * @param {Object} data - Dados da resposta { id_usuario?, id_formulario, id_celula, campos: [] }
   * @returns {Promise<Object>} Resposta criada
   * @throws {ValidationError} Se dados inválidos
   */
  async create(data, tipoUsuario = null) {
    const { id_usuario, id_formulario, id_celula, campos } = data;

    // Validações básicas
    if (!id_formulario) {
      throw new ValidationError("ID do formulário é obrigatório");
    }

    if (!id_celula) {
      throw new ValidationError("ID da célula é obrigatório");
    }

    if (!campos || !Array.isArray(campos) || campos.length === 0) {
      throw new ValidationError(
        "Campos de resposta são obrigatórios e devem ser um array"
      );
    }

    if (!id_usuario) {
      throw new ValidationError("ID do usuário (líder) é obrigatório");
    }

    // Líder só responde pela própria célula; admin pode qualquer uma
    if (tipoUsuario !== USER_TYPES.ADMIN) {
      const vinculo = await knex("celula_lider")
        .where({ id_usuario, id_celula })
        .first();
      if (!vinculo) {
        throw new ForbiddenError(
          "Você só pode responder formulários das células das quais é líder"
        );
      }
    }

    const id_resposta = await knex.transaction(async (trx) => {
      const [novoId] = await trx("formulario_resposta").insert({
        id_formulario,
        id_usuario,
        id_celula,
        data_resposta: new Date(),
      });

      for (const campo of campos) {
        if (!campo.id_formulario_campo) {
          throw new ValidationError(
            "Cada campo deve ter id_formulario_campo definido"
          );
        }

        await trx("formulario_resposta_campo").insert({
          id_resposta: novoId,
          id_formulario_campo: campo.id_formulario_campo,
          valor: campo.resposta != null ? String(campo.resposta) : null,
        });
      }

      return novoId;
    });

    return this.getById(id_resposta);
  },

  /**
   * Atualiza resposta existente
   * @param {number} id - ID da resposta
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Object>} Resposta atualizada
   * @throws {NotFoundError} Se resposta não encontrada
   */
  async update(id, data, usuario = null) {
    const exists = await FormularioRespostaModel.getById(id);
    if (!exists) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }
    await this._assertAcesso(exists, usuario);

    // Permitir atualização apenas de data_resposta
    const updateData = {};
    if (data.data_resposta) {
      updateData.data_resposta = data.data_resposta;
    }

    const updated = await FormularioRespostaModel.update(id, updateData);
    return updated;
  },

  /**
   * Remove resposta
   * @param {number} id - ID da resposta
   * @returns {Promise<void>}
   * @throws {NotFoundError} Se resposta não encontrada
   */
  async delete(id, usuario = null) {
    const exists = await FormularioRespostaModel.getById(id);
    if (!exists) {
      throw new NotFoundError("Resposta de formulário não encontrada");
    }
    await this._assertAcesso(exists, usuario);

    await FormularioRespostaModel.delete(id);
  },
};

export default FormularioRespostaService;
