/**
 * Serviço de integração com WhatsApp via Evolution API
 * Envia notificações por mensagem de texto
 *
 * Requer Evolution API rodando (Docker ou self-hosted)
 * Documentação: https://doc.evolution-api.com
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || "casadosdiscipulos";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const WHATSAPP_ENABLED = String(process.env.WHATSAPP_ENABLED || "").toLowerCase() === "true";

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
 * Exige URL, API key e flag explícita WHATSAPP_ENABLED=true
 */
function estaConfigurado() {
  return Boolean(WHATSAPP_ENABLED && EVOLUTION_API_URL && EVOLUTION_API_KEY);
}

/** Mostra só o começo e o fim do número nos logs (dado pessoal) */
function mascararTelefone(e164) {
  const s = String(e164 || "");
  return s.length > 6 ? `${s.slice(0, 4)}*****${s.slice(-2)}` : "***";
}

const TIMEOUT_MS = Number(process.env.WHATSAPP_TIMEOUT_MS) || 15000;
// Intervalo entre mensagens: disparos em rajada podem bloquear o número no WhatsApp
const INTERVALO_MS = Number(process.env.WHATSAPP_INTERVALO_MS ?? 3000);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fila = Promise.resolve();

/** Envio imediato (uso interno da fila) */
async function enviarAgora(numeroE164, mensagem) {
  const url = `${EVOLUTION_API_URL.replace(/\/$/, "")}/message/sendText/${EVOLUTION_INSTANCE}`;
  const headers = {
    "Content-Type": "application/json",
    ...(EVOLUTION_API_KEY && { apikey: EVOLUTION_API_KEY }),
  };
  const body = {
    number: numeroE164,
    text: String(mensagem).slice(0, 4096),
  };
  const destino = mascararTelefone(numeroE164);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      // Se a Evolution travar, não prende a fila nem a requisição de quem chamou
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      console.log("[WhatsApp] Mensagem enviada para", destino);
      return { ok: true };
    }

    const errMsg = data?.message || data?.error || res.statusText || `HTTP ${res.status}`;
    console.error("[WhatsApp] Erro ao enviar para", destino, "-", errMsg);
    return { ok: false, error: String(errMsg) };
  } catch (err) {
    const msg = err?.name === "TimeoutError" ? `sem resposta em ${TIMEOUT_MS} ms` : err?.message;
    console.error("[WhatsApp] Falha ao conectar (", destino, "):", msg);
    return { ok: false, error: msg || "Erro ao conectar com Evolution API" };
  }
}

/**
 * Envia mensagem de texto via Evolution API.
 * Todas as mensagens passam por uma fila única, uma de cada vez, com intervalo
 * entre elas. Quem chama não precisa (e não deve) aguardar em fluxos de tela.
 * @param {string} numero - Número do destinatário (E.164 ou formato BR)
 * @param {string} mensagem - Texto a enviar
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
function enviarMensagem(numero, mensagem) {
  if (!estaConfigurado()) {
    return Promise.resolve({ ok: false, error: "WhatsApp não configurado (EVOLUTION_API_URL)" });
  }
  const numeroE164 = normalizarTelefone(numero);
  if (!numeroE164) {
    return Promise.resolve({ ok: false, error: "Número de telefone inválido" });
  }
  const tarefa = fila.then(() => enviarAgora(numeroE164, mensagem));
  fila = tarefa.then(
    () => esperar(INTERVALO_MS),
    () => esperar(INTERVALO_MS)
  );
  return tarefa;
}

/** Labels amigáveis para campos de detalhes da atribuição */
const LABELS_DETALHES = {
  instrumento: "Instrumento",
  musicas: "Músicas",
  tom: "Tom",
  observacoes: "Observações",
  funcao: "Função",
  equipamentos: "Equipamentos",
};

/**
 * Formata o objeto detalhes em linhas legíveis
 * @param {Object} detalhes - { instrumento, observacoes, funcao, etc. }
 */
