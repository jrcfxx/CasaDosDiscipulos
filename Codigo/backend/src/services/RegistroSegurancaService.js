import knex from "../database/index.js";

/**
 * Registro de segurança (tabela log_seguranca): quem entrou, quem errou a senha, de onde,
 * e o que o admin fez nas contas. Nunca guarda senha, código ou token.
 *
 * Registrar nunca derruba a requisição: se o banco falhar, só avisa no log do servidor.
 */

export const EVENTOS = Object.freeze({
  LOGIN: "login",
  LOGIN_2FA_PENDENTE: "login_2fa_pendente",
  LOGOUT: "logout",
  CONTA_BLOQUEADA: "conta_bloqueada",
  CONTA_DESBLOQUEADA: "conta_desbloqueada",
  SENHA_ALTERADA: "senha_alterada",
  SENHA_REDEFINIDA: "senha_redefinida",
  EMAIL_ALTERADO: "email_alterado",
  SESSAO_ENCERRADA: "sessao_encerrada",
  SESSOES_ENCERRADAS: "sessoes_encerradas",
  DOIS_FATORES_ATIVADO: "2fa_ativado",
  DOIS_FATORES_DESATIVADO: "2fa_desativado",
  DOIS_FATORES_REMOVIDO: "2fa_removido_admin",
  CODIGOS_RECUPERACAO_GERADOS: "2fa_codigos_gerados",
  CODIGO_RECUPERACAO_USADO: "2fa_codigo_recuperacao",
  USUARIO_CRIADO: "usuario_criado",
  USUARIO_EDITADO: "usuario_editado",
  PERMISSAO_ALTERADA: "permissao_alterada",
  USUARIO_ATIVADO: "usuario_ativado",
  USUARIO_DESATIVADO: "usuario_desativado",
  ACESSO_NEGADO: "acesso_negado",
});

/** IP real (atrás do Nginx usa X-Forwarded-For via "trust proxy") */
export function ipDaRequisicao(req) {
  const ip = String(req?.ip || req?.socket?.remoteAddress || "").replace(/^::ffff:/, "");
  return ip.slice(0, 45) || null;
}

export function userAgentDaRequisicao(req) {
  const ua = req?.headers?.["user-agent"];
  return ua ? String(ua).slice(0, 255) : null;
}

/** "Chrome no Windows", "Safari no iPhone"... para a pessoa reconhecer o aparelho */
export function descreverDispositivo(userAgent) {
  const ua = String(userAgent || "");
  if (!ua) return "Aparelho desconhecido";
  const navegador =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\/|Opera/.test(ua) ? "Opera" :
    /SamsungBrowser/.test(ua) ? "Samsung Internet" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" :
    /node|curl|axios|undici|postman/i.test(ua) ? "Programa" : "Navegador";
  const sistema =
    /iPhone/.test(ua) ? "iPhone" :
    /iPad/.test(ua) ? "iPad" :
    /Android/.test(ua) ? "Android" :
    /Windows/.test(ua) ? "Windows" :
    /Mac OS X|Macintosh/.test(ua) ? "Mac" :
    /CrOS/.test(ua) ? "Chromebook" :
    /Linux/.test(ua) ? "Linux" : null;
  return sistema ? `${navegador} no ${sistema}` : navegador;
}

/** Remove qualquer campo sensível que alguém passe por engano nos detalhes */
const CHAVES_PROIBIDAS = /senha|password|token|codigo|segredo|secret/i;
function limparDetalhes(detalhes) {
  if (!detalhes || typeof detalhes !== "object") return null;
  const limpo = {};
  for (const [k, v] of Object.entries(detalhes)) {
    if (CHAVES_PROIBIDAS.test(k) || v === undefined) continue;
    limpo[k] = v;
  }
  return Object.keys(limpo).length ? JSON.stringify(limpo).slice(0, 2000) : null;
}

