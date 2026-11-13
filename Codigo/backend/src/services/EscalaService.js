import EscalaRepository from "../repository/EscalaRepository.js";
import MinisterioModel from "../models/MinisterioModel.js";
import NotificacaoModel from "../models/NotificacaoModel.js";
import UsuarioModel from "../models/UsuarioModel.js";
import WhatsAppService from "./WhatsAppService.js";
import ValidadorEscala from "./ValidadorEscala.js";
import knex from "../database/index.js";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from "../utils/AppError.js";
import {
  USER_TYPES,
  ESCALA_STATUS,
  ESCALA_HISTORICO_ACAO,
} from "../utils/constants.js";
import {
  toMysqlDatetime,
  formatarDatetimeLocal,
  formatarDataHoraPtBr,
  inicioDoDia,
  fimDoDia,
  adicionarDias,
  deslocarDatetime,
} from "../utils/dateUtils.js";
import {
  formatarEventoUnificado,
  estatisticasEventos,
  dataIsoDeDatetime,
  diaDaSemanaIso,
  chaveSlotDeDetalhes,
  chaveAreaGrupo,
  chaveDetalheDoGrupo,
  horaDeDatetime,
  tipoEventoPorTitulo,
} from "../utils/escalaUnificada.js";
import { getLimitesPorArea } from "../config/ministerioCampos.js";

/**
 * Conflitos que o líder/admin pode aceitar conscientemente ("adicionar mesmo assim"):
 * a pessoa já está em outra função do mesmo evento, em outro evento no mesmo horário,
 * ou a função já atingiu o limite de vagas. Valor inválido de função nunca é confirmável.
 */
const CONFLITOS_CONFIRMAVEIS = new Set(["duplo_evento", "duplo_instrumento", "limite"]);

class EscalaService {
  // ---------- Eventos ----------
  async getEventos(filters = {}, idUsuario = null, tipoUsuario = null) {
    let eventos = await EscalaRepository.listarEventos(filters);

    // Membros não veem rascunhos (admin e líderes de ministério gerenciam)
    if (tipoUsuario === USER_TYPES.MEMBER) {
      eventos = eventos.filter((e) => e.status !== ESCALA_STATUS.RASCUNHO);
    }

    if (tipoUsuario === USER_TYPES.LEADER && idUsuario) {
      const meusMinisterios = await MinisterioModel.getMinisteriosByUsuario(idUsuario);
      const idsMeus = new Set(meusMinisterios.map((m) => m.id_ministerio));
      // Líder vê os eventos dos ministérios que lidera + os eventos em que está escalado
      const idsEscalado = new Set(await EscalaRepository.idsEventosDoUsuario(idUsuario));
      const idsEventos = eventos.map((e) => e.id_escala_evento);
      const mapa = await EscalaRepository.mapearMinisteriosPorEventos(idsEventos);
      eventos = eventos.filter((e) => {
        if (idsEscalado.has(e.id_escala_evento) && e.status !== ESCALA_STATUS.RASCUNHO) {
          return true;
        }
        const ids = mapa.get(e.id_escala_evento) || [];
        return ids.some((id) => idsMeus.has(id));
      });
    }
    return eventos;
  }

  /** Admin e líderes gerenciam rascunhos; membros só enxergam escalas publicadas/concluídas */
  _podeVerRascunho(tipoUsuario) {
    return tipoUsuario === USER_TYPES.ADMIN || tipoUsuario === USER_TYPES.LEADER;
  }

  async getEventoById(id, tipoUsuario = USER_TYPES.ADMIN) {
    const parsed = this._parseId(id);
    const evento = await EscalaRepository.buscarEventoPorId(parsed);
    if (!evento) throw new NotFoundError("Evento não encontrado");
    if (evento.status === ESCALA_STATUS.RASCUNHO && !this._podeVerRascunho(tipoUsuario)) {
      throw new NotFoundError("Evento não encontrado");
    }
    return evento;
  }

