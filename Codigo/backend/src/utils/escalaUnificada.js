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
      id_ministerio: area.id_ministerio ?? null,
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
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const hojeIso = hoje.toISOString().slice(0, 10);

  const nomes = new Map();
  const instrumentosCount = new Map();
  const areasCount = new Map();
  const porTipo = new Map();
  const porStatus = new Map();
  const porDiaSemana = new Map();
  const eventosIncompletos = [];
  const eventosSemPessoas = [];
  let totalPessoas = 0;
  let vagasTotal = 0;
  let vagasPreenchidas = 0;
  let eventosPassados = 0;
  let eventosHoje = 0;
  let eventosFuturos = 0;

  for (const ev of eventosUnificados) {
    const tipo = ev.tipo || "evento";
    const status = ev.status || "rascunho";
    porTipo.set(tipo, (porTipo.get(tipo) || 0) + 1);
    porStatus.set(status, (porStatus.get(status) || 0) + 1);

    if (ev.data) {
      const d = new Date(`${ev.data}T12:00:00`);
      const diaNome = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][d.getDay()];
      porDiaSemana.set(diaNome, (porDiaSemana.get(diaNome) || 0) + 1);
      if (ev.data < hojeIso) eventosPassados += 1;
      else if (ev.data === hojeIso) eventosHoje += 1;
      else eventosFuturos += 1;
    }

    const tot = ev.totais || {};
    vagasTotal += tot.vagasTotal || 0;
    vagasPreenchidas += tot.vagasPreenchidas || 0;

    const slots = Object.values(ev.instrumentos || {});
    let pessoasNoEvento = 0;
    const slotsVazios = [];

    for (const slot of slots) {
      const qtd = (slot.membros || []).length;
      pessoasNoEvento += qtd;
      instrumentosCount.set(slot.tipo, (instrumentosCount.get(slot.tipo) || 0) + qtd);
      const areaKey = slot.areaNome || "Geral";
      areasCount.set(areaKey, (areasCount.get(areaKey) || 0) + qtd);

      const limite = slot.limite;
      const vazio =
        qtd === 0 || (limite != null && limite > 0 && qtd < limite);
      if (vazio && slot.tipo !== "_geral") {
        slotsVazios.push({
          tipo: slot.tipo,
          nome: slot.nome || slot.tipo,
          area: areaKey,
          atual: qtd,
          limite: limite,
        });
      }

      for (const m of slot.membros || []) {
        totalPessoas += 1;
        const id = m.usuario.id;
        const atual = nomes.get(id) || {
          id,
          nome: m.usuario.nome,
          totalEscalas: 0,
          funcoes: {},
          eventos: [],
        };
        atual.totalEscalas += 1;
        const funcao = slot.nome || slot.tipo || "Geral";
        atual.funcoes[funcao] = (atual.funcoes[funcao] || 0) + 1;
        if (ev.data && !atual.eventos.includes(ev.data)) atual.eventos.push(ev.data);
        nomes.set(id, atual);
      }
    }

    if (pessoasNoEvento === 0) {
      eventosSemPessoas.push({
        id: ev.id,
        nome: ev.nome,
        data: ev.data,
        horaInicio: ev.horaInicio,
        status: ev.status,
      });
    } else if (slotsVazios.length > 0 || (tot.vagasDisponiveis || 0) > 0) {
      eventosIncompletos.push({
        id: ev.id,
        nome: ev.nome,
        data: ev.data,
        horaInicio: ev.horaInicio,
        status: ev.status,
        vagasDisponiveis: tot.vagasDisponiveis || slotsVazios.length,
        slotsVazios: slotsVazios.slice(0, 6),
      });
    }
  }

  const ranking = [...nomes.values()]
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      totalEscalas: p.totalEscalas,
      diasEscalado: p.eventos.length,
      funcoesPrincipais: Object.entries(p.funcoes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([nome, quantidade]) => ({ nome, quantidade })),
    }))
    .sort((a, b) => b.totalEscalas - a.totalEscalas);

  const pessoasMaisEscaladas = ranking.slice(0, 10);
  const pessoaMaisEscalada = pessoasMaisEscaladas[0] || null;
  const pessoasMenosEscaladas = [...ranking]
    .filter((p) => p.totalEscalas > 0)
    .sort((a, b) => a.totalEscalas - b.totalEscalas || a.nome.localeCompare(b.nome))
    .slice(0, 5);

  const instrumentosMaisUsados = [...instrumentosCount.entries()]
    .map(([instrumento, quantidade]) => ({ instrumento, tipo: instrumento, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);

  const areasMaisUsadas = [...areasCount.entries()]
    .map(([area, quantidade]) => ({ area, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);

  const toLista = (map) =>
    [...map.entries()]
      .map(([chave, quantidade]) => ({ chave, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

  const taxaPreenchimento =
    vagasTotal > 0 ? Math.round((vagasPreenchidas / vagasTotal) * 100) : totalPessoas > 0 ? 100 : 0;

  const mediaPessoasPorEvento =
    eventosUnificados.length > 0
      ? Math.round((totalPessoas / eventosUnificados.length) * 10) / 10
      : 0;

  return {
    totalEventos: eventosUnificados.length,
    totalPessoas,
    pessoasUnicas: nomes.size,
    pessoaMaisEscalada,
    pessoasMaisEscaladas,
    pessoasMenosEscaladas,
    instrumentosMaisUsados,
    areasMaisUsadas,
    porTipo: toLista(porTipo),
    porStatus: toLista(porStatus),
    porDiaSemana: toLista(porDiaSemana),
    vagasTotal,
    vagasPreenchidas,
    vagasDisponiveis: Math.max(0, vagasTotal - vagasPreenchidas),
    taxaPreenchimento,
    mediaPessoasPorEvento,
    eventosPassados,
    eventosHoje,
    eventosFuturos,
    eventosSemPessoas: eventosSemPessoas.slice(0, 12),
    eventosIncompletos: eventosIncompletos
      .sort((a, b) => String(a.data).localeCompare(String(b.data)))
      .slice(0, 12),
    totalEventosSemPessoas: eventosSemPessoas.length,
    totalEventosIncompletos: eventosIncompletos.length,
    alertas: [
      eventosSemPessoas.length > 0
        ? `${eventosSemPessoas.length} evento(s) sem ninguém escalado`
        : null,
      eventosIncompletos.length > 0
        ? `${eventosIncompletos.length} evento(s) com vagas em aberto`
        : null,
      (porStatus.get("rascunho") || 0) > 0
        ? `${porStatus.get("rascunho")} evento(s) ainda em rascunho`
        : null,
    ].filter(Boolean),
  };
}
