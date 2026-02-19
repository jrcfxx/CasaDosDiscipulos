/**
 * Serviço de integração com WhatsApp via Evolution API
 * Envia notificações por mensagem de texto
 *
 * Requer Evolution API rodando (Docker ou self-hosted)
 * Documentação: https://doc.evolution-api.com
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || "casadosdiscipulos";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

/**
 * Normaliza número para formato E.164 (ex: 5511999999999)
 * Aceita: (11) 99999-9999, 11 999999999, +55 11 99999-9999, etc.
 * @param {string} telefone
 * @returns {string|null} Número em E.164 ou null se inválido
 */
function normalizarTelefone(telefone) {
  if (!telefone || typeof telefone !== "string") return null;
  const digits = telefone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  // Brasil: se começar com 55, ok; senão adicionar 55
  const brasileiro = digits.length === 10 || digits.length === 11;
  const e164 = brasileiro ? `55${digits}` : digits.startsWith("55") ? digits : `55${digits}`;
  return e164;
}

/**
 * Verifica se o WhatsApp está configurado e disponível
 */
function estaConfigurado() {
  return Boolean(EVOLUTION_API_URL);
}

/**
 * Envia mensagem de texto via Evolution API
 * @param {string} numero - Número do destinatário (E.164 ou formato BR)
 * @param {string} mensagem - Texto a enviar
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function enviarMensagem(numero, mensagem) {
  if (!estaConfigurado()) {
    return { ok: false, error: "WhatsApp não configurado (EVOLUTION_API_URL)" };
  }

  const numeroE164 = normalizarTelefone(numero);
  if (!numeroE164) {
    return { ok: false, error: "Número de telefone inválido" };
  }

  const url = `${EVOLUTION_API_URL.replace(/\/$/, "")}/message/sendText/${EVOLUTION_INSTANCE}`;
  const headers = {
    "Content-Type": "application/json",
    ...(EVOLUTION_API_KEY && { apikey: EVOLUTION_API_KEY }),
  };
  const body = {
    number: numeroE164,
    text: {
      message: String(mensagem).slice(0, 4096),
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return { ok: true };
    }

    const errMsg = data?.message || data?.error || res.statusText || `HTTP ${res.status}`;
    return { ok: false, error: errMsg };
  } catch (err) {
    return { ok: false, error: err.message || "Erro ao conectar com Evolution API" };
  }
}

/**
 * Envia notificação de escalação para o usuário
 * @param {Object} usuario - { nome, telefone }
 * @param {Object} evento - { titulo, data_hora }
 * @param {string} areaNome - Nome da área
 */
async function notificarEscalacao(usuario, evento, areaNome) {
  if (!usuario?.telefone) return { ok: false, error: "Usuário sem telefone" };

  const dataFmt = evento?.data_hora
    ? new Date(evento.data_hora).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const mensagem = `Casa dos Discípulos\n\nOlá, ${usuario.nome || "você"}!\n\nVocê foi escalado(a) para *${evento?.titulo || "evento"}*.\n\nÁrea: ${areaNome}\nData: ${dataFmt || "A definir"}\n\nAcesse o sistema para mais detalhes.`;

  return enviarMensagem(usuario.telefone, mensagem);
}

/**
 * Envia lembrete de módulos pendentes
 * @param {Object} usuario - { nome, telefone }
 * @param {Array<{ titulo: string }>} modulosPendentes - Lista de módulos
 */
async function notificarModulosPendentes(usuario, modulosPendentes) {
  if (!usuario?.telefone) return { ok: false, error: "Usuário sem telefone" };
  if (!modulosPendentes?.length) return { ok: false, error: "Nenhum módulo pendente" };

  const listaModulos = modulosPendentes.map((m) => `• ${m.titulo}`).join("\n");

  const mensagem = `Casa dos Discípulos\n\nOlá, ${usuario.nome || "você"}!\n\nVocê tem *${modulosPendentes.length} módulo(s)* pendente(s) na Escola de Discípulos:\n\n${listaModulos}\n\nQue tal continuar sua formação? Acesse o sistema e prossiga com os estudos!`;

  return enviarMensagem(usuario.telefone, mensagem);
}

export default {
  enviarMensagem,
  notificarEscalacao,
  notificarModulosPendentes,
  normalizarTelefone,
  estaConfigurado,
};