  async createEvento(dados, idUsuario, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    this._assertHorarioValido(dados.data_hora, dados.data_hora_fim);

    const trx = await knex.transaction();
    try {
      const evento = await EscalaRepository.criarEvento(
        {
          titulo: dados.titulo,
          data_hora: toMysqlDatetime(dados.data_hora),
          data_hora_fim: dados.data_hora_fim ? toMysqlDatetime(dados.data_hora_fim) : null,
          descricao: dados.descricao || null,
          ativo: dados.ativo !== undefined ? dados.ativo : true,
          status: dados.status || ESCALA_STATUS.PUBLICADA,
          id_criador: idUsuario,
        },
        trx
      );

      const idMins = dados.id_ministerios || [];
      await EscalaRepository.definirMinisterios(evento.id_escala_evento, idMins, trx);

      // Áreas: vínculo com o ministério pelo ID (nomes podem repetir ou mudar)
      let areasNovas;
      if (dados.areas?.length > 0) {
        const nomes = dados.areas
          .map((a) => (typeof a === "string" ? a.trim() : a))
          .filter(Boolean);
        const ministeriosDoEvento = idMins.length
          ? await trx("ministerio").whereIn("id_ministerio", idMins).select("id_ministerio", "nome")
          : [];
        areasNovas = [];
        for (const nome of nomes) {
          const doEvento = ministeriosDoEvento.find(
            (m) => String(m.nome).toLowerCase().trim() === nome.toLowerCase()
          );
          const min =
            doEvento ||
            (await trx("ministerio").where("nome", nome).where("ativo", true).first());
          areasNovas.push({ nome, id_ministerio: min?.id_ministerio || null });
        }
      } else {
        const rows = idMins.length
          ? await trx("ministerio").whereIn("id_ministerio", idMins).select("id_ministerio", "nome")
          : [];
        areasNovas = idMins
          .map((id) => rows.find((m) => m.id_ministerio === Number(id)))
          .filter(Boolean)
          .map((m) => ({ nome: m.nome, id_ministerio: m.id_ministerio }));
      }

      for (let i = 0; i < areasNovas.length; i++) {
        await EscalaRepository.criarArea(
          {
            id_escala_evento: evento.id_escala_evento,
            nome: areasNovas[i].nome,
            ordem: i,
            id_ministerio: areasNovas[i].id_ministerio,
          },
          trx
        );
      }

      await EscalaRepository.registrarHistorico(
        {
          id_escala_evento: evento.id_escala_evento,
          id_usuario: idUsuario,
          acao: ESCALA_HISTORICO_ACAO.CRIACAO,
          dados_depois: evento,
        },
        trx
      );

      await trx.commit();

      // Rascunho não notifica ninguém: as notificações saem na publicação
      if (idMins.length && evento.status === ESCALA_STATUS.PUBLICADA) {
        await this._notificarEventoCriado(evento, idMins);
      }
      return this._enrichEvento(evento);
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  async updateEvento(id, dados, tipoUsuario, idUsuarioLogado = null) {
    this._assertAdmin(tipoUsuario);
    const parsed = this._parseId(id);
    const eventoAntes = await EscalaRepository.buscarEventoPorId(parsed);
    if (!eventoAntes) throw new NotFoundError("Evento não encontrado");

    // Editar só o início ou só o término: compara com o outro valor já salvo
    if (dados.data_hora !== undefined || dados.data_hora_fim !== undefined) {
      this._assertHorarioValido(
        dados.data_hora !== undefined ? dados.data_hora : eventoAntes.data_hora,
        dados.data_hora_fim !== undefined ? dados.data_hora_fim : eventoAntes.data_hora_fim
      );
    }

    const atribuicoesAntes = await EscalaRepository.listarAtribuicoesPorEvento(parsed);

    const trx = await knex.transaction();
    try {
      const patch = {};
      if (dados.titulo !== undefined) patch.titulo = dados.titulo;
      if (dados.data_hora !== undefined) patch.data_hora = toMysqlDatetime(dados.data_hora);
      if (dados.data_hora_fim !== undefined) {
        patch.data_hora_fim = dados.data_hora_fim ? toMysqlDatetime(dados.data_hora_fim) : null;
      }
      if (dados.descricao !== undefined) patch.descricao = dados.descricao;
      if (dados.ativo !== undefined) patch.ativo = dados.ativo;
      if (dados.status !== undefined) patch.status = dados.status;

      let eventoAtualizado = eventoAntes;
      if (Object.keys(patch).length > 0) {
        eventoAtualizado = await EscalaRepository.atualizarEvento(parsed, patch, trx);
      }

      let areasForamSubstituidas = false;
      if (dados.areas && Array.isArray(dados.areas)) {
        areasForamSubstituidas = true;
        // Sync não destrutivo: mantém áreas cujo nome permanece; remove só as que saíram
        const areasAtuais = await trx("escala_area").where("id_escala_evento", parsed);
        const nomesNovos = dados.areas
          .map((a) => (typeof a === "string" ? a.trim() : a))
          .filter(Boolean);
        const setNovos = new Set(nomesNovos.map((n) => n.toLowerCase()));

        for (const ar of areasAtuais) {
          if (!setNovos.has(String(ar.nome).toLowerCase())) {
            await trx("escala_atribuicao").where("id_escala_area", ar.id_escala_area).del();
            await trx("escala_area").where("id_escala_area", ar.id_escala_area).del();
          }
        }

        const restantes = await trx("escala_area").where("id_escala_evento", parsed);
        const porNome = new Map(restantes.map((a) => [String(a.nome).toLowerCase(), a]));
        const idsMinEvento =
          dados.id_ministerios !== undefined
            ? dados.id_ministerios || []
            : (await trx("escala_evento_ministerio").where("id_escala_evento", parsed)).map((r) => r.id_ministerio);
        const minsEvento = idsMinEvento.length
          ? await trx("ministerio").whereIn("id_ministerio", idsMinEvento).select("id_ministerio", "nome")
          : [];

        for (let i = 0; i < nomesNovos.length; i++) {
          const nome = nomesNovos[i];
          const key = nome.toLowerCase();
          const existente = porNome.get(key);
          if (existente) {
            await trx("escala_area").where("id_escala_area", existente.id_escala_area).update({ ordem: i });
          } else {
            // Prefere o ministério do próprio evento com esse nome (nomes podem repetir entre ministérios)
            const min =
              minsEvento.find((m) => String(m.nome).toLowerCase().trim() === key) ||
              (await trx("ministerio").where("nome", nome).where("ativo", true).first());
            await EscalaRepository.criarArea(
              {
                id_escala_evento: parsed,
                nome,
                ordem: i,
                id_ministerio: min?.id_ministerio || null,
              },
              trx
            );
          }
        }
      }

      if (dados.id_ministerios !== undefined) {
        await EscalaRepository.definirMinisterios(parsed, dados.id_ministerios || [], trx);
      }

      eventoAtualizado = await trx("escala_evento").where("id_escala_evento", parsed).first();

      await EscalaRepository.registrarHistorico(
        {
          id_escala_evento: parsed,
          id_usuario: idUsuarioLogado,
          acao: ESCALA_HISTORICO_ACAO.EDICAO,
          dados_antes: eventoAntes,
          dados_depois: eventoAtualizado,
        },
        trx
      );

      await trx.commit();

      const estavaPublicado = eventoAntes.status === ESCALA_STATUS.PUBLICADA;
      const ficouPublicado = eventoAtualizado.status === ESCALA_STATUS.PUBLICADA;

      if (!estavaPublicado && ficouPublicado) {
        // Publicação via edição: mesmo efeito do botão "Publicar"
        await this._notificarPublicacao(eventoAtualizado);
      } else if (estavaPublicado && ficouPublicado) {
        const houveAlteracaoRelevante =
          dados.titulo !== undefined ||
          dados.data_hora !== undefined ||
          dados.data_hora_fim !== undefined ||
          dados.descricao !== undefined ||
          areasForamSubstituidas;
        if (houveAlteracaoRelevante && atribuicoesAntes.length > 0) {
          await this._notificarEventoAtualizadoParaEscalados(
            atribuicoesAntes,
            eventoAtualizado,
            areasForamSubstituidas
          );
        }
      }

      // Mudou o horário: avisa quem ficou com choque de horário em outro evento
      const avisos = [];
      if (dados.data_hora !== undefined || dados.data_hora_fim !== undefined) {
        const atuais = await EscalaRepository.listarAtribuicoesPorEvento(parsed);
        for (const attr of atuais) {
          const conflito = await EscalaRepository.buscarConflitoHorario(
            attr.id_usuario,
            eventoAtualizado.data_hora,
            eventoAtualizado.data_hora_fim,
            { idEventoExcluir: parsed }
          );
          if (conflito) {
            avisos.push({
              tipo: "duplo_evento",
              id_usuario: attr.id_usuario,
              mensagem: `${attr.usuario_nome} também está escalado(a) em ${conflito.evento_titulo} (${conflito.area_nome}) no novo horário.`,
            });
          }
        }
      }

      return { ...(await this._enrichEvento(eventoAtualizado)), avisos };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  async deleteEvento(id, tipoUsuario, idUsuarioLogado = null) {
    this._assertAdmin(tipoUsuario);
    const parsed = this._parseId(id);
    const evento = await EscalaRepository.buscarEventoPorId(parsed);
    if (!evento) throw new NotFoundError("Evento não encontrado");

    const atribuicoes = await EscalaRepository.listarAtribuicoesPorEvento(parsed);
    // Histórico e exclusão juntos: nunca um sem o outro
    await knex.transaction(async (trx) => {
      await EscalaRepository.registrarHistorico(
        {
          id_escala_evento: parsed,
          id_usuario: idUsuarioLogado,
          acao: ESCALA_HISTORICO_ACAO.EXCLUSAO,
          dados_antes: { evento, atribuicoes },
        },
        trx
      );
      await EscalaRepository.excluirEvento(parsed, trx);
    });

    // Só avisa cancelamento de escala que as pessoas já conheciam (publicada)
    if (atribuicoes.length > 0 && evento.status === ESCALA_STATUS.PUBLICADA) {
      await this._notificarEventoCanceladoParaEscalados(atribuicoes, evento);
    }
  }

  async getAreasByEvento(idEvento) {
    const parsed = this._parseId(idEvento);
    await this.getEventoById(parsed);
    return EscalaRepository.listarAreasPorEvento(parsed);
  }

  async getAtribuicoesByEvento(idEvento) {
    const parsed = this._parseId(idEvento);
    await this.getEventoById(parsed);
    return EscalaRepository.listarAtribuicoesPorEvento(parsed);
  }

  async addAtribuicao(
    idArea,
    idUsuario,
    idUsuarioLogado,
    tipoUsuario,
    detalhes = null,
    { confirmarConflitos = false } = {}
  ) {
    const parsedArea = this._parseId(idArea);
    const parsedUsuario = this._parseId(idUsuario);
    const area = await EscalaRepository.buscarAreaPorId(parsedArea);
    if (!area) throw new NotFoundError("Área não encontrada");

    await this._assertPodeGerenciarArea(area, idUsuarioLogado, tipoUsuario);

    const pessoa = await knex("usuario").where({ id_usuario: parsedUsuario }).select("ativo").first();
    if (!pessoa) throw new NotFoundError("Pessoa não encontrada");
    if (!pessoa.ativo) throw new ValidationError("Esta pessoa está desativada e não pode ser escalada");

    if (tipoUsuario === USER_TYPES.LEADER) {
      await this._assertUsuarioNoMinisterioDoLider(parsedUsuario, idUsuarioLogado, area);
    }

    const jaNaArea = await knex("escala_atribuicao")
      .where({ id_escala_area: parsedArea, id_usuario: parsedUsuario })
      .first();
    if (jaNaArea) throw new ConflictError("Esta pessoa já está escalada nesta área");

    const evento = await EscalaRepository.buscarEventoPorId(area.id_escala_evento);
    const { conflitos } = await ValidadorEscala.validarTodosConflitos({
      idUsuario: parsedUsuario,
      idArea: parsedArea,
      areaNome: area.nome,
      idEvento: area.id_escala_evento,
      dataHora: evento?.data_hora,
      dataHoraFim: evento?.data_hora_fim,
      detalhes,
      // O mesmo evento é tratado por "duplo_instrumento" (respeita paralelismo)
      excluirMesmoEventoDoOverlap: true,
      idMinisterioDestino: area.id_ministerio ?? null,
    });
    const aceitos = this._avaliarConflitos(conflitos, confirmarConflitos);

    try {
      const atrib = await knex.transaction(async (trx) => {
        const nova = await EscalaRepository.criarAtribuicao(
          {
            id_escala_area: parsedArea,
            id_usuario: parsedUsuario,
            detalhes: detalhes && typeof detalhes === "object" ? detalhes : null,
          },
          trx
        );
        await EscalaRepository.registrarHistorico(
          {
            id_escala_evento: area.id_escala_evento,
            id_usuario: idUsuarioLogado,
            acao: ESCALA_HISTORICO_ACAO.ATRIBUICAO,
            dados_depois: aceitos.length
              ? { ...nova, conflitos_confirmados: aceitos.map((c) => c.mensagem) }
              : nova,
          },
          trx
        );
        return nova;
      });
      if (evento?.status === ESCALA_STATUS.PUBLICADA) {
        await this._notificarEscalado(parsedUsuario, area.id_escala_evento, area.nome, atrib?.detalhes);
      }
      return atrib;
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") {
        throw new ConflictError("Esta pessoa já está escalada nesta área");
      }
      throw err;
    }
  }

  async updateAtribuicao(
    idAtribuicao,
    detalhes,
    idUsuarioLogado,
    tipoUsuario,
    { confirmarConflitos = false } = {}
  ) {
    const parsed = this._parseId(idAtribuicao);
    const atribuicao = await EscalaRepository.buscarAtribuicaoCompleta(parsed);
    if (!atribuicao) throw new NotFoundError("Atribuição não encontrada");

    const area = await EscalaRepository.buscarAreaPorId(atribuicao.id_escala_area);
    await this._assertPodeGerenciarArea(area, idUsuarioLogado, tipoUsuario);

    const detalhesObj = detalhes && typeof detalhes === "object" ? detalhes : {};
    const habilidade = ValidadorEscala.validarHabilidadeUsuario(atribuicao.area_nome, detalhesObj);
    if (!habilidade.valido) throw new ValidationError(habilidade.mensagem);

    // Mesma pessoa, mesmo evento: só o limite de vagas da nova função importa
    // (a própria atribuição não conta para o limite)
    const limite = await ValidadorEscala.validarLimiteInstrumento(
      atribuicao.id_escala_area,
      atribuicao.area_nome,
      detalhesObj,
      parsed
    );
    this._avaliarConflitos([limite], confirmarConflitos);

    const evento = await EscalaRepository.buscarEventoPorId(atribuicao.id_escala_evento);
    const row = await knex.transaction(async (trx) => {
      const atualizada = await EscalaRepository.atualizarAtribuicao(
        parsed,
        { detalhes: detalhesObj },
        trx
      );
      await EscalaRepository.registrarHistorico(
        {
          id_escala_evento: atribuicao.id_escala_evento,
          id_usuario: idUsuarioLogado,
          acao: ESCALA_HISTORICO_ACAO.EDICAO,
          dados_antes: atribuicao,
          dados_depois: atualizada,
        },
        trx
      );
      return atualizada;
    });

    if (evento?.status === ESCALA_STATUS.PUBLICADA) {
      await this._notificarAtribuicaoAtualizada(
        atribuicao.id_usuario,
        evento,
        atribuicao.area_nome,
        detalhesObj
      );
    }
    return row;
  }

  async removeAtribuicao(idAtribuicao, idUsuarioLogado, tipoUsuario) {
    const parsed = this._parseId(idAtribuicao);
    const atribuicao = await EscalaRepository.buscarAtribuicaoCompleta(parsed);
    if (!atribuicao) throw new NotFoundError("Atribuição não encontrada");

    const area = await EscalaRepository.buscarAreaPorId(atribuicao.id_escala_area);
    await this._assertPodeGerenciarArea(area, idUsuarioLogado, tipoUsuario);

    const evento = await EscalaRepository.buscarEventoPorId(atribuicao.id_escala_evento);

    await knex.transaction(async (trx) => {
      await EscalaRepository.registrarHistorico(
        {
          id_escala_evento: atribuicao.id_escala_evento,
          id_usuario: idUsuarioLogado,
          acao: ESCALA_HISTORICO_ACAO.REMOCAO_ATRIBUICAO,
          dados_antes: atribuicao,
        },
        trx
      );
      await EscalaRepository.excluirAtribuicao(parsed, trx);
    });

    if (evento?.status === ESCALA_STATUS.PUBLICADA) {
      await this._notificarAtribuicaoRemovida(atribuicao.id_usuario, evento, atribuicao.area_nome);
    }
  }

  async getEventoCompleto(id, idUsuario = null, tipoUsuario = null) {
    const evento = await this.getEventoById(id, tipoUsuario || USER_TYPES.ADMIN);
    const areas = await EscalaRepository.listarAreasPorEvento(evento.id_escala_evento);
    const atribuicoes = await EscalaRepository.listarAtribuicoesPorEvento(evento.id_escala_evento);
    const ministerios = await EscalaRepository.listarMinisteriosPorEvento(evento.id_escala_evento);

    let idsMinisteriosLider = [];
    if (tipoUsuario === USER_TYPES.LEADER && idUsuario) {
      const meus = await MinisterioModel.getMinisteriosByUsuario(idUsuario);
      idsMinisteriosLider = meus.map((m) => m.id_ministerio);
    }

    const mapaMins = await EscalaRepository.mapearMinisteriosPorNomes(areas.map((a) => a.nome));

    const areasComAtribuicoes = areas.map((ar) => {
      const attrs = atribuicoes.filter((a) => a.id_escala_area === ar.id_escala_area);
      let podeGerenciarArea = tipoUsuario === USER_TYPES.ADMIN;
      if (tipoUsuario === USER_TYPES.LEADER && idsMinisteriosLider.length > 0) {
        const idMin = ar.id_ministerio || mapaMins.get(String(ar.nome).toLowerCase().trim())?.id_ministerio;
        podeGerenciarArea = idMin && idsMinisteriosLider.includes(idMin);
      }
      return { ...ar, atribuicoes: attrs, podeGerenciar: !!podeGerenciarArea };
    });

    return { ...evento, areas: areasComAtribuicoes, ministerios };
  }

  /**
   * Candidatos para escalar. Quem já está no evento NÃO some da lista:
   * vem marcado (ja_escalado + areas_no_evento) para o líder decidir se é exceção.
   */
  async getUsuariosParaEscalar(idEvento, idUsuarioLogado, tipoUsuario, nomeArea = null) {
    const parsed = this._parseId(idEvento);
    await this.getEventoById(parsed);

    const atribuicoesEvento = await EscalaRepository.listarAtribuicoesPorEvento(parsed);
    const areasPorUsuario = new Map();
    for (const a of atribuicoesEvento) {
      if (!areasPorUsuario.has(a.id_usuario)) areasPorUsuario.set(a.id_usuario, []);
      areasPorUsuario.get(a.id_usuario).push(a.area_nome);
    }
    const marcar = (rows) =>
      rows.map((u) => ({
        ...u,
        ja_escalado: areasPorUsuario.has(u.id_usuario),
        areas_no_evento: areasPorUsuario.get(u.id_usuario) || [],
      }));

    const ministeriosEvento = await EscalaRepository.listarMinisteriosPorEvento(parsed);

    let idMinisterioFiltro = null;
    if (nomeArea) {
      // A área do evento guarda o ministério pelo id: renomear o ministério não quebra o vínculo
      const areas = await EscalaRepository.listarAreasPorEvento(parsed);
      const area = areas.find(
        (a) => String(a.nome).toLowerCase().trim() === String(nomeArea).toLowerCase().trim()
      );
      if (area?.id_ministerio) {
        idMinisterioFiltro = area.id_ministerio;
      } else {
        const ministerio = await EscalaRepository.buscarMinisterioPorNome(nomeArea);
        if (ministerio) idMinisterioFiltro = ministerio.id_ministerio;
      }
    }

    if (tipoUsuario === USER_TYPES.ADMIN) {
      if (idMinisterioFiltro) {
        return marcar(
          await knex("usuario_ministerio as um")
            .join("usuario as u", "um.id_usuario", "u.id_usuario")
            .select("u.id_usuario", "u.nome")
            .where("um.id_ministerio", idMinisterioFiltro)
            .where("u.ativo", true)
            .orderBy("u.nome")
        );
      }
      return marcar(
        await knex("usuario").select("id_usuario", "nome").where("ativo", true).orderBy("nome")
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
          ? []
          : idsRelevantes;
    if (idsFiltro.length === 0) return [];

    return marcar(
      await knex("usuario_ministerio as um")
        .join("usuario as u", "um.id_usuario", "u.id_usuario")
        .select("u.id_usuario", "u.nome")
        .whereIn("um.id_ministerio", idsFiltro)
        .where("u.ativo", true)
        .groupBy("u.id_usuario", "u.nome")
        .orderBy("u.nome")
    );
  }

  // ---------- Visões ----------
  _filtrarRascunhosSeMembro(eventos, tipoUsuario) {
    if (tipoUsuario === USER_TYPES.MEMBER) {
      return eventos.filter((e) => e.status !== ESCALA_STATUS.RASCUNHO);
    }
    return eventos;
  }

  async getVisaoDia(data, tipoUsuario = null) {
    const ini = inicioDoDia(data);
    const fim = fimDoDia(data);
    const eventos = await EscalaRepository.listarEventosCompletosNoIntervalo(ini, fim);
    return this._filtrarRascunhosSeMembro(eventos, tipoUsuario);
  }

  async getVisaoSemana(dataInicio, tipoUsuario = null) {
    const ini = inicioDoDia(dataInicio);
    const fim = fimDoDia(adicionarDias(dataInicio, 6));
    const eventos = await EscalaRepository.listarEventosCompletosNoIntervalo(ini, fim);
    return this._filtrarRascunhosSeMembro(eventos, tipoUsuario);
  }

  async getVisaoMes(ano, mes, tipoUsuario = null) {
    const y = Number(ano);
    const m = Number(mes);
    if (!y || !m || m < 1 || m > 12) throw new ValidationError("Ano/mês inválidos");
    const ini = `${y}-${String(m).padStart(2, "0")}-01 00:00:00`;
    const ultimo = new Date(y, m, 0).getDate();
    const fim = `${y}-${String(m).padStart(2, "0")}-${String(ultimo).padStart(2, "0")} 23:59:59`;
    const eventos = await EscalaRepository.listarEventosCompletosNoIntervalo(ini, fim);
    return this._filtrarRascunhosSeMembro(eventos, tipoUsuario);
  }

  async getVisaoAno(ano, tipoUsuario = null) {
    const y = Number(ano);
    if (!y) throw new ValidationError("Ano inválido");
    let eventos = await EscalaRepository.listarEventos({
      ano: y,
      ativo: true,
    });
    eventos = this._filtrarRascunhosSeMembro(eventos, tipoUsuario);
    const porMes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      total_eventos: 0,
      eventos: [],
    }));
    for (const e of eventos) {
      const mes = new Date(e.data_hora).getMonth();
      porMes[mes].total_eventos += 1;
      porMes[mes].eventos.push({
        id_escala_evento: e.id_escala_evento,
        titulo: e.titulo,
        data_hora: e.data_hora,
        status: e.status,
      });
    }
    return { ano: y, meses: porMes };
  }

  async getVisualizacaoAno(ano, tipoUsuario = null) {
    const visao = await this.getVisaoAno(ano, tipoUsuario);
    return {
      sucesso: true,
      dados: {
        ...visao,
        estatisticas: {
          totalEventos: visao.meses.reduce((acc, m) => acc + m.total_eventos, 0),
          mesesComEventos: visao.meses.filter((m) => m.total_eventos > 0).length,
        },
      },
    };
  }

  _formatarEventosComPermissao(eventos, idsMinisteriosLider = [], tipoUsuario = null) {
    return eventos.map((ev) => {
      const areas = (ev.areas || []).map((ar) => {
        let podeGerenciar = tipoUsuario === USER_TYPES.ADMIN;
        if (tipoUsuario === USER_TYPES.LEADER && idsMinisteriosLider.length) {
          podeGerenciar = !!(ar.id_ministerio && idsMinisteriosLider.includes(ar.id_ministerio));
        }
        return { ...ar, podeGerenciar: !!podeGerenciar };
      });
      return formatarEventoUnificado({ ...ev, areas });
    });
  }

  async _idsMinisteriosLider(idUsuario, tipoUsuario) {
    if (tipoUsuario !== USER_TYPES.LEADER || !idUsuario) return [];
    const meus = await MinisterioModel.getMinisteriosByUsuario(idUsuario);
    return meus.map((m) => m.id_ministerio);
  }

  async getVisualizacaoDia(data, idUsuario = null, tipoUsuario = null) {
    const eventos = await this.getVisaoDia(data, tipoUsuario);
    const idsLider = await this._idsMinisteriosLider(idUsuario, tipoUsuario);
    const unificados = this._formatarEventosComPermissao(eventos, idsLider, tipoUsuario);
    return {
      sucesso: true,
      dados: {
        data: String(data).slice(0, 10),
        diaDaSemana: diaDaSemanaIso(data),
        eventos: unificados,
        estatisticas: estatisticasEventos(unificados),
      },
    };
  }

  async getVisualizacaoSemana(dataInicio, idUsuario = null, tipoUsuario = null) {
    const eventos = await this.getVisaoSemana(dataInicio, tipoUsuario);
    const idsLider = await this._idsMinisteriosLider(idUsuario, tipoUsuario);
    const unificados = this._formatarEventosComPermissao(eventos, idsLider, tipoUsuario);
    const dataFim = adicionarDias(dataInicio, 6);
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const data = adicionarDias(dataInicio, i);
      const doDia = unificados.filter((e) => e.data === data);
      dias.push({
        data,
        diaDaSemana: diaDaSemanaIso(data),
        diaNumero: Number(data.slice(8, 10)),
        eventos: doDia,
      });
    }
    const stats = estatisticasEventos(unificados);
    return {
      sucesso: true,
      dados: {
        dataInicio: String(dataInicio).slice(0, 10),
        dataFim,
        dias,
        estatisticas: {
          ...stats,
          diasComEventos: dias.filter((d) => d.eventos.length > 0).length,
          diasVazios: dias.filter((d) => d.eventos.length === 0).length,
        },
      },
    };
  }

  async getVisualizacaoMes(ano, mes, modo = "compacto", idUsuario = null, tipoUsuario = null) {
    const eventos = await this.getVisaoMes(ano, mes, tipoUsuario);
    const idsLider = await this._idsMinisteriosLider(idUsuario, tipoUsuario);
    const unificados = this._formatarEventosComPermissao(eventos, idsLider, tipoUsuario);
    const y = Number(ano);
    const m = Number(mes);
    const ultimo = new Date(y, m, 0).getDate();
    const MESES = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ];
    const dias = [];
    for (let d = 1; d <= ultimo; d++) {
      const data = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const doDia = unificados.filter((e) => e.data === data);
      dias.push({
        data,
        diaDaSemana: diaDaSemanaIso(data),
        diaNumero: d,
        temEventos: doDia.length > 0,
        totalEventos: doDia.length,
        totalPessoas: doDia.reduce((acc, e) => acc + (e.totais?.totalPessoas || 0), 0),
        eventos:
          modo === "completo"
            ? doDia
            : doDia.map((e) => ({
                id: e.id,
                nome: e.nome,
                tipo: e.tipo,
                horaInicio: e.horaInicio,
                totalPessoas: e.totais.totalPessoas,
                status: e.status,
              })),
      });
    }
    return {
      sucesso: true,
      dados: {
        ano: y,
        mes: m,
        mesNome: MESES[m - 1],
        primeiroDia: `${y}-${String(m).padStart(2, "0")}-01`,
        ultimoDia: `${y}-${String(m).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`,
        totalDias: ultimo,
        dias,
        estatisticas: {
          ...estatisticasEventos(unificados),
          diasComEventos: dias.filter((d) => d.temEventos).length,
          diasVazios: dias.filter((d) => !d.temEventos).length,
        },
      },
    };
  }

