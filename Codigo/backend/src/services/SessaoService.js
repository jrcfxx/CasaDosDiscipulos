import crypto from "node:crypto";
import knex from "../database/index.js";
import { USER_TYPES } from "../utils/constants.js";
import { ipDaRequisicao, userAgentDaRequisicao, descreverDispositivo } from "./RegistroSegurancaService.js";

/**
 * Sessões no servidor: cada login cria uma linha em "sessao" e o id dela vai dentro do token.
 * A cada requisição o servidor confere se a sessão existe, não foi encerrada e não ficou parada demais.
 * Assim dá para derrubar um aparelho na hora (perdeu o celular, saiu da liderança...).
 *
 * Prazos (admin tem acesso aos dados de todos os membros, então a sessão dele dura menos):
 *  - membro/líder: encerra após 7 dias sem uso, ou 30 dias no máximo;
 *  - administrador: encerra após 8 horas sem uso, ou 7 dias no máximo.
 */
const HORA = 60 * 60;
export const PRAZOS_SESSAO = Object.freeze({
  padrao: { ociosaSeg: 7 * 24 * HORA, maximaSeg: 30 * 24 * HORA },
  administrador: { ociosaSeg: 8 * HORA, maximaSeg: 7 * 24 * HORA },
});
/** Aparelhos conectados ao mesmo tempo por pessoa; o mais antigo sai quando passa disso */
export const MAX_SESSOES_POR_USUARIO = 10;
/** Grava o "último uso" no máximo a cada 5 minutos (evita uma escrita por requisição) */
const INTERVALO_ATUALIZACAO_SEG = 5 * 60;

export function prazosDoTipo(tipo) {
  return tipo === USER_TYPES.ADMIN ? PRAZOS_SESSAO.administrador : PRAZOS_SESSAO.padrao;
}

export const MOTIVOS_REVOGACAO = Object.freeze({
  LOGOUT: "logout",
  SENHA_ALTERADA: "senha_alterada",
  SENHA_REDEFINIDA: "senha_redefinida",
  PELO_USUARIO: "encerrada_pelo_usuario",
  PELO_ADMIN: "encerrada_pelo_admin",
  CONTA_DESATIVADA: "conta_desativada",
  LIMITE_APARELHOS: "limite_de_aparelhos",
  DOIS_FATORES: "2fa_alterado",
});

