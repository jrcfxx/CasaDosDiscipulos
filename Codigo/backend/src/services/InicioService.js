import knex from "../database/index.js";
import ModuloService from "./ModuloService.js";
import NivelModel from "../models/NivelModel.js";

/**
 * Resumo personalizado para o início do Portal do Discípulo, numa requisição só:
 * próximas escalas publicadas da pessoa, módulo para continuar, progresso, palavra do dia
 * e notificações não lidas.
 */
const InicioService = {
  async getResumo(id_usuario) {
    const [usuario, escalas, modulos, palavra, naoLidas] = await Promise.all([
      knex("usuario").where({ id_usuario }).select("nome", "pontuacao").first(),
      this._proximasEscalas(id_usuario),
      ModuloService.getActiveWithProgress(id_usuario),
      this._palavraDoDia(),
      knex("notificacao").where({ id_usuario, lido: false }).count({ n: "*" }).first(),
    ]);

    const lista = modulos?.modulos ?? [];
    const obrigatorios = lista.filter((m) => m.obrigatorio !== false && m.obrigatorio !== 0);
    const concluidos = obrigatorios.filter((m) => m.status === "concluido").length;
    const proximo = await this._moduloParaContinuar(lista, id_usuario);

    let nivelNome = modulos?.nivel_escola_nome ?? null;
    if (!nivelNome && modulos?.nivel_escola) {
      nivelNome = (await NivelModel.findById(modulos.nivel_escola))?.nome ?? null;
    }

    return {
      primeiro_nome: String(usuario?.nome || "").trim().split(/\s+/)[0] || null,
      pontuacao: Number(usuario?.pontuacao || 0),
      nivel: nivelNome,
      escola: { concluidos, total: obrigatorios.length },
      modulo_para_continuar: proximo,
      proximas_escalas: escalas,
      palavra_do_dia: palavra,
      notificacoes_nao_lidas: Number(naoLidas?.n || 0),
    };
  },

  /** Até 3 escalas futuras e publicadas em que a pessoa está escalada */
  async _proximasEscalas(id_usuario) {
    const linhas = await knex("escala_atribuicao as at")
      .join("escala_area as ar", "ar.id_escala_area", "at.id_escala_area")
      .join("escala_evento as ev", "ev.id_escala_evento", "ar.id_escala_evento")
      .where("at.id_usuario", id_usuario)
      .where("ev.status", "publicada")
      .where("ev.ativo", true)
      .where("ev.data_hora", ">=", knex.raw("NOW()"))
      .orderBy("ev.data_hora", "asc")
      .limit(3)
      .select("ev.id_escala_evento", "ev.titulo", "ev.data_hora", "ar.nome as area");
    return linhas.map((l) => ({
      id_escala_evento: l.id_escala_evento,
      titulo: l.titulo,
      data_hora: l.data_hora,
      area: l.area,
    }));
  },

  /** Primeiro módulo não concluído que a pessoa já pode fazer */
  async _moduloParaContinuar(modulos, id_usuario) {
    for (const m of modulos) {
      if (m.status === "concluido") continue;
      if (await ModuloService.podeAcessarModulo(m.id_modulo, id_usuario)) {
        return { id_modulo: m.id_modulo, titulo: m.titulo, status: m.status, nivel: m.nivel_nome ?? null };
      }
    }
    return null;
  },

  /** Palavra do dia mais recente (até hoje) */
  async _palavraDoDia() {
    const post = await knex("fala_ai_post")
      .where({ tipo: "palavra_do_dia" })
      .where("data_publicacao", "<=", knex.raw("CURDATE()"))
      .orderBy("data_publicacao", "desc")
      .orderBy("id_post", "desc")
      .first("conteudo", "referencia", "data_publicacao");
    if (!post) return null;
    // Remove a marca dos dados de teste, se houver
    const d = post.data_publicacao instanceof Date ? post.data_publicacao : new Date(post.data_publicacao);
    const data = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { texto: String(post.conteudo).replace(/^\[TESTE\]\s*/, ""), referencia: post.referencia, data };
  },
};

export default InicioService;
