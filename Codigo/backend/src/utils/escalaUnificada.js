import { getLimitesPorArea } from "../config/ministerioCampos.js";

/**
 * Metadados de slots (instrumento/função) para a visão unificada da escala.
 * Alinhado ao CURSOR_PROMPT_UI_EXAMPLES e ao modelo real (área + detalhes JSON).
 */

export const SLOT_META = {
  vocal: { nome: "Vocal", icone: "🎤", ordem: 1 },
  violao: { nome: "Violão", icone: "🎸", ordem: 2 },
  guitarra: { nome: "Guitarra", icone: "🎸", ordem: 3 },
  baixo: { nome: "Baixo", icone: "🎸", ordem: 4 },
  teclado: { nome: "Teclado", icone: "🎹", ordem: 5 },
  piano: { nome: "Piano", icone: "🎹", ordem: 6 },
  bateria: { nome: "Bateria", icone: "🥁", ordem: 7 },
  percussao: { nome: "Percussão", icone: "🥁", ordem: 8 },
  violino: { nome: "Violino", icone: "🎻", ordem: 9 },
  violoncelo: { nome: "Violoncelo", icone: "🎻", ordem: 10 },
  saxofone: { nome: "Saxofone", icone: "🎷", ordem: 11 },
  trompete: { nome: "Trompete", icone: "🎺", ordem: 12 },
  outro: { nome: "Outro", icone: "🎵", ordem: 99 },
  operador_som: { nome: "Operador de som", icone: "🔊", ordem: 1 },
  projecao: { nome: "Projeção", icone: "📽️", ordem: 2 },
  transmissao: { nome: "Transmissão", icone: "📡", ordem: 3 },
  mesa: { nome: "Mesa de som", icone: "🎚️", ordem: 4 },
  portaria: { nome: "Portaria", icone: "🚪", ordem: 1 },
  boas_vindas: { nome: "Boas-vindas", icone: "🤝", ordem: 2 },
  cadastro: { nome: "Cadastro", icone: "📝", ordem: 3 },
  coordenacao: { nome: "Coordenação", icone: "📋", ordem: 4 },
};

export const SLOTS_PADRAO_AREA = {
  louvor: ["vocal", "violao", "guitarra", "baixo", "teclado", "bateria"],
  som: ["mesa", "operador_som", "transmissao", "projecao"],
  voluntarios: ["portaria", "boas_vindas", "cadastro", "coordenacao"],
};

export function chaveAreaGrupo(nomeArea) {
  const n = String(nomeArea || "").toLowerCase();
  if (["louvor", "música", "musica", "worship"].some((p) => n.includes(p))) return "louvor";
  if (["som", "áudio", "audio"].some((p) => n.includes(p))) return "som";
  if (["recep", "acolhida", "portaria", "volunt"].some((p) => n.includes(p))) return "voluntarios";
  return "area";
}

export function chaveDetalheDoGrupo(grupo) {
  if (grupo === "louvor") return "instrumento";
  if (grupo === "som" || grupo === "voluntarios") return "funcao";
  return "funcao";
}

export function chaveSlotDeDetalhes(areaNome, detalhes) {
  const grupo = chaveAreaGrupo(areaNome);
  const d = detalhes && typeof detalhes === "object" ? detalhes : {};
  if (grupo === "louvor" && d.instrumento) return String(d.instrumento);
  if ((grupo === "som" || grupo === "voluntarios") && d.funcao) return String(d.funcao);
  if (d.instrumento) return String(d.instrumento);
  if (d.funcao) return String(d.funcao);
  return "_geral";
}

export function metaSlot(chave, areaNome) {
  if (chave === "_geral") {
    return { nome: areaNome || "Equipe", icone: "📋", ordem: 0 };
  }
  return SLOT_META[chave] || { nome: chave, icone: "•", ordem: 50 };
}