const SessaoService = {
  /** Cria a sessão de um login. @returns {Promise<{ id_sessao: string, maximaSeg: number }>} */
  async criar(usuario, req) {
    const id_sessao = crypto.randomBytes(32).toString("base64url");
    const { maximaSeg } = prazosDoTipo(usuario.tipo);
    const user_agent = userAgentDaRequisicao(req);
    await knex("sessao").insert({
      id_sessao,
      id_usuario: usuario.id_usuario,
      ip: ipDaRequisicao(req),
      user_agent,
      dispositivo: descreverDispositivo(user_agent),
      expira_em: knex.raw("NOW() + INTERVAL ? SECOND", [maximaSeg]),
    });

    // Limite de aparelhos: encerra as mais antigas além do limite
    const ativas = await knex("sessao")
      .where({ id_usuario: usuario.id_usuario })
      .whereNull("revogada_em")
      .orderBy("ultimo_uso", "desc")
      .select("id_sessao");
    const excedentes = ativas.slice(MAX_SESSOES_POR_USUARIO).map((s) => s.id_sessao);
    if (excedentes.length) await this.revogar(excedentes, MOTIVOS_REVOGACAO.LIMITE_APARELHOS);

    return { id_sessao, maximaSeg };
  },

  /**
   * Usuário + sessão numa consulta só (chamado em toda requisição autenticada).
   * @returns {Promise<null|{ usuario: object, sessao: object, motivo: string|null }>}
   */
  async carregar(id_sessao) {
    if (!id_sessao) return null;
    const linha = await knex("sessao as s")
      .join("usuario as u", "u.id_usuario", "s.id_usuario")
      .where("s.id_sessao", String(id_sessao))
      .select(
        "u.id_usuario", "u.tipo", "u.ativo", "u.trocar_senha", "u.sessao_versao",
        "s.id_sessao", "s.revogada_em", "s.motivo_revogacao",
        knex.raw("s.expira_em <= NOW() AS expirada"),
        knex.raw("TIMESTAMPDIFF(SECOND, s.ultimo_uso, NOW()) AS ociosa_seg")
      )
      .first();
    if (!linha) return null;

    const { ociosaSeg } = prazosDoTipo(linha.tipo);
    let motivo = null;
    if (linha.revogada_em) motivo = linha.motivo_revogacao || "encerrada";
    else if (Number(linha.expirada)) motivo = "expirada";
    else if (Number(linha.ociosa_seg) > ociosaSeg) motivo = "ociosa";

    return { usuario: linha, sessao: linha, motivo };
  },

  /** Marca uso recente (sem esperar; falha aqui não atrapalha a requisição) */
  tocar(id_sessao, ociosaSeg) {
    if (Number(ociosaSeg) < INTERVALO_ATUALIZACAO_SEG) return;
    knex("sessao")
      .where({ id_sessao })
      .whereNull("revogada_em")
      .update({ ultimo_uso: knex.fn.now() })
      .catch(() => {});
  },

  async revogar(ids, motivo) {
    const lista = [].concat(ids).filter(Boolean);
    if (!lista.length) return 0;
    return knex("sessao")
      .whereIn("id_sessao", lista)
      .whereNull("revogada_em")
      .update({ revogada_em: knex.fn.now(), motivo_revogacao: motivo });
  },

  /** Encerra todas as sessões de uma pessoa (menos, opcionalmente, a atual) */
  async revogarDoUsuario(id_usuario, motivo, { exceto = null } = {}) {
    const q = knex("sessao").where({ id_usuario }).whereNull("revogada_em");
    if (exceto) q.whereNot("id_sessao", exceto);
    return q.update({ revogada_em: knex.fn.now(), motivo_revogacao: motivo });
  },

  /** Sessões abertas (não encerradas, não expiradas) */
  ativasQuery() {
    return knex("sessao as s")
      .whereNull("s.revogada_em")
      .where("s.expira_em", ">", knex.fn.now());
  },

  async listarDoUsuario(id_usuario, id_sessao_atual = null) {
    const linhas = await this.ativasQuery()
      .where("s.id_usuario", id_usuario)
      .orderBy("s.ultimo_uso", "desc")
      .select("s.id_sessao", "s.ip", "s.dispositivo", "s.criada_em", "s.ultimo_uso");
    return linhas.map((s) => ({ ...publica(s), atual: s.id_sessao === id_sessao_atual }));
  },

  async listarTodas() {
    const linhas = await this.ativasQuery()
      .join("usuario as u", "u.id_usuario", "s.id_usuario")
      .orderBy("s.ultimo_uso", "desc")
      .limit(500)
      .select("s.id_sessao", "s.ip", "s.dispositivo", "s.criada_em", "s.ultimo_uso",
        "u.id_usuario", "u.nome", "u.email", "u.tipo");
    return linhas.map(publica);
  },

  /** Já entrou deste tipo de aparelho nos últimos 90 dias? (para avisar acesso novo) */
  async aparelhoConhecido(id_usuario, dispositivo, exceto) {
    const linha = await knex("sessao")
      .where({ id_usuario, dispositivo })
      .whereNot("id_sessao", exceto)
      .where("criada_em", ">", knex.raw("NOW() - INTERVAL 90 DAY"))
      .first("id_sessao");
    return Boolean(linha);
  },

  async jaTeveSessao(id_usuario, exceto) {
    const linha = await knex("sessao").where({ id_usuario }).whereNot("id_sessao", exceto).first("id_sessao");
    return Boolean(linha);
  },
};

/**
 * O id da sessão é o que autentica: nunca sai inteiro para a tela.
 * Para encerrar, a tela usa a "referência" (hash curto), não o id real.
 */
export function referenciaSessao(id_sessao) {
  return crypto.createHash("sha256").update(String(id_sessao)).digest("base64url").slice(0, 22);
}

function publica(s) {
  const { id_sessao, ...resto } = s;
  return { ...resto, referencia: referenciaSessao(id_sessao) };
}

/** Converte referência → id real, só entre as sessões permitidas */
export async function resolverReferencia(referencia, { id_usuario = null } = {}) {
  const q = SessaoService.ativasQuery().select("s.id_sessao");
  if (id_usuario) q.where("s.id_usuario", id_usuario);
  const ids = await q;
  return ids.map((r) => r.id_sessao).find((id) => referenciaSessao(id) === String(referencia)) || null;
}

export default SessaoService;