function formatarValor(val) {
  const s = String(val).trim();
  return s
    .split(/[\s_]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function formatarDetalhes(detalhes) {
  if (!detalhes || typeof detalhes !== "object") return [];
  const linhas = [];
  for (const [chave, valor] of Object.entries(detalhes)) {
    if (valor === null || valor === undefined || String(valor).trim() === "") continue;
    const label = LABELS_DETALHES[chave] || chave.charAt(0).toUpperCase() + chave.slice(1).replace(/_/g, " ");
    const valorFmt = chave === "musicas" || chave === "observacoes" || chave === "equipamentos"
      ? String(valor).trim()
      : formatarValor(valor);
    linhas.push(`• ${label}: ${valorFmt}`);
  }
  return linhas;
}

/**
 * Envia notificação de escalação para o usuário
 * @param {Object} usuario - { nome, telefone }
 * @param {Object} evento - { titulo, data_hora, data_hora_fim, descricao }
 * @param {string} areaNome - Nome da área
 * @param {Object} detalhesAtribuicao - { instrumento, observacoes, funcao, musicas, etc. }
 */
async function notificarEscalacao(usuario, evento, areaNome, detalhesAtribuicao = null) {
  if (!usuario?.telefone) return { ok: false, error: "Usuário sem telefone" };

  const primeiroNome = (usuario.nome || "Discípulo").split(/\s+/)[0];
  const titulo = evento?.titulo || "Evento";

  const opts = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
  };
  const dataHoraFmt = evento?.data_hora
    ? new Date(evento.data_hora).toLocaleDateString("pt-BR", opts)
    : null;
  const dataHoraFimFmt = evento?.data_hora_fim
    ? new Date(evento.data_hora_fim).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const linhasDetalhes = formatarDetalhes(detalhesAtribuicao);

  const linhas = [
    "🏠 *Casa dos Discípulos*",
    "",
    `Olá, *${primeiroNome}*! 👋`,
    "",
    "Você foi escalado(a)! Seguem os detalhes:",
    "",
    `📌 *${titulo}*`,
    `📍 Área: ${areaNome}`,
    dataHoraFmt ? `📅 ${dataHoraFmt}` : null,
    dataHoraFimFmt ? `⏰ Até ${dataHoraFimFmt}` : null,
    evento?.descricao ? `\n📝 ${evento.descricao}` : null,
    linhasDetalhes.length ? `\n✨ *Sua participação:*\n${linhasDetalhes.join("\n")}` : null,
    "",
    "Acesse o sistema para confirmar e ver mais informações.",
    "",
    "— Casa dos Discípulos",
  ].filter(Boolean);

  const mensagem = linhas.join("\n");
  return enviarMensagem(usuario.telefone, mensagem);
}

/**
 * Envia notificação de atualização da atribuição (detalhes alterados)
 */
async function notificarAtribuicaoAtualizada(usuario, evento, areaNome, detalhesNovos) {
  if (!usuario?.telefone) return { ok: false, error: "Usuário sem telefone" };

  const primeiroNome = (usuario.nome || "Discípulo").split(/\s+/)[0];
  const titulo = evento?.titulo || "Evento";
  const opts = { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", weekday: "long" };
  const dataHoraFmt = evento?.data_hora ? new Date(evento.data_hora).toLocaleDateString("pt-BR", opts) : "";
  const linhasDetalhes = formatarDetalhes(detalhesNovos);

  const linhas = [
    "🏠 *Casa dos Discípulos*",
    "",
    `Olá, *${primeiroNome}*! 👋`,
    "",
    "⚠️ *Atualização na sua escala*",
    "",
    `Sua participação em *${titulo}* (${areaNome}) foi *atualizada*:`,
    "",
    dataHoraFmt ? `📅 ${dataHoraFmt}` : null,
    linhasDetalhes.length ? `\n✨ *Novos detalhes:*\n${linhasDetalhes.join("\n")}` : null,
    "",
    "Confira as alterações no sistema.",
    "",
    "— Casa dos Discípulos",
  ].filter(Boolean);

  return enviarMensagem(usuario.telefone, linhas.join("\n"));
}

/**
 * Envia notificação de remoção da escala
 */
async function notificarAtribuicaoRemovida(usuario, evento, areaNome) {
  if (!usuario?.telefone) return { ok: false, error: "Usuário sem telefone" };

  const primeiroNome = (usuario.nome || "Discípulo").split(/\s+/)[0];
  const titulo = evento?.titulo || "Evento";
  const dataFmt = evento?.data_hora
    ? new Date(evento.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

  const linhas = [
    "🏠 *Casa dos Discípulos*",
    "",
    `Olá, *${primeiroNome}*! 👋`,
    "",
    "📋 *Alteração na escala*",
    "",
    `Você foi *removido(a)* da escala de *${titulo}* (${areaNome})${dataFmt ? ` — ${dataFmt}` : ""}.`,
    "",
    "Caso tenha dúvidas, entre em contato com a liderança.",
    "",
    "— Casa dos Discípulos",
  ];

  return enviarMensagem(usuario.telefone, linhas.join("\n"));
}

/**
 * Envia notificação de evento atualizado (para cada escalado)
 * @param {Object} usuario - { nome, telefone }
 * @param {Object} evento - dados do evento
 * @param {string} areaNome - nome da área (pode ser vazio se áreas foram substituídas)
 * @param {Object|null} detalhesAtribuicao - detalhes da participação (null se áreas foram reformuladas)
 */
async function notificarEventoAtualizado(usuario, evento, areaNome, detalhesAtribuicao) {
  if (!usuario?.telefone) return { ok: false, error: "Usuário sem telefone" };

  const primeiroNome = (usuario.nome || "Discípulo").split(/\s+/)[0];
  const titulo = evento?.titulo || "Evento";
  const opts = { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", weekday: "long" };
  const dataHoraFmt = evento?.data_hora ? new Date(evento.data_hora).toLocaleDateString("pt-BR", opts) : null;
  const dataHoraFimFmt = evento?.data_hora_fim
    ? new Date(evento.data_hora_fim).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;
  const linhasDetalhes = formatarDetalhes(detalhesAtribuicao);
  const areasReformuladas = detalhesAtribuicao === null;

  const msgParticipacao = areasReformuladas
    ? `O evento *${titulo}* teve alterações significativas (áreas reformuladas). Confira no sistema se sua participação foi mantida.`
    : `O evento *${titulo}* teve alterações. Sua participação em *${areaNome}* continua confirmada.`;

  const linhas = [
    "🏠 *Casa dos Discípulos*",
    "",
    `Olá, *${primeiroNome}*! 👋`,
    "",
    "🔄 *Evento atualizado*",
    "",
    msgParticipacao,
    "",
    `📌 *${titulo}*`,
    areaNome ? `📍 Área: ${areaNome}` : null,
    dataHoraFmt ? `📅 ${dataHoraFmt}` : null,
    dataHoraFimFmt ? `⏰ Até ${dataHoraFimFmt}` : null,
    evento?.descricao ? `\n📝 ${evento.descricao}` : null,
    linhasDetalhes.length ? `\n✨ *Sua participação:*\n${linhasDetalhes.join("\n")}` : null,
    "",
    "Confira os detalhes atualizados no sistema.",
    "",
    "— Casa dos Discípulos",
  ].filter(Boolean);

  return enviarMensagem(usuario.telefone, linhas.join("\n"));
}

/**
 * Envia notificação de evento cancelado/removido
 */
async function notificarEventoCancelado(usuario, eventoTitulo, dataFmt) {
  if (!usuario?.telefone) return { ok: false, error: "Usuário sem telefone" };

  const primeiroNome = (usuario.nome || "Discípulo").split(/\s+/)[0];

  const linhas = [
    "🏠 *Casa dos Discípulos*",
    "",
    `Olá, *${primeiroNome}*! 👋`,
    "",
    "❌ *Evento cancelado*",
    "",
    `O evento *${eventoTitulo}*${dataFmt ? ` (${dataFmt})` : ""} foi *cancelado* e removido da escala.`,
    "",
    "Você não precisa mais se apresentar para este evento. Em caso de dúvidas, fale com a liderança.",
    "",
    "— Casa dos Discípulos",
  ];

  return enviarMensagem(usuario.telefone, linhas.join("\n"));
}

/**
 * Envia lembrete semanal de módulos pendentes (Escola de Discípulos)
 * @param {Object} usuario - { nome, telefone }
 * @param {Array<{ titulo: string }>} modulosPendentes - Módulos obrigatórios pendentes
 */
async function notificarModulosPendentes(usuario, modulosPendentes) {
  if (!usuario?.telefone) return { ok: false, error: "Usuário sem telefone" };
  if (!modulosPendentes?.length) return { ok: false, error: "Nenhum módulo pendente" };

  const primeiroNome = (usuario.nome || "Discípulo").split(/\s+/)[0];
  const listaModulos = modulosPendentes.map((m) => `  • ${m.titulo}`).join("\n");

  const linhas = [
    "🏠 *Casa dos Discípulos*",
    "",
    `Olá, *${primeiroNome}*! 👋`,
    "",
    "📚 *Lembrete: Escola de Discípulos*",
    "",
    `Você tem *${modulosPendentes.length} módulo(s)* pendente(s) na sua formação:`,
    "",
    listaModulos,
    "",
    "Estes módulos fazem parte do seu percurso. Acesse o sistema e conclua para avançar no seu nível.",
    "",
    "— Casa dos Discípulos",
  ];

  return enviarMensagem(usuario.telefone, linhas.join("\n"));
}

export default {
  enviarMensagem,
  notificarEscalacao,
  notificarAtribuicaoAtualizada,
  notificarAtribuicaoRemovida,
  notificarEventoAtualizado,
  notificarEventoCancelado,
  notificarModulosPendentes,
  normalizarTelefone,
  estaConfigurado,
};
