import EscalaEventoModel from "../models/EscalaEventoModel.js";
import EscalaAreaModel from "../models/EscalaAreaModel.js";
import EscalaAtribuicaoModel from "../models/EscalaAtribuicaoModel.js";
import MinisterioModel from "../models/MinisterioModel.js";
import NotificacaoModel from "../models/NotificacaoModel.js";
import knex from "../database/index.js";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from "../utils/AppError.js";
import { USER_TYPES } from "../utils/constants.js";

/** Converte data para formato MySQL DATETIME (YYYY-MM-DD HH:mm:ss) - preserva hora local */
function toMysqlDatetime(value) {
  if (!value) return value;
  const s = String(value).trim().replace("T", " ");
  const m = s.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?/);
  if (m) return `${m[1]} ${m[2]}:${m[3]}:00`.slice(0, 19);
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Service para operações da Escala (eventos, áreas, atribuições)
 */
class EscalaService {
  // ---------- Eventos ----------
  async getEventos(filters = {}, idUsuario = null, tipoUsuario = null) {
    let eventos = await EscalaEventoModel.getAll(filters);
    // Líder: vê apenas eventos dos ministérios que lidera
    // Admin e Membro: vêem todos os eventos ativos
    if (tipoUsuario === USER_TYPES.LEADER && idUsuario) {
      const meusMinisterios = await MinisterioModel.getMinisteriosByUsuario(idUsuario);
      const idsMeus = meusMinisterios.map((m) => m.id_ministerio);
      if (idsMeus.length === 0) return [];
      const eventosComMin = await Promise.all(
        eventos.map(async (e) => {
          const mins = await EscalaEventoModel.getMinisteriosByEvento(e.id_escala_evento);
          const idsEvento = mins.map((m) => m.id_ministerio);
          const temIntersecao = idsEvento.some((id) => idsMeus.includes(id));
          return temIntersecao ? e : null;
        })
      );
      eventos = eventosComMin.filter(Boolean);
    }
    return eventos;
  }

  async getEventoById(id) {
    const parsed = this._parseId(id);
    const evento = await EscalaEventoModel.getById(parsed);
    if (!evento) throw new NotFoundError("Evento não encontrado");
    return evento;
  }

  async createEvento(dados, idUsuario, tipoUsuario) {
    if (tipoUsuario !== USER_TYPES.ADMIN) {
      throw new ForbiddenError("Apenas administradores podem criar eventos no calendário");
    }

    const evento = await EscalaEventoModel.create({
      titulo: dados.titulo,
      data_hora: toMysqlDatetime(dados.data_hora),
      descricao: dados.descricao || null,
      ativo: dados.ativo !== undefined ? dados.ativo : true,
      id_criador: idUsuario,
    });

    if (dados.areas && Array.isArray(dados.areas) && dados.areas.length > 0) {
      for (let i = 0; i < dados.areas.length; i++) {
        await EscalaAreaModel.create({
          id_escala_evento: evento.id_escala_evento,
          nome: dados.areas[i].trim(),
          ordem: i,
        });
      }
    }

    if (dados.id_ministerios && Array.isArray(dados.id_ministerios) && dados.id_ministerios.length) {
      await EscalaEventoModel.setMinisterios(evento.id_escala_evento, dados.id_ministerios);
      await this._notificarEventoCriado(evento, dados.id_ministerios);
    }

    return this._enrichEvento(evento);
  }

  async updateEvento(id, dados, tipoUsuario) {
    const parsed = this._parseId(id);
    const evento = await EscalaEventoModel.getById(parsed);
    if (!evento) throw new NotFoundError("Evento não encontrado");

    if (dados.titulo !== undefined) evento.titulo = dados.titulo;
    if (dados.data_hora !== undefined) evento.data_hora = toMysqlDatetime(dados.data_hora);
    if (dados.descricao !== undefined) evento.descricao = dados.descricao;
    if (dados.ativo !== undefined) evento.ativo = dados.ativo;

    await EscalaEventoModel.update(parsed, {
      titulo: evento.titulo,
      data_hora: evento.data_hora,
      descricao: evento.descricao,
      ativo: evento.ativo,
    });

    if (dados.areas && Array.isArray(dados.areas)) {
      await EscalaAtribuicaoModel.deleteByEventoId(parsed);
      await EscalaAreaModel.deleteByEventoId(parsed);
      for (let i = 0; i < dados.areas.length; i++) {
        const nome = typeof dados.areas[i] === "string" ? dados.areas[i].trim() : dados.areas[i];
        if (nome) {
          await EscalaAreaModel.create({
            id_escala_evento: parsed,
            nome,
            ordem: i,
          });
        }
      }
    }

    if (dados.id_ministerios !== undefined) {
      await EscalaEventoModel.setMinisterios(parsed, dados.id_ministerios || []);
    }

    return this._enrichEvento(await EscalaEventoModel.getById(parsed));
  }