  _resolverAreaDestino(eventoCompleto, { id_escala_area, instrumentoDestino }) {
    if (id_escala_area) {
      const area = (eventoCompleto.areas || []).find(
        (a) => a.id_escala_area === Number(id_escala_area)
      );
      return area || null;
    }
    if (!instrumentoDestino) return null;
    const chave = String(instrumentoDestino);
    const grupoAlvo =
      chaveAreaGrupo(chave) !== "area"
        ? chaveAreaGrupo(chave)
        : ["vocal", "violao", "guitarra", "baixo", "teclado", "piano", "bateria"].includes(chave)
          ? "louvor"
          : ["mesa", "operador_som", "transmissao", "projecao"].includes(chave)
            ? "som"
            : ["portaria", "boas_vindas", "cadastro", "coordenacao"].includes(chave)
              ? "voluntarios"
              : null;
    if (grupoAlvo) {
      return (
        (eventoCompleto.areas || []).find((a) => chaveAreaGrupo(a.nome) === grupoAlvo) || null
      );
    }
    return (
      (eventoCompleto.areas || []).find(
        (a) => String(a.nome).toLowerCase() === chave.toLowerCase()
      ) || null
    );
  }

  _detalhesComSlot(areaNome, detalhesBase, instrumentoDestino) {
    const base = detalhesBase && typeof detalhesBase === "object" ? { ...detalhesBase } : {};
    if (!instrumentoDestino || instrumentoDestino === "_geral") return base;
    const campo = chaveDetalheDoGrupo(chaveAreaGrupo(areaNome));
    base[campo] = instrumentoDestino;
    if (campo === "instrumento") delete base.funcao;
    return base;
  }