export function horaDeDatetime(value) {
  if (!value) return "";
  const s = String(value);
  const m = s.match(/(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function dataIsoDeDatetime(value) {
  if (!value) return "";
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function diaDaSemanaIso(dataIso) {
  const d = new Date(`${String(dataIso).slice(0, 10)}T12:00:00`);
  return DIAS[d.getDay()] || "";
}

export function tipoEventoPorTitulo(titulo) {
  const t = String(titulo || "").toLowerCase();
  if (t.includes("culto")) return "culto";
  if (t.includes("ensaio")) return "ensaio";
  if (t.includes("célula") || t.includes("celula")) return "celula";
  if (t.includes("oração") || t.includes("oracao") || t.includes("intercess")) return "oracao";
  if (t.includes("kids") || t.includes("infantil")) return "kids";
  if (t.includes("jovem") || t.includes("juventude")) return "jovens";
  return "evento";
}

function membroUnificado(attr, ordem, tipoSlot) {
  return {
    id: attr.id_escala_atribuicao,
    membroEscalaId: attr.id_escala_atribuicao,
    ordem,
    id_escala_area: attr.id_escala_area,
    tipoSlot: tipoSlot || null,
    detalhes: attr.detalhes || null,
    usuario: {
      id: attr.id_usuario,
      nome: attr.usuario_nome,
      telefone: attr.usuario_telefone || null,
    },
  };
}

/**
 * Monta slots (instrumentos/funções) de uma área com as pessoas dentro.
 */
export function montarSlotsDaArea(area, limitesPorChave = null) {
  const grupo = chaveAreaGrupo(area.nome);
  const chaveDetalhe = chaveDetalheDoGrupo(grupo);
  const padrao = SLOTS_PADRAO_AREA[grupo] || ["_geral"];
  const attrs = area.atribuicoes || [];
  const usados = new Set(attrs.map((a) => chaveSlotDeDetalhes(area.nome, a.detalhes)));
  const chaves = [...padrao];
  for (const u of usados) {
    if (!chaves.includes(u)) chaves.push(u);
  }
  const limites = limitesPorChave || getLimitesPorArea(area.nome);

  const slots = {};
  chaves.forEach((chave, idx) => {
    const meta = metaSlot(chave, area.nome);
    const membrosAttr = attrs.filter((a) => chaveSlotDeDetalhes(area.nome, a.detalhes) === chave);
    const limite = limites && limites[chave] != null ? limites[chave] : null;
    slots[chave] = {
      tipo: chave,
      nome: meta.nome,
      icone: meta.icone,
      limite,
      atual: membrosAttr.length,
      ordem: meta.ordem ?? idx + 1,
      chaveDetalhe: chave === "_geral" ? null : chaveDetalhe,
      id_escala_area: area.id_escala_area,
      areaNome: area.nome,
      podeGerenciar: !!area.podeGerenciar,
      membros: membrosAttr.map((a, i) => membroUnificado(a, i + 1, chave)),
    };
  });
  return slots;
}

export function formatarEventoUnificado(evento, { incluirSlotsVazios = true } = {}) {
  const areas = evento.areas || [];
  const instrumentos = {};
  let ordemGlobal = 0;
  for (const area of areas) {
    const slots = montarSlotsDaArea(area);
    for (const [chave, slot] of Object.entries(slots)) {
      if (!incluirSlotsVazios && slot.membros.length === 0 && slot.tipo === "_geral") continue;
      ordemGlobal += 1;
      const idSlot = `${area.id_escala_area}:${chave}`;
      instrumentos[idSlot] = { ...slot, ordem: ordemGlobal };
    }
  }

  const membros = Object.values(instrumentos).flatMap((s) => s.membros);
  const vagasTotal = Object.values(instrumentos).reduce(
    (acc, s) => acc + (s.limite != null ? s.limite : Math.max(s.atual, 1)),
    0
  );
  const vagasPreenchidas = membros.length;

  return {
    id: evento.id_escala_evento,
    escalaId: evento.id_escala_evento,
    nome: evento.titulo,
    tipo: tipoEventoPorTitulo(evento.titulo),
    data: dataIsoDeDatetime(evento.data_hora),
    horaInicio: horaDeDatetime(evento.data_hora),
    horaFim: horaDeDatetime(evento.data_hora_fim),
    data_hora: evento.data_hora,
    data_hora_fim: evento.data_hora_fim,
    status: evento.status || (evento.ativo ? "publicada" : "rascunho"),
    descricao: evento.descricao || null,
    instrumentos,
    areas,
    totais: {
      instrumentos: Object.keys(instrumentos).length,
      vagasTotal,
      vagasPreenchidas,
      vagasDisponiveis: Math.max(0, vagasTotal - vagasPreenchidas),
      totalPessoas: vagasPreenchidas,
    },
  };
}

export function estatisticasEventos(eventosUnificados) {
  const nomes = new Map();
  const instrumentosCount = new Map();
  let totalPessoas = 0;
  for (const ev of eventosUnificados) {
    for (const slot of Object.values(ev.instrumentos || {})) {
      instrumentosCount.set(slot.tipo, (instrumentosCount.get(slot.tipo) || 0) + slot.membros.length);
      for (const m of slot.membros) {
        totalPessoas += 1;
        const id = m.usuario.id;
        const atual = nomes.get(id) || { id, nome: m.usuario.nome, totalEscalas: 0 };
        atual.totalEscalas += 1;
        nomes.set(id, atual);
      }
    }
  }
  const pessoaMaisEscalada = [...nomes.values()].sort((a, b) => b.totalEscalas - a.totalEscalas)[0] || null;
  const instrumentosMaisUsados = [...instrumentosCount.entries()]
    .map(([instrumento, quantidade]) => ({ instrumento, tipo: instrumento, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
  return {
    totalEventos: eventosUnificados.length,
    totalPessoas,
    pessoasUnicas: nomes.size,
    pessoaMaisEscalada,
    instrumentosMaisUsados,
  };
}