  async deleteEvento(id, tipoUsuario) {
    const parsed = this._parseId(id);
    const evento = await EscalaEventoModel.getById(parsed);
    if (!evento) throw new NotFoundError("Evento não encontrado");
    if (tipoUsuario !== USER_TYPES.ADMIN) {
      throw new ForbiddenError("Apenas administradores podem excluir eventos");
    }
    await EscalaEventoModel.delete(parsed);
  }

  // ---------- Áreas ----------
  async getAreasByEvento(idEvento) {
    const parsed = this._parseId(idEvento);
    const evento = await EscalaEventoModel.getById(parsed);
    if (!evento) throw new NotFoundError("Evento não encontrado");
    return await EscalaAreaModel.getByEventoId(parsed);
  }

  // ---------- Atribuições ----------
  async getAtribuicoesByEvento(idEvento) {
    const parsed = this._parseId(idEvento);
    const evento = await EscalaEventoModel.getById(parsed);
    if (!evento) throw new NotFoundError("Evento não encontrado");
    return await EscalaAtribuicaoModel.getByEventoId(parsed);
  }

  async addAtribuicao(idArea, idUsuario, idUsuarioLogado, tipoUsuario, detalhes = null) {
    const parsedArea = this._parseId(idArea);
    const parsedUsuario = this._parseId(idUsuario);

    const area = await EscalaAreaModel.getById(parsedArea);
    if (!area) throw new NotFoundError("Área não encontrada");

    if (tipoUsuario === USER_TYPES.LEADER) {
      const meusMinisterios = await MinisterioModel.getMinisteriosByUsuario(idUsuarioLogado);
      const idsMeus = meusMinisterios.map((m) => m.id_ministerio);
      const ministerioArea = await knex("ministerio").where("nome", area.nome).where("ativo", true).first();
      const lideraEstaArea = ministerioArea && idsMeus.includes(ministerioArea.id_ministerio);
      if (!lideraEstaArea) {
        throw new ForbiddenError("Você só pode escalar nos ministérios em que é líder");
      }
      const ministeriosEvento = await EscalaEventoModel.getMinisteriosByEvento(area.id_escala_evento);
      const idsEvento = ministeriosEvento.map((m) => m.id_ministerio);
      const possoGerenciarEvento = idsEvento.some((id) => idsMeus.includes(id));
      if (!possoGerenciarEvento) {
        throw new ForbiddenError("Você não é líder de nenhum ministério deste evento");
      }
      const usuarioParticipa = await knex("usuario_ministerio")
        .where("id_usuario", parsedUsuario)
        .whereIn("id_ministerio", idsMeus)
        .first();
      if (!usuarioParticipa) {
        throw new ValidationError(
          "Esta pessoa não participa de nenhum ministério que você lidera neste evento"
        );
      }
    }

    const jaAtribuido = await EscalaAtribuicaoModel.usuarioJaNoEvento(
      area.id_escala_evento,
      parsedUsuario
    );
    if (jaAtribuido) {
      throw new ConflictError(
        `Esta pessoa já está escalada em outra área (${jaAtribuido.area_nome}). Cada membro pode participar de apenas uma área por evento.`
      );
    }

    const detalhesObj = detalhes && typeof detalhes === "object" ? detalhes : null;
    const atrib = await EscalaAtribuicaoModel.create({
      id_escala_area: parsedArea,
      id_usuario: parsedUsuario,
      detalhes: detalhesObj,
    });
    await this._notificarEscalado(parsedUsuario, area.id_escala_evento, area.nome);
    return atrib;
  }