  async validarMoverMembro(body) {
    const idAtribuicao = this._parseId(body.membroEscalaOrigemId || body.id_escala_atribuicao);
    const atribuicao = await EscalaRepository.buscarAtribuicaoCompleta(idAtribuicao);
    if (!atribuicao) throw new NotFoundError("Atribuição não encontrada");

    const idEventoDestino = this._parseId(
      body.escalaDestinoId || body.id_escala_evento_destino || atribuicao.id_escala_evento
    );
    const destinoCompleto = await this.getEventoCompleto(idEventoDestino);
    const areaDestino = this._resolverAreaDestino(destinoCompleto, {
      id_escala_area: body.id_escala_area,
      instrumentoDestino: body.instrumentoDestino,
    });
    if (!areaDestino) throw new ValidationError("Área/instrumento de destino não encontrado");

    const detalhes = this._detalhesComSlot(
      areaDestino.nome,
      body.detalhes || atribuicao.detalhes,
      body.instrumentoDestino
    );

    const mesmoEvento = areaDestino.id_escala_evento === atribuicao.id_escala_evento;
    const mesmaArea = areaDestino.id_escala_area === atribuicao.id_escala_area;

    const resultado = await ValidadorEscala.validarTodosConflitos({
      idUsuario: atribuicao.id_usuario,
      idArea: areaDestino.id_escala_area,
      areaNome: areaDestino.nome,
      idEvento: areaDestino.id_escala_evento,
      dataHora: destinoCompleto.data_hora,
      dataHoraFim: destinoCompleto.data_hora_fim,
      detalhes,
      idAtribuicaoExcluir: idAtribuicao,
      excluirMesmoEventoDoOverlap: mesmoEvento,
      idMinisterioDestino: areaDestino.id_ministerio ?? null,
    });

    const conflitos = resultado.conflitos.filter((c) => !c.valido && !c.skip);
    // Troca de instrumento na mesma área não é conflito de duplo instrumento
    const filtrados = mesmaArea
      ? conflitos.filter((c) => c.tipo !== "duplo_instrumento")
      : conflitos;

    const avisos = resultado.conflitos.filter((c) => c.valido && c.tipo === "limite");
    const limites = getLimitesPorArea(areaDestino.nome);
    const slot = body.instrumentoDestino;
    if (limites && slot && limites[slot] != null) {
      const atual = await EscalaRepository.contarPorFuncaoNaArea(
        areaDestino.id_escala_area,
        chaveDetalheDoGrupo(chaveAreaGrupo(areaDestino.nome)),
        slot
      );
      if (atual === limites[slot] - 1) {
        avisos.push({
          tipo: "limite_proximo",
          gravidade: "baixa",
          mensagem: `${slot} tem ${atual} de ${limites[slot]} vagas. Após adicionar, ficará ${atual + 1}/${limites[slot]}.`,
        });
      }
    }

    return {
      sucesso: true,
      valido: filtrados.length === 0,
      podeProsseguir: filtrados.length === 0,
      confirmavel:
        filtrados.length > 0 && filtrados.every((c) => CONFLITOS_CONFIRMAVEIS.has(c.tipo)),
      conflitos: filtrados.map((c) => ({
        tipo: c.tipo,
        gravidade: "alta",
        mensagem: c.mensagem,
        sugestao: c.sugestao || null,
      })),
      avisos,
      dadosDestino: {
        evento: destinoCompleto.titulo,
        data: dataIsoDeDatetime(destinoCompleto.data_hora),
        horario: `${horaDeDatetime(destinoCompleto.data_hora)} - ${horaDeDatetime(destinoCompleto.data_hora_fim)}`,
        instrumento: body.instrumentoDestino || areaDestino.nome,
        id_escala_area: areaDestino.id_escala_area,
      },
    };
  }