const RegistroSegurancaService = {
  /**
   * @param {import("express").Request|null} req
   * @param {{ evento: string, resultado?: "sucesso"|"falha"|"bloqueado", id_usuario?: number|null,
   *   id_ator?: number|null, email?: string|null, detalhes?: object }} dados
   */
  async registrar(req, { evento, resultado = "sucesso", id_usuario = null, id_ator = null, email = null, detalhes = null }) {
    try {
      const emailLimpo = email && String(email).includes("@") ? String(email).trim().toLowerCase().slice(0, 120) : null;
      await knex("log_seguranca").insert({
        evento,
        resultado,
        id_usuario: id_usuario ? Number(id_usuario) : null,
        id_ator: id_ator ? Number(id_ator) : null,
        email: emailLimpo,
        ip: ipDaRequisicao(req),
        user_agent: userAgentDaRequisicao(req),
        detalhes: limparDetalhes(detalhes),
      });
    } catch (err) {
      console.error(JSON.stringify({ nivel: "erro", origem: "log_seguranca", evento, mensagem: err?.message }));
    }
  },

  /** Últimos eventos da própria pessoa (tela Perfil → Segurança) */
  async listarDoUsuario(id_usuario, limite = 20) {
    const linhas = await knex("log_seguranca")
      .where({ id_usuario })
      .whereIn("evento", [
        EVENTOS.LOGIN, EVENTOS.CONTA_BLOQUEADA, EVENTOS.SENHA_ALTERADA, EVENTOS.SENHA_REDEFINIDA,
        EVENTOS.EMAIL_ALTERADO, EVENTOS.DOIS_FATORES_ATIVADO, EVENTOS.DOIS_FATORES_DESATIVADO,
        EVENTOS.DOIS_FATORES_REMOVIDO, EVENTOS.CODIGO_RECUPERACAO_USADO, EVENTOS.SESSOES_ENCERRADAS,
      ])
      .orderBy("criado_em", "desc")
      .orderBy("id_log", "desc")
      .limit(limite)
      .select("id_log", "evento", "resultado", "ip", "user_agent", "criado_em", "detalhes");
    return linhas.map((l) => ({ ...formatar(l), user_agent: undefined }));
  },

  /** Admin: busca no registro com filtros e paginação */
  async buscar({ evento, resultado, id_usuario, busca, de, ate, pagina = 1, porPagina = 50 } = {}) {
    const p = Math.max(1, Number(pagina) || 1);
    const n = Math.min(200, Math.max(1, Number(porPagina) || 50));
    const base = knex("log_seguranca as l")
      .leftJoin("usuario as u", "u.id_usuario", "l.id_usuario")
      .leftJoin("usuario as a", "a.id_usuario", "l.id_ator");
    if (evento) base.whereIn("l.evento", String(evento).split(",").slice(0, 20));
    if (resultado) base.where("l.resultado", resultado);
    if (id_usuario) base.where("l.id_usuario", Number(id_usuario));
    if (de) base.where("l.criado_em", ">=", `${String(de).slice(0, 10)} 00:00:00`);
    if (ate) base.where("l.criado_em", "<=", `${String(ate).slice(0, 10)} 23:59:59`);
    if (busca) {
      const termo = `%${String(busca).trim().slice(0, 80).replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      base.where((q) => q.where("u.nome", "like", termo).orWhere("u.email", "like", termo)
        .orWhere("l.email", "like", termo).orWhere("l.ip", "like", termo));
    }
    const [{ total }] = await base.clone().count({ total: "*" });
    const linhas = await base
      .select("l.*", "u.nome as usuario_nome", "u.email as usuario_email", "a.nome as ator_nome")
      .orderBy("l.criado_em", "desc")
      .orderBy("l.id_log", "desc")
      .limit(n)
      .offset((p - 1) * n);
    return { total: Number(total), pagina: p, porPagina: n, eventos: linhas.map(formatar) };
  },
};

function formatar(linha) {
  let detalhes = null;
  try {
    detalhes = linha.detalhes ? JSON.parse(linha.detalhes) : null;
  } catch {
    detalhes = null;
  }
  return { ...linha, detalhes, dispositivo: descreverDispositivo(linha.user_agent) };
}

export default RegistroSegurancaService;