  async updateAtribuicao(idAtribuicao, detalhes, idUsuarioLogado, tipoUsuario) {
    const parsed = this._parseId(idAtribuicao);
    const atribuicao = await knex("escala_atribuicao as a")
      .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
      .select("a.*", "ar.nome as area_nome")
      .where("a.id_escala_atribuicao", parsed)
      .first();
    if (!atribuicao) throw new NotFoundError("Atribuição não encontrada");

    if (tipoUsuario === USER_TYPES.LEADER) {
      const meusMinisterios = await MinisterioModel.getMinisteriosByUsuario(idUsuarioLogado);
      const idsMeus = meusMinisterios.map((m) => m.id_ministerio);
      const ministerioArea = await knex("ministerio").where("nome", atribuicao.area_nome).where("ativo", true).first();
      const lideraEstaArea = ministerioArea && idsMeus.includes(ministerioArea.id_ministerio);
      if (!lideraEstaArea) {
        throw new ForbiddenError("Você só pode editar atribuições dos ministérios em que é líder");
      }
    }

    return await EscalaAtribuicaoModel.update(parsed, { detalhes: detalhes || {} });
  }

  async removeAtribuicao(idAtribuicao, idUsuarioLogado, tipoUsuario) {
    const parsed = this._parseId(idAtribuicao);
    const atribuicao = await knex("escala_atribuicao as a")
      .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
      .select("a.*", "ar.nome as area_nome")
      .where("a.id_escala_atribuicao", parsed)
      .first();
    if (!atribuicao) throw new NotFoundError("Atribuição não encontrada");

    if (tipoUsuario === USER_TYPES.LEADER) {
      const meusMinisterios = await MinisterioModel.getMinisteriosByUsuario(idUsuarioLogado);
      const idsMeus = meusMinisterios.map((m) => m.id_ministerio);
      const ministerioArea = await knex("ministerio").where("nome", atribuicao.area_nome).where("ativo", true).first();
      const lideraEstaArea = ministerioArea && idsMeus.includes(ministerioArea.id_ministerio);
      if (!lideraEstaArea) {
        throw new ForbiddenError("Você só pode remover atribuições dos ministérios em que é líder");
      }
    }

    await EscalaAtribuicaoModel.delete(parsed);
  }

  async getEventoCompleto(id, idUsuario = null, tipoUsuario = null) {
    const evento = await this.getEventoById(id);
    const areas = await EscalaAreaModel.getByEventoId(evento.id_escala_evento);
    const atribuicoes = await EscalaAtribuicaoModel.getByEventoId(evento.id_escala_evento);
    const ministerios = await EscalaEventoModel.getMinisteriosByEvento(evento.id_escala_evento);

    let idsMinisteriosLider = [];
    if (tipoUsuario === USER_TYPES.LEADER && idUsuario) {
      const meus = await MinisterioModel.getMinisteriosByUsuario(idUsuario);
      idsMinisteriosLider = meus.map((m) => m.id_ministerio);
    }

    const areasComAtribuicoes = await Promise.all(
      areas.map(async (ar) => {
        const attrs = atribuicoes.filter((a) => a.id_escala_area === ar.id_escala_area);
        let podeGerenciarArea = tipoUsuario === USER_TYPES.ADMIN;
        if (tipoUsuario === USER_TYPES.LEADER && idsMinisteriosLider.length > 0) {
          const minArea = await knex("ministerio").where("nome", ar.nome).where("ativo", true).first();
          podeGerenciarArea = minArea && idsMinisteriosLider.includes(minArea.id_ministerio);
        }
        return { ...ar, atribuicoes: attrs, podeGerenciar: podeGerenciarArea };
      })
    );

    return { ...evento, areas: areasComAtribuicoes, ministerios };
  }