  async moverMembroUnificado(body, idUsuarioLogado, tipoUsuario) {
    const validacao = await this.validarMoverMembro(body);
    if (!validacao.podeProsseguir && !(body.forcarMovimento && validacao.confirmavel)) {
      const err = new ConflictError(validacao.conflitos[0]?.mensagem || "Conflito ao mover");
      err.conflitos = validacao.conflitos;
      err.confirmavel = validacao.confirmavel;
      throw err;
    }

    const idAtribuicao = this._parseId(body.membroEscalaOrigemId || body.id_escala_atribuicao);
    const atribuicao = await EscalaRepository.buscarAtribuicaoCompleta(idAtribuicao);
    const areaDestinoId = validacao.dadosDestino.id_escala_area;
    const areaDestino = await EscalaRepository.buscarAreaPorId(areaDestinoId);
    const detalhes = this._detalhesComSlot(
      areaDestino.nome,
      body.detalhes || atribuicao.detalhes,
      body.instrumentoDestino
    );

    if (areaDestino.id_escala_area === atribuicao.id_escala_area) {
      await this._assertPodeGerenciarArea(areaDestino, idUsuarioLogado, tipoUsuario);
      const nova = await EscalaRepository.atualizarAtribuicao(idAtribuicao, { detalhes });
      await EscalaRepository.registrarHistorico({
        id_escala_evento: atribuicao.id_escala_evento,
        id_usuario: idUsuarioLogado,
        acao: ESCALA_HISTORICO_ACAO.MOVIMENTACAO,
        dados_antes: atribuicao,
        dados_depois: nova,
      });
      const evento = await EscalaRepository.buscarEventoPorId(atribuicao.id_escala_evento);
      if (evento?.status === ESCALA_STATUS.PUBLICADA) {
        await this._notificarAtribuicaoAtualizada(
          atribuicao.id_usuario,
          evento,
          areaDestino.nome,
          detalhes
        );
      }
      return {
        sucesso: true,
        mensagem: `${atribuicao.usuario_nome || "Pessoa"} movido(a) para ${validacao.dadosDestino.instrumento}`,
        dados: nova,
      };
    }

    const nova = await this.moverAtribuicao(
      idAtribuicao,
      areaDestino.id_escala_area,
      detalhes,
      idUsuarioLogado,
      tipoUsuario,
      { forcarMovimento: !!body.forcarMovimento }
    );
    return {
      sucesso: true,
      mensagem: `${atribuicao.usuario_nome || "Pessoa"} movido(a) para ${validacao.dadosDestino.evento}`,
      dados: nova,
    };
  }

  async getEscalasDaPessoa(idUsuario, dataInicio, dataFim, solicitante = null) {
    if (!dataInicio || !dataFim) {
      throw new ValidationError("Informe dataInicio e dataFim (YYYY-MM-DD)");
    }
    const parsed = this._parseId(idUsuario);
    const tipo = solicitante?.tipo;
    const ehProprio = solicitante?.id_usuario === parsed;
    // Membro só consulta a própria escala; admin e líderes consultam qualquer pessoa
    if (tipo === USER_TYPES.MEMBER && !ehProprio) {
      throw new ForbiddenError("Você só pode consultar a sua própria escala");
    }
    const usuario = await UsuarioModel.getById(parsed);
    if (!usuario) throw new NotFoundError("Usuário não encontrado");
    const ini = inicioDoDia(dataInicio);
    const fim = fimDoDia(dataFim);
    let rows = await EscalaRepository.listarEscalasDaPessoa(parsed, ini, fim);
    if (!this._podeVerRascunho(tipo)) {
      rows = rows.filter((r) => r.status !== ESCALA_STATUS.RASCUNHO);
    }
    const escalas = rows.map((r) => ({
      id: r.id_escala_atribuicao,
      escalaId: r.id_escala_evento,
      data: dataIsoDeDatetime(r.data_hora),
      diaDaSemana: diaDaSemanaIso(r.data_hora),
      evento: {
        id: r.id_escala_evento,
        nome: r.titulo,
        tipo: tipoEventoPorTitulo(r.titulo),
      },
      horario: `${horaDeDatetime(r.data_hora)} - ${horaDeDatetime(r.data_hora_fim)}`,
      instrumento: chaveSlotDeDetalhes(r.area_nome, r.detalhes),
      area: r.area_nome,
      status: r.status,
    }));
    const porInst = new Map();
    for (const e of escalas) {
      porInst.set(e.instrumento, (porInst.get(e.instrumento) || 0) + 1);
    }
    const total = escalas.length || 1;
    return {
      sucesso: true,
      dados: {
        usuario: {
          id: usuario.id_usuario,
          nome: usuario.nome,
          // E-mail só para o próprio usuário e administradores
          email: ehProprio || tipo === USER_TYPES.ADMIN ? usuario.email : undefined,
        },
        periodo: { dataInicio, dataFim },
        escalas,
        estatisticas: {
          totalEscalas: escalas.length,
          instrumentos: [...porInst.entries()].map(([tipo, quantidade]) => ({
            tipo,
            quantidade,
            percentual: Math.round((quantidade / total) * 1000) / 10,
          })),
          diasEscalado: new Set(escalas.map((e) => e.data)).size,
        },
      },
    };
  }

  async copiarDia(dataOrigem, dataDestino, idUsuario, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    const eventos = await this.getVisaoDia(dataOrigem);
    const criados = [];
    const warnings = [];
    for (const ev of eventos) {
      const hora = (formatarDatetimeLocal(ev.data_hora) || "").slice(11, 19) || "19:00:00";
      const horaFim = ev.data_hora_fim
        ? (formatarDatetimeLocal(ev.data_hora_fim) || "").slice(11, 19)
        : null;
      const result = await this.copiarEvento(
        ev.id_escala_evento,
        {
          data_hora: `${dataDestino} ${hora}`,
          data_hora_fim: horaFim ? `${dataDestino} ${horaFim}` : null,
          titulo: ev.titulo,
        },
        idUsuario,
        tipoUsuario
      );
      criados.push(result.dados);
      warnings.push(...(result.warnings || []));
    }
    return { sucesso: true, dados: criados, warnings };
  }

  // ---------- Validar / Mover / Publicar / Histórico ----------
  async validarAtribuicao(idEvento, body) {
    const parsed = this._parseId(idEvento);
    const evento = await this.getEventoById(parsed);
    const area = await EscalaRepository.buscarAreaPorId(body.id_escala_area);
    if (!area || area.id_escala_evento !== parsed) {
      throw new ValidationError("Área não pertence a este evento");
    }
    const resultado = await ValidadorEscala.validarTodosConflitos({
      idUsuario: body.id_usuario,
      idArea: area.id_escala_area,
      areaNome: area.nome,
      idEvento: parsed,
      dataHora: evento.data_hora,
      dataHoraFim: evento.data_hora_fim,
      detalhes: body.detalhes || null,
      excluirMesmoEventoDoOverlap: true,
      idMinisterioDestino: area.id_ministerio ?? null,
    });
    const conflitos = resultado.conflitos.filter((c) => !c.valido && !c.skip);
    return {
      sucesso: resultado.valido,
      conflitos,
      confirmavel: conflitos.length > 0 && conflitos.every((c) => CONFLITOS_CONFIRMAVEIS.has(c.tipo)),
    };
  }

  async moverAtribuicao(
    idAtribuicao,
    idAreaDestino,
    detalhes,
    idUsuarioLogado,
    tipoUsuario,
    opcoes = {}
  ) {
    const { forcarMovimento = false } = opcoes;
    const parsed = this._parseId(idAtribuicao);
    const atribuicao = await EscalaRepository.buscarAtribuicaoCompleta(parsed);
    if (!atribuicao) throw new NotFoundError("Atribuição não encontrada");

    const areaOrigem = await EscalaRepository.buscarAreaPorId(atribuicao.id_escala_area);
    const areaDestino = await EscalaRepository.buscarAreaPorId(this._parseId(idAreaDestino));
    if (!areaDestino) throw new NotFoundError("Área de destino não encontrada");

    await this._assertPodeGerenciarArea(areaOrigem, idUsuarioLogado, tipoUsuario);
    await this._assertPodeGerenciarArea(areaDestino, idUsuarioLogado, tipoUsuario);

    const eventoDestino = await EscalaRepository.buscarEventoPorId(areaDestino.id_escala_evento);
    const detalhesFinais =
      detalhes && typeof detalhes === "object" ? detalhes : atribuicao.detalhes;

    const { valido, conflitos } = await ValidadorEscala.validarTodosConflitos({
      idUsuario: atribuicao.id_usuario,
      idArea: areaDestino.id_escala_area,
      areaNome: areaDestino.nome,
      idEvento: areaDestino.id_escala_evento,
      dataHora: eventoDestino.data_hora,
      dataHoraFim: eventoDestino.data_hora_fim,
      detalhes: detalhesFinais,
      idAtribuicaoExcluir: parsed,
      excluirMesmoEventoDoOverlap: areaDestino.id_escala_evento === atribuicao.id_escala_evento,
      idMinisterioDestino: areaDestino.id_ministerio ?? null,
    });
    if (!valido) {
      // Mesma área: trocar de função não é "duplo instrumento"
      const relevantes =
        areaDestino.id_escala_area === atribuicao.id_escala_area
          ? conflitos.filter((c) => c.tipo !== "duplo_instrumento")
          : conflitos;
      this._avaliarConflitos(relevantes, forcarMovimento);
    }

    let nova;
    const trx = await knex.transaction();
    try {
      await EscalaRepository.excluirAtribuicao(parsed, trx);
      nova = await EscalaRepository.criarAtribuicao(
        {
          id_escala_area: areaDestino.id_escala_area,
          id_usuario: atribuicao.id_usuario,
          detalhes: detalhesFinais,
        },
        trx
      );
      await EscalaRepository.registrarHistorico(
        {
          id_escala_evento: areaDestino.id_escala_evento,
          id_usuario: idUsuarioLogado,
          acao: ESCALA_HISTORICO_ACAO.MOVIMENTACAO,
          dados_antes: atribuicao,
          dados_depois: nova,
        },
        trx
      );
      await trx.commit();
    } catch (err) {
      await trx.rollback();
      if (err?.code === "ER_DUP_ENTRY") {
        throw new ConflictError("Esta pessoa já está escalada na área de destino");
      }
      throw err;
    }

    // Avisa a pessoa (só sobre escalas publicadas, que ela conhece)
    const mesmoEvento = areaDestino.id_escala_evento === atribuicao.id_escala_evento;
    if (mesmoEvento) {
      if (eventoDestino?.status === ESCALA_STATUS.PUBLICADA) {
        await this._notificarAtribuicaoAtualizada(
          atribuicao.id_usuario,
          eventoDestino,
          areaDestino.nome,
          detalhesFinais
        );
      }
    } else {
      const eventoOrigem = await EscalaRepository.buscarEventoPorId(atribuicao.id_escala_evento);
      if (eventoOrigem?.status === ESCALA_STATUS.PUBLICADA) {
        await this._notificarAtribuicaoRemovida(
          atribuicao.id_usuario,
          eventoOrigem,
          atribuicao.area_nome
        );
      }
      if (eventoDestino?.status === ESCALA_STATUS.PUBLICADA) {
        await this._notificarEscalado(
          atribuicao.id_usuario,
          eventoDestino.id_escala_evento,
          areaDestino.nome,
          detalhesFinais
        );
      }
    }
    return nova;
  }

