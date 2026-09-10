import knex from "../database/index.js";

function parseDetalhes(row) {
  if (!row) return row;
  if (row.detalhes && typeof row.detalhes === "string") {
    try {
      row.detalhes = JSON.parse(row.detalhes);
    } catch {
      row.detalhes = null;
    }
  }
  return row;
}

const EscalaRepository = {
  // ---------- Eventos ----------
  async listarEventos(filters = {}) {
    let q = knex("escala_evento").select("*").orderBy("data_hora", "asc");
    if (filters.ano) q = q.whereRaw("YEAR(data_hora) = ?", [filters.ano]);
    if (filters.mes) q = q.whereRaw("MONTH(data_hora) = ?", [filters.mes]);
    if (filters.ativo !== undefined) q = q.where("ativo", filters.ativo);
    if (filters.status) q = q.where("status", filters.status);
    if (filters.dataInicio) q = q.where("data_hora", ">=", filters.dataInicio);
    if (filters.dataFim) q = q.where("data_hora", "<=", filters.dataFim);
    return q;
  },

  async buscarEventoPorId(id) {
    return knex("escala_evento").where("id_escala_evento", id).first();
  },

  async criarEvento(dados, trx = knex) {
    const [insertId] = await trx("escala_evento").insert(dados);
    return trx("escala_evento").where("id_escala_evento", insertId).first();
  },

  async atualizarEvento(id, dados, trx = knex) {
    await trx("escala_evento")
      .where("id_escala_evento", id)
      .update({ ...dados, data_atualizacao: knex.fn.now() });
    return trx("escala_evento").where("id_escala_evento", id).first();
  },

  async excluirEvento(id, trx = knex) {
    return trx("escala_evento").where("id_escala_evento", id).del();
  },

  async listarMinisteriosPorEvento(idEvento) {
    return knex("escala_evento_ministerio as em")
      .join("ministerio as m", "em.id_ministerio", "m.id_ministerio")
      .select("m.id_ministerio", "m.nome")
      .where("em.id_escala_evento", idEvento)
      .where("m.ativo", true);
  },

  /** Batch: mapa id_evento -> [id_ministerio] */
  async mapearMinisteriosPorEventos(idsEventos) {
    if (!idsEventos?.length) return new Map();
    const rows = await knex("escala_evento_ministerio")
      .whereIn("id_escala_evento", idsEventos)
      .select("id_escala_evento", "id_ministerio");
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.id_escala_evento)) map.set(r.id_escala_evento, []);
      map.get(r.id_escala_evento).push(r.id_ministerio);
    }
    return map;
  },

  async definirMinisterios(idEvento, idMinisterios, trx = knex) {
    await trx("escala_evento_ministerio").where("id_escala_evento", idEvento).del();
    if (idMinisterios?.length) {
      await trx("escala_evento_ministerio").insert(
        idMinisterios.map((id) => ({
          id_escala_evento: idEvento,
          id_ministerio: id,
        }))
      );
    }
  },

  // ---------- Áreas ----------
  async listarAreasPorEvento(idEvento) {
    return knex("escala_area")
      .where("id_escala_evento", idEvento)
      .orderBy("ordem", "asc");
  },

  async buscarAreaPorId(id) {
    return knex("escala_area").where("id_escala_area", id).first();
  },

  async criarArea(dados, trx = knex) {
    const [insertId] = await trx("escala_area").insert(dados);
    return trx("escala_area").where("id_escala_area", insertId).first();
  },

  async excluirAreasPorEvento(idEvento, trx = knex) {
    return trx("escala_area").where("id_escala_evento", idEvento).del();
  },

  /** Batch: mapa nome_ministerio (lower) -> ministerio */
  async mapearMinisteriosPorNomes(nomes) {
    if (!nomes?.length) return new Map();
    const rows = await knex("ministerio").where("ativo", true).select("*");
    const map = new Map();
    for (const r of rows) {
      map.set(String(r.nome).toLowerCase().trim(), r);
    }
    return map;
  },

  async buscarMinisterioPorNome(nome) {
    return knex("ministerio").where("nome", nome).where("ativo", true).first();
  },

  async buscarMinisterioPorId(id) {
    return knex("ministerio").where("id_ministerio", id).where("ativo", true).first();
  },

  // ---------- Atribuições ----------
  async listarAtribuicoesPorEvento(idEvento) {
    const rows = await knex("escala_atribuicao as a")
      .join("usuario as u", "a.id_usuario", "u.id_usuario")
      .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
      .select(
        "a.id_escala_atribuicao",
        "a.id_escala_area",
        "a.id_usuario",
        "a.detalhes",
        "u.nome as usuario_nome",
        "u.telefone as usuario_telefone",
        "ar.nome as area_nome",
        "ar.id_escala_evento",
        "ar.id_ministerio"
      )
      .where("ar.id_escala_evento", idEvento);
    return rows.map(parseDetalhes);
  },

  async listarEscalasDaPessoa(idUsuario, dataInicio, dataFim) {
    const rows = await knex("escala_atribuicao as a")
      .join("usuario as u", "a.id_usuario", "u.id_usuario")
      .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
      .join("escala_evento as e", "ar.id_escala_evento", "e.id_escala_evento")
      .where("a.id_usuario", idUsuario)
      .where("e.data_hora", ">=", dataInicio)
      .where("e.data_hora", "<=", dataFim)
      .where("e.ativo", true)
      .select(
        "a.id_escala_atribuicao",
        "a.id_escala_area",
        "a.id_usuario",
        "a.detalhes",
        "u.nome as usuario_nome",
        "u.email as usuario_email",
        "u.telefone as usuario_telefone",
        "ar.nome as area_nome",
        "e.id_escala_evento",
        "e.titulo",
        "e.data_hora",
        "e.data_hora_fim",
        "e.status"
      )
      .orderBy("e.data_hora", "asc");
    return rows.map(parseDetalhes);
  },

  async listarAtribuicoesPorArea(idArea) {
    const rows = await knex("escala_atribuicao as a")
      .join("usuario as u", "a.id_usuario", "u.id_usuario")
      .select("a.*", "u.nome as usuario_nome")
      .where("a.id_escala_area", idArea);
    return rows.map(parseDetalhes);
  },

  async buscarAtribuicaoCompleta(idAtribuicao) {
    const row = await knex("escala_atribuicao as a")
      .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
      .leftJoin("usuario as u", "a.id_usuario", "u.id_usuario")
      .select(
        "a.*",
        "ar.nome as area_nome",
        "ar.id_escala_evento",
        "ar.id_ministerio",
        "u.nome as usuario_nome"
      )
      .where("a.id_escala_atribuicao", idAtribuicao)
      .first();
    return parseDetalhes(row);
  },

  async criarAtribuicao(dados, trx = knex) {
    const payload = { ...dados };
    if (payload.detalhes && typeof payload.detalhes === "object") {
      payload.detalhes = JSON.stringify(payload.detalhes);
    }
    const [insertId] = await trx("escala_atribuicao").insert(payload);
    const row = await trx("escala_atribuicao as a")
      .join("usuario as u", "a.id_usuario", "u.id_usuario")
      .select("a.*", "u.nome as usuario_nome")
      .where("a.id_escala_atribuicao", insertId)
      .first();
    return parseDetalhes(row);
  },

  async atualizarAtribuicao(id, dados, trx = knex) {
    const payload = { ...dados };
    if (payload.detalhes && typeof payload.detalhes === "object") {
      payload.detalhes = JSON.stringify(payload.detalhes);
    }
    await trx("escala_atribuicao").where("id_escala_atribuicao", id).update(payload);
    const row = await trx("escala_atribuicao as a")
      .join("usuario as u", "a.id_usuario", "u.id_usuario")
      .select("a.*", "u.nome as usuario_nome")
      .where("a.id_escala_atribuicao", id)
      .first();
    return parseDetalhes(row);
  },

  async excluirAtribuicao(id, trx = knex) {
    return trx("escala_atribuicao").where("id_escala_atribuicao", id).del();
  },

  async excluirAtribuicoesPorEvento(idEvento, trx = knex) {
    const areas = await trx("escala_area")
      .select("id_escala_area")
      .where("id_escala_evento", idEvento);
    const areaIds = areas.map((a) => a.id_escala_area);
    if (!areaIds.length) return 0;
    return trx("escala_atribuicao").whereIn("id_escala_area", areaIds).del();
  },

  async idsUsuariosEscaladosNoEvento(idEvento) {
    const areas = await knex("escala_area")
      .select("id_escala_area")
      .where("id_escala_evento", idEvento);
    const ids = areas.map((a) => a.id_escala_area);
    if (!ids.length) return [];
    const rows = await knex("escala_atribuicao")
      .select("id_usuario")
      .whereIn("id_escala_area", ids);
    return rows.map((r) => r.id_usuario);
  },

  /**
   * Conflito de horário via SQL.
   * Exclui atribuições do próprio evento (idEventoExcluir) e, opcionalmente, uma atribuição.
   */
  async buscarConflitoHorario(
    idUsuario,
    dataHoraInicio,
    dataHoraFim,
    { idEventoExcluir = null, idAtribuicaoExcluir = null } = {}
  ) {
    if (!dataHoraInicio) return null;

    let q = knex("escala_atribuicao as a")
      .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
      .join("escala_evento as e", "ar.id_escala_evento", "e.id_escala_evento")
      .where("a.id_usuario", idUsuario)
      .whereRaw(
        `? < COALESCE(e.data_hora_fim, DATE_ADD(e.data_hora, INTERVAL 2 HOUR))
         AND COALESCE(?, DATE_ADD(?, INTERVAL 2 HOUR)) > e.data_hora`,
        [dataHoraInicio, dataHoraFim || null, dataHoraInicio]
      )
      .select(
        "a.id_escala_atribuicao",
        "ar.nome as area_nome",
        "e.titulo as evento_titulo",
        "e.id_escala_evento",
        "e.data_hora",
        "e.data_hora_fim"
      )
      .first();

    if (idEventoExcluir) {
      q = q.where("e.id_escala_evento", "!=", idEventoExcluir);
    }
    if (idAtribuicaoExcluir) {
      q = q.where("a.id_escala_atribuicao", "!=", idAtribuicaoExcluir);
    }

    return q;
  },

  async usuarioJaEscaladoNoEvento(idUsuario, idEvento, idAtribuicaoExcluir = null) {
    let q = knex("escala_atribuicao as a")
      .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
      .where("a.id_usuario", idUsuario)
      .where("ar.id_escala_evento", idEvento)
      .select("a.id_escala_atribuicao", "ar.nome as area_nome")
      .first();
    if (idAtribuicaoExcluir) {
      q = q.where("a.id_escala_atribuicao", "!=", idAtribuicaoExcluir);
    }
    return q;
  },

  async contarPorFuncaoNaArea(idArea, chaveDetalhe, valor) {
    const rows = await knex("escala_atribuicao")
      .where("id_escala_area", idArea)
      .select("detalhes");
    let count = 0;
    for (const r of rows) {
      let d = r.detalhes;
      if (typeof d === "string") {
        try {
          d = JSON.parse(d);
        } catch {
          d = null;
        }
      }
      if (d && d[chaveDetalhe] === valor) count += 1;
    }
    return count;
  },

  // ---------- Visões (intervalos) ----------
  async listarEventosCompletosNoIntervalo(dataInicio, dataFim) {
    const eventos = await knex("escala_evento")
      .where("data_hora", ">=", dataInicio)
      .where("data_hora", "<=", dataFim)
      .where("ativo", true)
      .orderBy("data_hora", "asc");

    if (!eventos.length) return [];

    const ids = eventos.map((e) => e.id_escala_evento);
    const areas = await knex("escala_area").whereIn("id_escala_evento", ids).orderBy("ordem", "asc");
    const areaIds = areas.map((a) => a.id_escala_area);
    const atribuicoes =
      areaIds.length > 0
        ? (
            await knex("escala_atribuicao as a")
              .join("usuario as u", "a.id_usuario", "u.id_usuario")
              .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
              .select(
                "a.*",
                "u.nome as usuario_nome",
                "u.telefone as usuario_telefone",
                "ar.nome as area_nome",
                "ar.id_escala_evento"
              )
              .whereIn("a.id_escala_area", areaIds)
          ).map(parseDetalhes)
        : [];

    const ministeriosMap = await this.mapearMinisteriosPorEventos(ids);
    const ministeriosRows = await knex("ministerio").where("ativo", true).select("id_ministerio", "nome");
    const nomePorId = new Map(ministeriosRows.map((m) => [m.id_ministerio, m.nome]));

    return eventos.map((ev) => {
      const areasEv = areas.filter((a) => a.id_escala_evento === ev.id_escala_evento);
      const areasComAttr = areasEv.map((ar) => ({
        ...ar,
        atribuicoes: atribuicoes.filter((a) => a.id_escala_area === ar.id_escala_area),
      }));
      const idsMin = ministeriosMap.get(ev.id_escala_evento) || [];
      return {
        ...ev,
        areas: areasComAttr,
        ministerios: idsMin.map((id) => ({
          id_ministerio: id,
          nome: nomePorId.get(id) || "",
        })),
      };
    });
  },

  // ---------- Histórico ----------
  async registrarHistorico(
    { id_escala_evento, id_usuario, acao, dados_antes = null, dados_depois = null },
    trx = knex
  ) {
    const payload = {
      id_escala_evento,
      id_usuario,
      acao,
      dados_antes:
        dados_antes != null
          ? typeof dados_antes === "string"
            ? dados_antes
            : JSON.stringify(dados_antes)
          : null,
      dados_depois:
        dados_depois != null
          ? typeof dados_depois === "string"
            ? dados_depois
            : JSON.stringify(dados_depois)
          : null,
    };
    try {
      const [id] = await trx("escala_historico").insert(payload);
      return id;
    } catch (err) {
      // Tabela pode ainda não existir durante migração gradual
      if (err?.code === "ER_NO_SUCH_TABLE") return null;
      throw err;
    }
  },

  async listarHistorico(idEvento, limite = 50) {
    try {
      const rows = await knex("escala_historico as h")
        .leftJoin("usuario as u", "h.id_usuario", "u.id_usuario")
        .where("h.id_escala_evento", idEvento)
        .select("h.*", "u.nome as usuario_nome")
        .orderBy("h.criado_em", "desc")
        .limit(limite);
      return rows.map((r) => {
        const out = { ...r };
        for (const k of ["dados_antes", "dados_depois"]) {
          if (out[k] && typeof out[k] === "string") {
            try {
              out[k] = JSON.parse(out[k]);
            } catch {
              /* keep string */
            }
          }
        }
        return out;
      });
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") return [];
      throw err;
    }
  },

  async ultimoHistorico(idEvento) {
    try {
      const row = await knex("escala_historico")
        .where("id_escala_evento", idEvento)
        .orderBy("criado_em", "desc")
        .first();
      if (!row) return null;
      for (const k of ["dados_antes", "dados_depois"]) {
        if (row[k] && typeof row[k] === "string") {
          try {
            row[k] = JSON.parse(row[k]);
          } catch {
            /* keep */
          }
        }
      }
      return row;
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") return null;
      throw err;
    }
  },

  // ---------- Templates ----------
  async listarTemplates() {
    try {
      const rows = await knex("escala_template as t")
        .leftJoin("usuario as u", "t.id_criador", "u.id_usuario")
        .select("t.*", "u.nome as criador_nome")
        .orderBy("t.nome", "asc");
      return rows.map((r) => {
        if (r.payload && typeof r.payload === "string") {
          try {
            r.payload = JSON.parse(r.payload);
          } catch {
            /* keep */
          }
        }
        return r;
      });
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") return [];
      throw err;
    }
  },

  async buscarTemplate(id) {
    try {
      const row = await knex("escala_template").where("id_escala_template", id).first();
      if (row?.payload && typeof row.payload === "string") {
        try {
          row.payload = JSON.parse(row.payload);
        } catch {
          /* keep */
        }
      }
      return row;
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") return null;
      throw err;
    }
  },

  async criarTemplate(dados) {
    const payload = {
      ...dados,
      payload:
        typeof dados.payload === "object" ? JSON.stringify(dados.payload) : dados.payload,
    };
    const [id] = await knex("escala_template").insert(payload);
    return this.buscarTemplate(id);
  },

  async excluirTemplate(id) {
    return knex("escala_template").where("id_escala_template", id).del();
  },
};

export default EscalaRepository;