  async getUsuariosParaEscalar(idEvento, idUsuarioLogado, tipoUsuario, nomeArea = null) {
    const parsed = this._parseId(idEvento);
    await this.getEventoById(parsed);

    // Usuários já escalados neste evento (em qualquer área) — excluir da lista
    const areasEvento = await knex("escala_area")
      .select("id_escala_area")
      .where("id_escala_evento", parsed);
    const idsAreasEvento = areasEvento.map((a) => a.id_escala_area);
    const idsJaEscalados =
      idsAreasEvento.length > 0
        ? (await knex("escala_atribuicao")
            .select("id_usuario")
            .whereIn("id_escala_area", idsAreasEvento))
            .map((r) => r.id_usuario)
        : [];

    const ministeriosEvento = await EscalaEventoModel.getMinisteriosByEvento(parsed);

    let idMinisterioFiltro = null;
    if (nomeArea) {
      const ministerio = await knex("ministerio")
        .where("nome", nomeArea)
        .where("ativo", true)
        .first();
      if (ministerio) idMinisterioFiltro = ministerio.id_ministerio;
    }

    const excluirEscalados = (q) =>
      idsJaEscalados.length > 0 ? q.whereNotIn("u.id_usuario", idsJaEscalados) : q;

    const excluirEscaladosUsuario = (q) =>
      idsJaEscalados.length > 0 ? q.whereNotIn("id_usuario", idsJaEscalados) : q;

    if (tipoUsuario === USER_TYPES.ADMIN) {
      if (idMinisterioFiltro) {
        return excluirEscalados(
          knex("usuario_ministerio as um")
            .join("usuario as u", "um.id_usuario", "u.id_usuario")
            .select("u.id_usuario", "u.nome")
            .where("um.id_ministerio", idMinisterioFiltro)
            .where("u.ativo", true)
            .orderBy("u.nome")
        );
      }
      return excluirEscaladosUsuario(
        knex("usuario")
          .select("id_usuario", "nome")
          .where("ativo", true)
          .orderBy("nome")
      );
    }

    const meusMinisterios = await MinisterioModel.getMinisteriosByUsuario(idUsuarioLogado);
    const idsMeus = meusMinisterios.map((m) => m.id_ministerio);
    const idsRelevantes = ministeriosEvento
      .map((m) => m.id_ministerio)
      .filter((id) => idsMeus.includes(id));
    if (idsRelevantes.length === 0) return [];

    const idsFiltro =
      idMinisterioFiltro && idsRelevantes.includes(idMinisterioFiltro)
        ? [idMinisterioFiltro]
        : idMinisterioFiltro
          ? [] // área especificada mas o líder não lidera esse ministério
          : idsRelevantes;

    return excluirEscalados(
      knex("usuario_ministerio as um")
        .join("usuario as u", "um.id_usuario", "u.id_usuario")
        .select("u.id_usuario", "u.nome")
        .whereIn("um.id_ministerio", idsFiltro)
        .where("u.ativo", true)
        .groupBy("u.id_usuario", "u.nome")
        .orderBy("u.nome")
    );
  }

  _parseId(id) {
    const parsed = Number(id);
    if (isNaN(parsed) || parsed <= 0) throw new ValidationError("ID inválido");
    return parsed;
  }

  async _enrichEvento(evento) {
    const areas = await EscalaAreaModel.getByEventoId(evento.id_escala_evento);
    const ministerios = await EscalaEventoModel.getMinisteriosByEvento(evento.id_escala_evento);
    return { ...evento, areas, ministerios };
  }

  async _notificarEventoCriado(evento, idMinisterios) {
    const rows = await knex("usuario_ministerio")
      .whereIn("id_ministerio", idMinisterios)
      .distinct("id_usuario")
      .select("id_usuario");
    const idsUsuarios = [...new Set(rows.map((r) => r.id_usuario))];
    const usuariosAtivosRows = await knex("usuario")
      .whereIn("id_usuario", idsUsuarios.length ? idsUsuarios : [0])
      .where("ativo", true)
      .select("id_usuario");
    const usuariosAtivos = usuariosAtivosRows.map((r) => r.id_usuario);
    const dataFmt = evento.data_hora
      ? new Date(evento.data_hora).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    for (const idU of usuariosAtivos) {
      await NotificacaoModel.create({
        id_usuario: idU,
        tipo: "evento_criado",
        id_escala_evento: evento.id_escala_evento,
        titulo: `Novo evento: ${evento.titulo}`,
        mensagem: `${dataFmt}. Veja os detalhes na Escala.`,
      });
    }
  }

  async _notificarEscalado(idUsuario, idEvento, areaNome) {
    const evento = await EscalaEventoModel.getById(idEvento);
    if (!evento) return;
    const dataFmt = evento.data_hora
      ? new Date(evento.data_hora).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    await NotificacaoModel.create({
      id_usuario: idUsuario,
      tipo: "escalado",
      id_escala_evento: idEvento,
      titulo: `Você foi escalado(a) para ${evento.titulo}`,
      mensagem: `${areaNome} • ${dataFmt}`,
      area_nome: areaNome,
    });
  }
}

export default new EscalaService();