  async publicarEvento(id, idUsuarioLogado, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    const parsed = this._parseId(id);
    const evento = await this.getEventoById(parsed);
    if (evento.status === ESCALA_STATUS.PUBLICADA) {
      // Já publicada: não reenvia notificações
      return this._enrichEvento(evento);
    }
    const atualizado = await knex.transaction(async (trx) => {
      const ev = await EscalaRepository.atualizarEvento(
        parsed,
        { status: ESCALA_STATUS.PUBLICADA, ativo: true },
        trx
      );
      await EscalaRepository.registrarHistorico(
        {
          id_escala_evento: parsed,
          id_usuario: idUsuarioLogado,
          acao: ESCALA_HISTORICO_ACAO.PUBLICACAO,
          dados_antes: evento,
          dados_depois: ev,
        },
        trx
      );
      return ev;
    });
    // Notificações só depois de gravado (fora da transação)
    await this._notificarPublicacao(atualizado);
    return this._enrichEvento(atualizado);
  }

  async getHistorico(idEvento) {
    const parsed = this._parseId(idEvento);
    await this.getEventoById(parsed);
    return EscalaRepository.listarHistorico(parsed);
  }

  // ---------- Copiar / Templates / Desfazer ----------
  async copiarEvento(id, { data_hora, data_hora_fim, titulo }, idUsuario, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    this._assertHorarioValido(data_hora, data_hora_fim);
    const origem = await this.getEventoCompleto(id);
    const warnings = [];

    const trx = await knex.transaction();
    try {
      const novo = await EscalaRepository.criarEvento(
        {
          titulo: titulo || `${origem.titulo} (cópia)`,
          data_hora: toMysqlDatetime(data_hora),
          data_hora_fim: data_hora_fim ? toMysqlDatetime(data_hora_fim) : null,
          descricao: origem.descricao,
          ativo: true,
          status: ESCALA_STATUS.RASCUNHO,
          id_criador: idUsuario,
        },
        trx
      );

      const idsMin = (origem.ministerios || []).map((m) => m.id_ministerio);
      await EscalaRepository.definirMinisterios(novo.id_escala_evento, idsMin, trx);

      for (const area of origem.areas || []) {
        const novaArea = await EscalaRepository.criarArea(
          {
            id_escala_evento: novo.id_escala_evento,
            nome: area.nome,
            ordem: area.ordem,
            id_ministerio: area.id_ministerio || null,
          },
          trx
        );
        for (const attr of area.atribuicoes || []) {
          if (!(await this._usuarioAtivo(attr.id_usuario))) {
            warnings.push({
              usuario: attr.usuario_nome,
              mensagem: "Não copiado: usuário desativado",
            });
            continue;
          }
          if (!(await this._participaDoMinisterio(attr.id_usuario, area.id_ministerio))) {
            warnings.push({
              usuario: attr.usuario_nome,
              mensagem: `Não copiado: não participa mais do ministério de ${area.nome}`,
            });
            continue;
          }
          const conflito = await EscalaRepository.buscarConflitoHorario(
            attr.id_usuario,
            novo.data_hora,
            novo.data_hora_fim
          );
          if (conflito) {
            warnings.push({
              usuario: attr.usuario_nome,
              mensagem: `Conflito: ${conflito.evento_titulo} / ${conflito.area_nome}`,
            });
            continue;
          }
          await EscalaRepository.criarAtribuicao(
            {
              id_escala_area: novaArea.id_escala_area,
              id_usuario: attr.id_usuario,
              detalhes: attr.detalhes,
            },
            trx
          );
        }
      }

      await EscalaRepository.registrarHistorico(
        {
          id_escala_evento: novo.id_escala_evento,
          id_usuario: idUsuario,
          acao: ESCALA_HISTORICO_ACAO.COPIA,
          dados_antes: { id_origem: origem.id_escala_evento },
          dados_depois: novo,
        },
        trx
      );
      await trx.commit();
      const completo = await this.getEventoCompleto(novo.id_escala_evento);
      return { sucesso: true, dados: completo, warnings };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  async copiarSemana({ data_inicio_origem, data_inicio_destino }, idUsuario, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    const eventos = await this.getVisaoSemana(data_inicio_origem);
    const deltaMs =
      new Date(`${data_inicio_destino}T12:00:00`).getTime() -
      new Date(`${data_inicio_origem}T12:00:00`).getTime();

    const criados = [];
    const warnings = [];
    for (const ev of eventos) {
      const novaData = deslocarDatetime(ev.data_hora, deltaMs);
      const novaFim = ev.data_hora_fim ? deslocarDatetime(ev.data_hora_fim, deltaMs) : null;
      const result = await this.copiarEvento(
        ev.id_escala_evento,
        { data_hora: novaData, data_hora_fim: novaFim },
        idUsuario,
        tipoUsuario
      );
      criados.push(result.dados);
      warnings.push(...(result.warnings || []));
    }
    return { sucesso: true, dados: criados, warnings };
  }

  async listarTemplates() {
    return EscalaRepository.listarTemplates();
  }

  async criarTemplate(body, idUsuario, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    let payload = body.payload;
    if (body.id_escala_evento) {
      const completo = await this.getEventoCompleto(body.id_escala_evento);
      payload = {
        titulo: completo.titulo,
        descricao: completo.descricao,
        id_ministerios: (completo.ministerios || []).map((m) => m.id_ministerio),
        areas: (completo.areas || []).map((a) => ({
          nome: a.nome,
          ordem: a.ordem,
          id_ministerio: a.id_ministerio || null,
          slots: (a.atribuicoes || []).map((at) => ({
            id_usuario: at.id_usuario,
            detalhes: at.detalhes,
          })),
        })),
      };
    }
    if (!payload) throw new ValidationError("Informe payload ou id_escala_evento");
    return EscalaRepository.criarTemplate({
      nome: body.nome,
      id_criador: idUsuario,
      payload,
    });
  }

  async aplicarTemplate(idTemplate, body, idUsuario, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    this._assertHorarioValido(body.data_hora, body.data_hora_fim);
    const template = await EscalaRepository.buscarTemplate(this._parseId(idTemplate));
    if (!template) throw new NotFoundError("Template não encontrado");
    const payload = template.payload || {};
    const warnings = [];

    const trx = await knex.transaction();
    try {
      const evento = await EscalaRepository.criarEvento(
        {
          titulo: body.titulo || payload.titulo || template.nome,
          data_hora: toMysqlDatetime(body.data_hora),
          data_hora_fim: body.data_hora_fim ? toMysqlDatetime(body.data_hora_fim) : null,
          descricao: payload.descricao || null,
          ativo: true,
          status: ESCALA_STATUS.RASCUNHO,
          id_criador: idUsuario,
        },
        trx
      );
      await EscalaRepository.definirMinisterios(
        evento.id_escala_evento,
        payload.id_ministerios || [],
        trx
      );
      for (const area of payload.areas || []) {
        const novaArea = await EscalaRepository.criarArea(
          {
            id_escala_evento: evento.id_escala_evento,
            nome: area.nome,
            ordem: area.ordem || 0,
            id_ministerio: area.id_ministerio || null,
          },
          trx
        );
        for (const slot of area.slots || []) {
          if (!(await this._usuarioAtivo(slot.id_usuario))) {
            warnings.push({
              id_usuario: slot.id_usuario,
              usuario: await this._nomeUsuario(slot.id_usuario),
              mensagem: "Não incluído: usuário desativado ou removido",
            });
            continue;
          }
          if (!(await this._participaDoMinisterio(slot.id_usuario, area.id_ministerio))) {
            warnings.push({
              id_usuario: slot.id_usuario,
              usuario: await this._nomeUsuario(slot.id_usuario),
              mensagem: `Não incluído: não participa mais do ministério de ${area.nome}`,
            });
            continue;
          }
          const conflito = await EscalaRepository.buscarConflitoHorario(
            slot.id_usuario,
            evento.data_hora,
            evento.data_hora_fim
          );
          if (conflito) {
            warnings.push({
              id_usuario: slot.id_usuario,
              usuario: await this._nomeUsuario(slot.id_usuario),
              mensagem: `Conflito: ${conflito.evento_titulo}`,
            });
            continue;
          }
          await EscalaRepository.criarAtribuicao(
            {
              id_escala_area: novaArea.id_escala_area,
              id_usuario: slot.id_usuario,
              detalhes: slot.detalhes,
            },
            trx
          );
        }
      }
      await trx.commit();
      const completo = await this.getEventoCompleto(evento.id_escala_evento);
      return { sucesso: true, dados: completo, warnings };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  async excluirTemplate(id, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    const tpl = await EscalaRepository.buscarTemplate(this._parseId(id));
    if (!tpl) throw new NotFoundError("Template não encontrado");
    await EscalaRepository.excluirTemplate(tpl.id_escala_template);
  }

  async atualizarTemplate(id, body, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    const tpl = await EscalaRepository.buscarTemplate(this._parseId(id));
    if (!tpl) throw new NotFoundError("Template não encontrado");

    const dados = {};
    if (body.nome != null && String(body.nome).trim()) {
      dados.nome = String(body.nome).trim();
    }

    if (body.id_escala_evento) {
      const completo = await this.getEventoCompleto(body.id_escala_evento);
      dados.payload = {
        titulo: completo.titulo,
        descricao: completo.descricao,
        id_ministerios: (completo.ministerios || []).map((m) => m.id_ministerio),
        areas: (completo.areas || []).map((a) => ({
          nome: a.nome,
          ordem: a.ordem,
          id_ministerio: a.id_ministerio || null,
          slots: (a.atribuicoes || []).map((at) => ({
            id_usuario: at.id_usuario,
            detalhes: at.detalhes,
          })),
        })),
      };
    } else if (body.payload) {
      dados.payload = body.payload;
    }

    return EscalaRepository.atualizarTemplate(tpl.id_escala_template, dados);
  }

  async desfazerUltimaAlteracao(idEvento, idUsuarioLogado, tipoUsuario) {
    this._assertAdmin(tipoUsuario);
    const parsed = this._parseId(idEvento);
    await this.getEventoById(parsed);
    const ultimo = await EscalaRepository.ultimoHistoricoDesfazivel(parsed);
    if (!ultimo) {
      throw new ValidationError("Não há alteração para desfazer");
    }

    // Datas do snapshot JSON vêm como ISO (UTC); converte de volta para o horário local
    const dataDoSnapshot = (v) => (v ? toMysqlDatetime(new Date(v)) : null);
    const recriar = async (a) => {
      // Antes de recolocar a pessoa, confere se isso não cria choque de horário ou duplicidade
      const area = await EscalaRepository.buscarAreaPorId(a.id_escala_area);
      if (!area) throw new ValidationError("A área original não existe mais; não é possível desfazer");
      const ev = await EscalaRepository.buscarEventoPorId(area.id_escala_evento);
      const { conflitos } = await ValidadorEscala.validarTodosConflitos({
        idUsuario: a.id_usuario,
        idArea: area.id_escala_area,
        areaNome: area.nome,
        idEvento: area.id_escala_evento,
        dataHora: ev?.data_hora,
        dataHoraFim: ev?.data_hora_fim,
        detalhes: null,
        excluirMesmoEventoDoOverlap: true,
        idMinisterioDestino: area.id_ministerio ?? null,
      });
      // Dentro do próprio evento, desfazer só restaura o estado anterior (inclusive exceções
      // já confirmadas). O que não pode é criar choque com OUTRO evento marcado nesse meio tempo.
      const bloqueios = conflitos.filter((c) => !c.valido && !c.skip && c.tipo === "duplo_evento");
      if (bloqueios.length) {
        const err = new ConflictError(
          `Não dá para desfazer: ${bloqueios[0].mensagem} Ajuste a escala manualmente.`
        );
        err.conflitos = bloqueios.map((c) => ({ tipo: c.tipo, mensagem: c.mensagem }));
        err.confirmavel = false;
        throw err;
      }
      try {
        await EscalaRepository.criarAtribuicao({
          id_escala_area: a.id_escala_area,
          id_usuario: a.id_usuario,
          detalhes: a.detalhes,
        });
      } catch (err) {
        if (err?.code === "ER_DUP_ENTRY") return; // já existe: nada a restaurar
        if (err?.code === "ER_NO_REFERENCED_ROW_2") {
          throw new ValidationError("A área original não existe mais; não é possível desfazer");
        }
        throw err;
      }
    };

    switch (ultimo.acao) {
      case ESCALA_HISTORICO_ACAO.ATRIBUICAO:
        if (!ultimo.dados_depois?.id_escala_atribuicao) {
          throw new ValidationError("Não foi possível identificar a atribuição a desfazer");
        }
        await EscalaRepository.excluirAtribuicao(ultimo.dados_depois.id_escala_atribuicao);
        break;
      case ESCALA_HISTORICO_ACAO.REMOCAO_ATRIBUICAO:
        await recriar(ultimo.dados_antes);
        break;
      case ESCALA_HISTORICO_ACAO.EDICAO:
        if (ultimo.dados_antes?.id_escala_atribuicao) {
          // Edição de função/detalhes de uma pessoa
          await EscalaRepository.atualizarAtribuicao(ultimo.dados_antes.id_escala_atribuicao, {
            detalhes: ultimo.dados_antes.detalhes || {},
          });
        } else if (ultimo.dados_antes?.titulo) {
          await EscalaRepository.atualizarEvento(parsed, {
            titulo: ultimo.dados_antes.titulo,
            data_hora: dataDoSnapshot(ultimo.dados_antes.data_hora),
            data_hora_fim: dataDoSnapshot(ultimo.dados_antes.data_hora_fim),
            descricao: ultimo.dados_antes.descricao,
            ativo: ultimo.dados_antes.ativo,
            status: ultimo.dados_antes.status,
          });
        } else {
          throw new ValidationError("Esta edição não pode ser desfeita automaticamente");
        }
        break;
      case ESCALA_HISTORICO_ACAO.MOVIMENTACAO:
        if (ultimo.dados_depois?.id_escala_atribuicao) {
          await EscalaRepository.excluirAtribuicao(ultimo.dados_depois.id_escala_atribuicao);
        }
        await recriar(ultimo.dados_antes);
        break;
      default:
        throw new ValidationError("Este tipo de alteração não pode ser desfeito automaticamente");
    }

    await EscalaRepository.registrarHistorico({
      id_escala_evento: parsed,
      id_usuario: idUsuarioLogado,
      acao: ESCALA_HISTORICO_ACAO.DESFAZER,
      dados_antes: { acao_desfeita: ultimo.acao },
      dados_depois: { desfeito_id: ultimo.id_escala_historico },
    });

    return this.getEventoCompleto(parsed);
  }

  // ---------- Helpers ----------
  /**
   * Bloqueia se houver conflito. Conflitos "confirmáveis" passam quando o usuário
   * confirmou a exceção (confirmar = true); retorna os conflitos aceitos.
   */
  _avaliarConflitos(conflitos, confirmar = false) {
    const bloqueios = (conflitos || []).filter((c) => c && !c.valido && !c.skip);
    if (!bloqueios.length) return [];
    const confirmavel = bloqueios.every((c) => CONFLITOS_CONFIRMAVEIS.has(c.tipo));
    if (confirmavel && confirmar) return bloqueios;
    const err = new ConflictError(bloqueios[0]?.mensagem || "Conflito na escala");
    err.conflitos = bloqueios.map((c) => ({
      tipo: c.tipo,
      mensagem: c.mensagem,
      sugestao: c.sugestao || null,
    }));
    err.confirmavel = confirmavel;
    throw err;
  }

  /** Notificações da publicação: escalados recebem a escala; demais membros, o evento */
  async _notificarPublicacao(evento) {
    const idEvento = evento.id_escala_evento;
    const atribuicoes = await EscalaRepository.listarAtribuicoesPorEvento(idEvento);
    const escalados = new Set(atribuicoes.map((a) => a.id_usuario));
    const dataFmt = formatarDataHoraPtBr(evento.data_hora);

    // Uma inserção para todos (antes: 2 consultas por pessoa)
    await NotificacaoModel.createMany(
      atribuicoes.map((attr) => ({
        id_usuario: attr.id_usuario,
        tipo: "escalado",
        id_escala_evento: idEvento,
        titulo: `Você foi escalado(a) para ${evento.titulo}`,
        mensagem: `${attr.area_nome} • ${dataFmt}`,
        area_nome: attr.area_nome,
      }))
    );
    const contatos = await this._contatosWhatsApp([...escalados]);
    for (const attr of atribuicoes) {
      const c = contatos.get(attr.id_usuario);
      if (!c) continue;
      WhatsAppService.notificarEscalacao(c, evento, attr.area_nome, attr.detalhes).catch((err) =>
        console.error("[WhatsApp] Erro ao notificar escalação:", err?.message || err)
      );
    }

    const ministerios = await EscalaRepository.listarMinisteriosPorEvento(idEvento);
    const idsMin = ministerios.map((m) => m.id_ministerio);
    if (idsMin.length) {
      await this._notificarEventoCriado(evento, idsMin, escalados);
    }
  }

  _assertAdmin(tipoUsuario) {
    if (tipoUsuario !== USER_TYPES.ADMIN) {
      throw new ForbiddenError("Apenas administradores podem realizar esta ação");
    }
  }

  async _assertPodeGerenciarArea(area, idUsuarioLogado, tipoUsuario) {
    if (!area) throw new NotFoundError("Área não encontrada");
    if (tipoUsuario === USER_TYPES.ADMIN) return;

    if (tipoUsuario !== USER_TYPES.LEADER) {
      throw new ForbiddenError("Sem permissão para gerenciar esta área");
    }

    const meus = await MinisterioModel.getMinisteriosByUsuario(idUsuarioLogado);
    const idsMeus = meus.map((m) => m.id_ministerio);

    let idMin = area.id_ministerio;
    if (!idMin) {
      const min = await EscalaRepository.buscarMinisterioPorNome(area.nome);
      idMin = min?.id_ministerio;
    }
    if (!idMin || !idsMeus.includes(idMin)) {
      throw new ForbiddenError("Você só pode gerenciar ministérios em que é líder");
    }

    const ministeriosEvento = await EscalaRepository.listarMinisteriosPorEvento(area.id_escala_evento);
    const idsEvento = ministeriosEvento.map((m) => m.id_ministerio);
    if (!idsEvento.some((id) => idsMeus.includes(id))) {
      throw new ForbiddenError("Você não é líder de nenhum ministério deste evento");
    }
  }

  /** Líder só escala, na área, pessoas que participam do ministério DAQUELA área */
  async _assertUsuarioNoMinisterioDoLider(idUsuario, idLider, area) {
    let idMin = area?.id_ministerio;
    if (!idMin) {
      const min = await EscalaRepository.buscarMinisterioPorNome(area?.nome);
      idMin = min?.id_ministerio;
    }
    const meus = await MinisterioModel.getMinisteriosByUsuario(idLider);
    if (!idMin || !meus.some((m) => m.id_ministerio === idMin)) {
      throw new ForbiddenError("Você só pode escalar nos ministérios em que é líder");
    }
    if (!(await this._participaDoMinisterio(idUsuario, idMin))) {
      throw new ValidationError(`Esta pessoa não participa do ministério de ${area.nome}`);
    }
  }

  /** true se a pessoa participa do ministério (área sem ministério vinculado: não restringe) */
  async _participaDoMinisterio(idUsuario, idMinisterio) {
    if (!idMinisterio) return true;
    const row = await knex("usuario_ministerio")
      .where({ id_usuario: idUsuario, id_ministerio: idMinisterio })
      .first();
    if (row) return true;
    // Líder do ministério também pode servir nele
    return Boolean(
      await knex("ministerio_lider").where({ id_usuario: idUsuario, id_ministerio: idMinisterio }).first()
    );
  }

  /** Término precisa ser depois do início (evento de duração zero nunca entraria em conflito) */
  _assertHorarioValido(dataHora, dataHoraFim) {
    if (!dataHora) throw new ValidationError("Informe a data e o horário do evento");
    // Aceita Date (vindo do banco) ou texto "AAAA-MM-DD HH:MM[:SS]" / ISO (vindo da tela)
    const ms = (v) => (v instanceof Date ? v.getTime() : new Date(String(v).replace(" ", "T")).getTime());
    const ini = ms(dataHora);
    if (Number.isNaN(ini)) throw new ValidationError("Data/horário de início inválido");
    if (dataHoraFim) {
      const fim = ms(dataHoraFim);
      if (Number.isNaN(fim)) throw new ValidationError("Horário de término inválido");
      if (fim <= ini) throw new ValidationError("O horário de término precisa ser depois do início");
    }
  }

  async _nomeUsuario(idUsuario) {
    const u = await knex("usuario").where({ id_usuario: idUsuario }).select("nome").first();
    return u?.nome || null;
  }

  async _usuarioAtivo(idUsuario) {
    const u = await knex("usuario").where({ id_usuario: idUsuario }).select("ativo").first();
    return Boolean(u?.ativo);
  }

  _parseId(id) {
    const parsed = Number(id);
    if (isNaN(parsed) || parsed <= 0) throw new ValidationError("ID inválido");
    return parsed;
  }

  async _enrichEvento(evento) {
    const areas = await EscalaRepository.listarAreasPorEvento(evento.id_escala_evento);
    const ministerios = await EscalaRepository.listarMinisteriosPorEvento(evento.id_escala_evento);
    return { ...evento, areas, ministerios };
  }

  async _notificarEventoCriado(evento, idMinisterios, ignorarIds = new Set()) {
    const rows = await knex("usuario_ministerio")
      .whereIn("id_ministerio", idMinisterios)
      .distinct("id_usuario")
      .select("id_usuario");
    const idsUsuarios = [...new Set(rows.map((r) => r.id_usuario))];
    const usuariosAtivosRows = await knex("usuario")
      .whereIn("id_usuario", idsUsuarios.length ? idsUsuarios : [0])
      .where("ativo", true)
      .select("id_usuario");
    const dataFmt = formatarDataHoraPtBr(evento.data_hora);
    await NotificacaoModel.createMany(
      usuariosAtivosRows
        .filter(({ id_usuario: idU }) => !ignorarIds.has(idU))
        .map(({ id_usuario: idU }) => ({
          id_usuario: idU,
          tipo: "evento_criado",
          id_escala_evento: evento.id_escala_evento,
          titulo: `Novo evento: ${evento.titulo}`,
          mensagem: `${dataFmt}. Veja os detalhes na Escala.`,
        }))
    );
  }

  /** Nome e telefone de quem pode receber WhatsApp (uma consulta para todos) */
  async _contatosWhatsApp(idsUsuarios) {
    const mapa = new Map();
    if (!WhatsAppService.estaConfigurado() || !idsUsuarios?.length) return mapa;
    const rows = await knex("usuario")
      .whereIn("id_usuario", idsUsuarios)
      .where("ativo", true)
      .whereNotNull("telefone")
      .where("telefone", "!=", "")
      .select("id_usuario", "nome", "telefone");
    for (const r of rows) mapa.set(r.id_usuario, { nome: r.nome, telefone: r.telefone });
    return mapa;
  }

  async _notificarEscalado(idUsuario, idEvento, areaNome, detalhesAtribuicao = null) {
    const evento = await EscalaRepository.buscarEventoPorId(idEvento);
    if (!evento) return;
    const dataFmt = formatarDataHoraPtBr(evento.data_hora);
    await NotificacaoModel.create({
      id_usuario: idUsuario,
      tipo: "escalado",
      id_escala_evento: idEvento,
      titulo: `Você foi escalado(a) para ${evento.titulo}`,
      mensagem: `${areaNome} • ${dataFmt}`,
      area_nome: areaNome,
    });

    if (WhatsAppService.estaConfigurado()) {
      const usuario = await UsuarioModel.getById(idUsuario);
      if (usuario?.telefone) {
        // Não aguarda: a mensagem entra na fila do WhatsApp e a tela responde na hora
        WhatsAppService.notificarEscalacao(
          { nome: usuario.nome, telefone: usuario.telefone },
          {
            titulo: evento.titulo,
            data_hora: evento.data_hora,
            data_hora_fim: evento.data_hora_fim,
            descricao: evento.descricao,
          },
          areaNome,
          detalhesAtribuicao
        )
          .then((r) => {
            if (!r?.ok) console.error("[WhatsApp] Escalação não enviada:", r?.error);
          })
          .catch((err) => console.error("[WhatsApp] Erro ao notificar escalação:", err?.message || err));
      }
    }
  }

  async _notificarAtribuicaoAtualizada(idUsuario, evento, areaNome, detalhesNovos) {
    await NotificacaoModel.create({
      id_usuario: idUsuario,
      tipo: "escala_atualizada",
      id_escala_evento: evento?.id_escala_evento,
      titulo: `Atualização na sua escala: ${evento?.titulo}`,
      mensagem: `Sua participação em ${areaNome} foi atualizada. Confira os detalhes no sistema.`,
      area_nome: areaNome,
    });
    if (WhatsAppService.estaConfigurado()) {
      const usuario = await UsuarioModel.getById(idUsuario);
      if (usuario?.telefone) {
        WhatsAppService.notificarAtribuicaoAtualizada(
          { nome: usuario.nome, telefone: usuario.telefone },
          evento,
          areaNome,
          detalhesNovos
        ).catch((err) => console.error("[WhatsApp] Erro ao notificar atualização:", err?.message || err));
      }
    }
  }

  async _notificarAtribuicaoRemovida(idUsuario, evento, areaNome) {
    await NotificacaoModel.create({
      id_usuario: idUsuario,
      tipo: "escala_removida",
      id_escala_evento: evento?.id_escala_evento,
      titulo: `Você foi removido(a) da escala: ${evento?.titulo}`,
      mensagem: `Área ${areaNome}. Entre em contato com a liderança em caso de dúvidas.`,
      area_nome: areaNome,
    });
    if (WhatsAppService.estaConfigurado()) {
      const usuario = await UsuarioModel.getById(idUsuario);
      if (usuario?.telefone) {
        WhatsAppService.notificarAtribuicaoRemovida(
          { nome: usuario.nome, telefone: usuario.telefone },
          evento,
          areaNome
        ).catch((err) => console.error("[WhatsApp] Erro ao notificar remoção:", err?.message || err));
      }
    }
  }

  async _notificarEventoAtualizadoParaEscalados(atribuicoes, evento, areasSubstituidas = false) {
    await NotificacaoModel.createMany(
      atribuicoes.map((attr) => ({
        id_usuario: attr.id_usuario,
        tipo: "evento_atualizado",
        id_escala_evento: evento?.id_escala_evento,
        titulo: `Evento atualizado: ${evento?.titulo}`,
        mensagem: areasSubstituidas
          ? "O evento teve alterações nas áreas. Confira no sistema se sua participação foi mantida."
          : `Sua participação em ${attr.area_nome} continua confirmada. Confira as alterações no sistema.`,
        area_nome: attr.area_nome,
      }))
    );
    const contatos = await this._contatosWhatsApp(atribuicoes.map((a) => a.id_usuario));
    for (const attr of atribuicoes) {
      const c = contatos.get(attr.id_usuario);
      if (!c) continue;
      WhatsAppService.notificarEventoAtualizado(
        c,
        evento,
        attr.area_nome,
        areasSubstituidas ? null : attr.detalhes
      ).catch((err) => console.error("[WhatsApp] Erro ao notificar evento atualizado:", err?.message || err));
    }
  }

  async _notificarEventoCanceladoParaEscalados(atribuicoes, evento) {
    const dataFmt = formatarDataHoraPtBr(evento?.data_hora);
    await NotificacaoModel.createMany(
      atribuicoes.map((attr) => ({
        id_usuario: attr.id_usuario,
        tipo: "evento_cancelado",
        id_escala_evento: null,
        titulo: `Evento cancelado: ${evento?.titulo}`,
        mensagem: "O evento foi removido da escala. Você não precisa se apresentar.",
        area_nome: attr.area_nome,
      }))
    );
    // Uma mensagem por pessoa, mesmo que ela estivesse em mais de uma função
    const contatos = await this._contatosWhatsApp([...new Set(atribuicoes.map((a) => a.id_usuario))]);
    for (const c of contatos.values()) {
      WhatsAppService.notificarEventoCancelado(c, evento?.titulo || "Evento", dataFmt).catch((err) =>
        console.error("[WhatsApp] Erro ao notificar evento cancelado:", err?.message || err)
      );
    }
  }
}

export default new EscalaService();
