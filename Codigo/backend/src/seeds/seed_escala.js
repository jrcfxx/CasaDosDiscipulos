import knex from "../database/index.js";

/**
 * Seed completo da Escala — cobre:
 * - Visões dia / semana / mês / ano
 * - Status rascunho / publicada / concluida
 * - Áreas com id_ministerio
 * - Atribuições densas (DnD, conflitos, limites)
 * - Templates e histórico
 * Depende de: seed_usuario, seed_ministerio
 */

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Datetime local MySQL sem shift UTC */
function dt(y, m, d, h = 19, min = 0) {
  return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(min)}:00`;
}

function addDays(base, days) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

function nextWeekday(from, weekday /* 0=Dom */) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  return d;
}

export async function seed() {
  // Limpa tabelas novas + antigas (ordem FK)
  try {
    await knex("escala_historico").del();
  } catch {
    /* tabela pode não existir em ambientes antigos */
  }
  try {
    await knex("escala_template").del();
  } catch {
    /* ok */
  }
  await knex("escala_atribuicao").del();
  await knex("escala_evento_ministerio").del();
  await knex("escala_area").del();
  await knex("escala_evento").del();

  const admin = await knex("usuario").where({ email: "admin@test.com" }).first();
  const ministerios = await knex("ministerio").select("id_ministerio", "nome").orderBy("ordem");
  const usuarios = await knex("usuario").select("id_usuario", "email", "nome").where({ ativo: true });

  const u = (email) => usuarios.find((x) => x.email === email);
  const min = (nome) => ministerios.find((m) => m.nome === nome);

  const adminU = u("admin@test.com");
  const lider1 = u("lider@test.com");
  const lider2 = u("lider2@test.com");
  const ana = u("ana.lider@test.com");
  const carlos = u("carlos.lider@test.com");
  const membro1 = u("membro@test.com");
  const maria = u("maria@test.com");
  const joao = u("joao@test.com");
  const fernanda = u("fernanda@test.com");
  const pedro = u("pedro@test.com");
  const juliana = u("juliana@test.com");
  const roberto = u("roberto@test.com");
  const amanda = u("amanda@test.com");
  const lucas = u("lucas@test.com");
  const beatriz = u("beatriz@test.com");
  const gabriel = u("gabriel@test.com");
  const carla = u("carla@test.com");
  const bruno = u("bruno@test.com");
  const patricia = u("patricia@test.com");
  const ricardo = u("ricardo@test.com");
  const sandra = u("sandra@test.com");

  if (!admin || ministerios.length === 0) {
    console.log("Execute seed_usuario e seed_ministerio primeiro.");
    return;
  }

  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = hoje.getMonth() + 1;
  const domingo = nextWeekday(hoje, 0);
  const domingoPassado = addDays(domingo, -7);
  const domingoFuturo = addDays(domingo, 7);
  const domingo2 = addDays(domingo, 14);
  const domingo3 = addDays(domingo, 21);
  const sabado = addDays(domingo, -1);
  const quarta = addDays(domingo, -4);
  const mesPassado = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const mesFuturo = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };

  const CULTOS_AREAS = [
    "Louvor",
    "Som",
    "Voluntários",
    "Mídia",
    "Liturgia",
    "Diaconia",
    "Intercessão",
    "Hospitalidade",
    "Palavra",
    "Condução",
  ];

  /**
   * Definição dos eventos de teste
   * status: rascunho | publicada | concluida
   */
  const eventosDef = [
    // === HOJE (visão dia) ===
    {
      key: "hoje_ensaio",
      titulo: "Ensaio Técnico — Hoje",
      data_hora: dt(y, m, hoje.getDate(), 10, 0),
      data_hora_fim: dt(y, m, hoje.getDate(), 12, 0),
      descricao: "Evento de hoje pela manhã — teste visão diária e DnD.",
      status: "publicada",
      ativo: true,
      areas: ["Louvor", "Som", "Mídia"],
    },
    {
      key: "hoje_noite",
      titulo: "Reunião de Líderes — Hoje",
      data_hora: dt(y, m, hoje.getDate(), 19, 30),
      data_hora_fim: dt(y, m, hoje.getDate(), 21, 0),
      descricao: "Segundo evento do dia (horário diferente) — sem conflito entre si.",
      status: "rascunho",
      ativo: true,
      areas: ["Condução", "Palavra", "Intercessão"],
    },

    // === SEMANA (visão semana) ===
    {
      key: "quarta_oracao",
      titulo: "Culto de Oração — Quarta",
      data_hora: dt(quarta.getFullYear(), quarta.getMonth() + 1, quarta.getDate(), 19, 0),
      data_hora_fim: dt(quarta.getFullYear(), quarta.getMonth() + 1, quarta.getDate(), 21, 0),
      descricao: "Noite de oração e intercessão.",
      status: "publicada",
      ativo: true,
      areas: ["Intercessão", "Som", "Voluntários", "Liturgia"],
    },
    {
      key: "sabado_ensaio",
      titulo: "Ensaio Geral de Louvor",
      data_hora: dt(sabado.getFullYear(), sabado.getMonth() + 1, sabado.getDate(), 16, 0),
      data_hora_fim: dt(sabado.getFullYear(), sabado.getMonth() + 1, sabado.getDate(), 18, 30),
      descricao: "Ensaio completo antes do domingo.",
      status: "publicada",
      ativo: true,
      areas: ["Louvor", "Som", "Mídia"],
    },

    // === DOMINGO PRINCIPAL (escala densa — DnD / limites / copiar) ===
    {
      key: "culto_domingo",
      titulo: "Culto de Celebração",
      data_hora: dt(domingo.getFullYear(), domingo.getMonth() + 1, domingo.getDate(), 18, 0),
      data_hora_fim: dt(domingo.getFullYear(), domingo.getMonth() + 1, domingo.getDate(), 20, 30),
      descricao: "Culto dominical completo — use para drag-and-drop, publicar, template e desfazer.",
      status: "publicada",
      ativo: true,
      areas: CULTOS_AREAS,
    },

    // === DOMINGO PASSADO (concluída) ===
    {
      key: "culto_passado",
      titulo: "Culto de Celebração (semana passada)",
      data_hora: dt(
        domingoPassado.getFullYear(),
        domingoPassado.getMonth() + 1,
        domingoPassado.getDate(),
        18,
        0
      ),
      data_hora_fim: dt(
        domingoPassado.getFullYear(),
        domingoPassado.getMonth() + 1,
        domingoPassado.getDate(),
        20,
        30
      ),
      descricao: "Evento concluído — histórico e status.",
      status: "concluida",
      ativo: true,
      areas: ["Louvor", "Som", "Voluntários", "Mídia", "Liturgia"],
    },

    // === PRÓXIMOS DOMINGOS (mês / copiar semana) ===
    {
      key: "culto_mais7",
      titulo: "Culto de Celebração (+7 dias)",
      data_hora: dt(
        domingoFuturo.getFullYear(),
        domingoFuturo.getMonth() + 1,
        domingoFuturo.getDate(),
        18,
        0
      ),
      data_hora_fim: dt(
        domingoFuturo.getFullYear(),
        domingoFuturo.getMonth() + 1,
        domingoFuturo.getDate(),
        20,
        30
      ),
      descricao: "Próximo domingo — rascunho parcialmente escalado.",
      status: "rascunho",
      ativo: true,
      areas: CULTOS_AREAS,
    },
    {
      key: "jovens",
      titulo: "Culto Especial Jovens",
      data_hora: dt(domingo2.getFullYear(), domingo2.getMonth() + 1, domingo2.getDate(), 19, 0),
      data_hora_fim: dt(domingo2.getFullYear(), domingo2.getMonth() + 1, domingo2.getDate(), 21, 30),
      descricao: "Culto temático juventude + adolescentes.",
      status: "publicada",
      ativo: true,
      areas: ["Juventude", "Adolescentes", "Louvor", "Som", "Voluntários", "Mídia"],
    },
    {
      key: "kids",
      titulo: "Manhã Casa Kids",
      data_hora: dt(domingo3.getFullYear(), domingo3.getMonth() + 1, domingo3.getDate(), 9, 0),
      data_hora_fim: dt(domingo3.getFullYear(), domingo3.getMonth() + 1, domingo3.getDate(), 11, 30),
      descricao: "Programação infantil paralela ao culto.",
      status: "publicada",
      ativo: true,
      areas: ["Casa Kids", "Voluntários", "Som"],
    },

    // === MÊS PASSADO (visão ano / mês) ===
    {
      key: "mes_passado_1",
      titulo: `Culto — ${mesPassado.m}/${mesPassado.y}`,
      data_hora: dt(mesPassado.y, mesPassado.m, 7, 18, 0),
      data_hora_fim: dt(mesPassado.y, mesPassado.m, 7, 20, 0),
      descricao: "Evento do mês anterior.",
      status: "concluida",
      ativo: true,
      areas: ["Louvor", "Som", "Voluntários"],
    },
    {
      key: "mes_passado_2",
      titulo: `Ensaio — ${mesPassado.m}/${mesPassado.y}`,
      data_hora: dt(mesPassado.y, mesPassado.m, 14, 19, 0),
      data_hora_fim: dt(mesPassado.y, mesPassado.m, 14, 21, 0),
      descricao: "Segundo evento do mês anterior.",
      status: "concluida",
      ativo: true,
      areas: ["Louvor", "Som"],
    },

    // === MÊS FUTURO ===
    {
      key: "mes_futuro",
      titulo: `Culto Especial — ${mesFuturo.m}/${mesFuturo.y}`,
      data_hora: dt(mesFuturo.y, mesFuturo.m, 5, 18, 0),
      data_hora_fim: dt(mesFuturo.y, mesFuturo.m, 5, 20, 30),
      descricao: "Evento do próximo mês — visão anual.",
      status: "rascunho",
      ativo: true,
      areas: ["Louvor", "Som", "Mídia", "Hospitalidade"],
    },

    // === AÇÃO SOCIAL / VISITAÇÃO (variedade de campos) ===
    {
      key: "social",
      titulo: "Ação Social no Bairro",
      data_hora: dt(
        addDays(hoje, 10).getFullYear(),
        addDays(hoje, 10).getMonth() + 1,
        addDays(hoje, 10).getDate(),
        14,
        0
      ),
      data_hora_fim: dt(
        addDays(hoje, 10).getFullYear(),
        addDays(hoje, 10).getMonth() + 1,
        addDays(hoje, 10).getDate(),
        17,
        0
      ),
      descricao: "Distribuição de cestas e evangelismo.",
      status: "publicada",
      ativo: true,
      areas: ["Social", "Visitação", "Transporte", "Voluntários"],
    },
    {
      key: "casais",
      titulo: "Encontro de Casais",
      data_hora: dt(
        addDays(hoje, 12).getFullYear(),
        addDays(hoje, 12).getMonth() + 1,
        addDays(hoje, 12).getDate(),
        20,
        0
      ),
      data_hora_fim: dt(
        addDays(hoje, 12).getFullYear(),
        addDays(hoje, 12).getMonth() + 1,
        addDays(hoje, 12).getDate(),
        22,
        0
      ),
      descricao: "Noite especial para casais.",
      status: "publicada",
      ativo: true,
      areas: ["Casais", "Hospitalidade", "Louvor", "Mídia"],
    },
    {
      key: "inativo",
      titulo: "Evento Cancelado (inativo)",
      data_hora: dt(y, m, Math.min(28, hoje.getDate() + 3), 19, 0),
      data_hora_fim: dt(y, m, Math.min(28, hoje.getDate() + 3), 21, 0),
      descricao: "Não deve aparecer no calendário com filtro ativo=true.",
      status: "rascunho",
      ativo: false,
      areas: ["Louvor"],
    },
  ];

  const idsPorKey = {};
  const areasPorKey = {};

  for (const ev of eventosDef) {
    const [id] = await knex("escala_evento").insert({
      titulo: ev.titulo,
      data_hora: ev.data_hora,
      data_hora_fim: ev.data_hora_fim,
      descricao: ev.descricao,
      ativo: ev.ativo,
      status: ev.status,
      id_criador: admin.id_usuario,
    });
    idsPorKey[ev.key] = id;

    const areasRows = [];
    for (let j = 0; j < ev.areas.length; j++) {
      const nome = ev.areas[j];
      const ministerio = min(nome);
      const [idArea] = await knex("escala_area").insert({
        id_escala_evento: id,
        nome,
        ordem: j,
        id_ministerio: ministerio?.id_ministerio || null,
      });
      areasRows.push({ id_escala_area: idArea, nome, id_ministerio: ministerio?.id_ministerio });
    }
    areasPorKey[ev.key] = areasRows;

    // Vínculo evento ↔ ministérios das áreas
    const idsMin = [
      ...new Set(areasRows.map((a) => a.id_ministerio).filter(Boolean)),
    ];
    if (idsMin.length) {
      await knex("escala_evento_ministerio").insert(
        idsMin.map((id_ministerio) => ({
          id_escala_evento: id,
          id_ministerio,
        }))
      );
    }
  }

  const area = (key, nome) => areasPorKey[key]?.find((a) => a.nome === nome);

  const attr = (key, nomeArea, usuario, detalhes) => {
    const ar = area(key, nomeArea);
    if (!ar || !usuario) return null;
    return {
      id_escala_area: ar.id_escala_area,
      id_usuario: usuario.id_usuario,
      detalhes: JSON.stringify(detalhes),
    };
  };

  // --- Atribuições densas ---
  const atribuicoes = [
    // HOJE ensaio — team louvor/som/mídia
    attr("hoje_ensaio", "Louvor", maria, {
      instrumento: "violao",
      musicas: "1. Rei dos Reis\n2. Teu Santo Nome\n3. Grande é o Senhor",
      tom: "G",
      observacoes: "Afinar antes das 9h50",
    }),
    attr("hoje_ensaio", "Louvor", fernanda, {
      instrumento: "teclado",
      musicas: "Mesmo set do ensaio",
      tom: "G",
    }),
    attr("hoje_ensaio", "Louvor", lucas, {
      instrumento: "bateria",
      musicas: "Click no ensaio",
    }),
    attr("hoje_ensaio", "Louvor", amanda, {
      instrumento: "vocal",
      musicas: "Backing nas 3 músicas",
    }),
    attr("hoje_ensaio", "Som", membro1, {
      funcao: "mesa",
      equipamentos: "Mesa digital + 4 monitores",
      observacoes: "Chegar 30 min antes",
    }),
    attr("hoje_ensaio", "Som", pedro, {
      funcao: "operador_som",
      observacoes: "Auxiliar de linha",
    }),
    attr("hoje_ensaio", "Mídia", gabriel, {
      funcao: "slides",
      arquivos: "Drive/EnsaioHoje.pptx",
    }),

    // HOJE noite — rascunho
    attr("hoje_noite", "Condução", lider2, {
      funcao: "Condução geral",
      observacoes: "Pauta com admin",
    }),
    attr("hoje_noite", "Palavra", patricia, {
      tema: "Liderança servidora — Mc 10:45",
      duracao: "25 min",
    }),
    attr("hoje_noite", "Intercessão", juliana, {
      horario: "19h30 às 19h45",
      tipo: "pre_culto",
    }),

    // Quarta
    attr("quarta_oracao", "Intercessão", ana, {
      horario: "Durante todo o culto",
      tipo: "durante",
      observacoes: "Líder da noite",
    }),
    attr("quarta_oracao", "Intercessão", juliana, {
      horario: "Abertura",
      tipo: "pre_culto",
    }),
    attr("quarta_oracao", "Som", lider1, {
      funcao: "mesa",
      observacoes: "Volume baixo",
    }),
    attr("quarta_oracao", "Voluntários", beatriz, {
      funcao: "portaria",
      observacoes: "Entrada principal",
    }),
    attr("quarta_oracao", "Liturgia", carlos, {
      partes: "Abertura e avisos",
      textos: "Salmo 91",
    }),

    // Sábado ensaio
    attr("sabado_ensaio", "Louvor", lider2, {
      instrumento: "vocal",
      musicas: "Set completo domingo",
      tom: "D",
    }),
    attr("sabado_ensaio", "Louvor", maria, {
      instrumento: "violao",
      musicas: "Set completo",
      tom: "D",
    }),
    attr("sabado_ensaio", "Louvor", joao, {
      instrumento: "baixo",
      musicas: "Set completo",
    }),
    attr("sabado_ensaio", "Louvor", bruno, {
      instrumento: "guitarra",
      musicas: "Set completo",
    }),
    attr("sabado_ensaio", "Som", membro1, {
      funcao: "mesa",
    }),
    attr("sabado_ensaio", "Mídia", carla, {
      funcao: "videos",
      arquivos: "Vinheta abertura.mp4",
    }),

    // CULTOS DOMINGO — escala completa
    attr("culto_domingo", "Louvor", maria, {
      instrumento: "violao",
      musicas: "1. Hosana\n2. Teu Amor não Falha\n3. Porque Ele Vive\n4. Digno",
      tom: "C / G / D",
      observacoes: "Chegar 17h",
    }),
    attr("culto_domingo", "Louvor", fernanda, {
      instrumento: "teclado",
      musicas: "Mesmo set",
      tom: "C",
    }),
    attr("culto_domingo", "Louvor", lucas, {
      instrumento: "bateria",
      musicas: "Click + pads",
    }),
    attr("culto_domingo", "Louvor", joao, {
      instrumento: "baixo",
      musicas: "Mesmo set",
    }),
    attr("culto_domingo", "Louvor", amanda, {
      instrumento: "vocal",
      musicas: "Backing 1",
    }),
    attr("culto_domingo", "Louvor", sandra, {
      instrumento: "vocal",
      musicas: "Backing 2",
    }),
    attr("culto_domingo", "Louvor", bruno, {
      instrumento: "guitarra",
      musicas: "Mesmo set",
    }),
    attr("culto_domingo", "Som", membro1, {
      funcao: "mesa",
      equipamentos: "Mesa X32 + IEMs",
      observacoes: "Soundcheck 17h15",
    }),
    attr("culto_domingo", "Som", pedro, {
      funcao: "transmissao",
      observacoes: "Stream YouTube",
    }),
    attr("culto_domingo", "Voluntários", beatriz, {
      funcao: "boas_vindas",
      observacoes: "Equipe de acolhida",
    }),
    attr("culto_domingo", "Voluntários", ricardo, {
      funcao: "portaria",
    }),
    attr("culto_domingo", "Voluntários", carla, {
      funcao: "cadastro",
      observacoes: "Visitantes novos",
    }),
    attr("culto_domingo", "Mídia", gabriel, {
      funcao: "slides",
      arquivos: "CultoDomingo.pptx",
    }),
    attr("culto_domingo", "Liturgia", carlos, {
      partes: "Abertura, leitura, avisos, benção",
      textos: "João 15:1-8",
    }),
    attr("culto_domingo", "Diaconia", roberto, {
      tipo_servico: "santa_ceia",
      observacoes: "Preparar bandejas 17h30",
    }),
    attr("culto_domingo", "Intercessão", juliana, {
      horario: "17h45 às 18h",
      tipo: "pre_culto",
    }),
    attr("culto_domingo", "Hospitalidade", maria ? sandra : null, {
      funcao: "cafe",
      itens: "Café, chá, biscoitos",
    }),
    attr("culto_domingo", "Palavra", patricia, {
      tema: "Permanecei em mim — João 15",
      duracao: "35 min",
      recurso: "Slides no Drive",
    }),
    attr("culto_domingo", "Condução", lider2, {
      funcao: "Condução geral",
      observacoes: "Cronômetro no bolso",
    }),

    // Domingopassado
    attr("culto_passado", "Louvor", maria, { instrumento: "violao", musicas: "Set antigo" }),
    attr("culto_passado", "Som", membro1, { funcao: "mesa" }),
    attr("culto_passado", "Voluntários", beatriz, { funcao: "portaria" }),
    attr("culto_passado", "Mídia", gabriel, { funcao: "slides" }),
    attr("culto_passado", "Liturgia", carlos, { partes: "Abertura" }),

    // +7 parcial (rascunho — bom para completar / publicar)
    attr("culto_mais7", "Louvor", fernanda, {
      instrumento: "teclado",
      musicas: "A definir",
    }),
    attr("culto_mais7", "Som", pedro, { funcao: "operador_som" }),
    attr("culto_mais7", "Condução", lider2, { funcao: "Condução geral" }),

    // Jovens
    attr("jovens", "Juventude", amanda, {
      funcao: "conducao",
      tema: "Identidade em Cristo",
    }),
    attr("jovens", "Juventude", lucas, { funcao: "louvor" }),
    attr("jovens", "Adolescentes", ana, {
      faixa_etaria: "14_15",
      atividades: "Dinâmica + louvor + palavra",
      tema: "Amizade verdadeira",
    }),
    attr("jovens", "Louvor", bruno, { instrumento: "guitarra", musicas: "Set jovens" }),
    attr("jovens", "Som", membro1, { funcao: "mesa" }),
    attr("jovens", "Voluntários", beatriz, { funcao: "boas_vindas" }),
    attr("jovens", "Mídia", carla, { funcao: "videos" }),

    // Kids
    attr("kids", "Casa Kids", lider1, {
      faixa_etaria: "4_6",
      atividades: "História bíblica + lanche + brincadeira",
      materiais: "Papel colorido, cola, bíblia infantil",
    }),
    attr("kids", "Casa Kids", sandra, {
      faixa_etaria: "7_9",
      atividades: "Teatro bíblico",
    }),
    attr("kids", "Voluntários", ricardo, { funcao: "coordenacao" }),
    attr("kids", "Som", pedro, { funcao: "operador_som" }),

    // Mês passado
    attr("mes_passado_1", "Louvor", maria, { instrumento: "violao", musicas: "Arquivo" }),
    attr("mes_passado_1", "Som", membro1, { funcao: "mesa" }),
    attr("mes_passado_1", "Voluntários", beatriz, { funcao: "portaria" }),
    attr("mes_passado_2", "Louvor", fernanda, { instrumento: "teclado" }),
    attr("mes_passado_2", "Som", pedro, { funcao: "mesa" }),

    // Social
    attr("social", "Social", ana, {
      tipo_servico: "cesta",
      local: "Praça central",
      itens: "30 cestas básicas",
    }),
    attr("social", "Visitação", maria, {
      tipo: "domiciliar",
      endereco: "Rua das Flores, 120",
      horario: "15h",
    }),
    attr("social", "Transporte", joao, {
      funcao: "motorista",
      rota: "Centro → bairro",
      vagas: "4",
    }),
    attr("social", "Voluntários", beatriz, { funcao: "coordenacao" }),

    // Casais
    attr("casais", "Casais", carlos, {
      funcao: "conducao",
      tema: "Aliança e perdão",
    }),
    attr("casais", "Casais", patricia, { funcao: "ensino", tema: "Efésios 5" }),
    attr("casais", "Hospitalidade", sandra, {
      funcao: "jantar",
      itens: "Mesa posta + suco",
    }),
    attr("casais", "Louvor", amanda, { instrumento: "vocal", musicas: "2 músicas acústicas" }),
    attr("casais", "Mídia", gabriel, { funcao: "slides" }),
  ].filter(Boolean);

  // Evitar duplicate unique (área+usuário) — Hospitalidade usou sandra que já pode estar em outro lugar no mesmo evento? culto_domingo Louvor tem sandra vocal e Hospitalidade sandra - SAME EVENT different areas - Validador blocks same user in 2 areas same event. Fix hospitalidade to use different user.
  // Actually I used `maria ? sandra : null` for hospitalidade while sandra is also in Louvor - conflict for business rule. Change hospitalidade to ricardo or carla - carla is in Voluntários. Use gabriel? midia. Use lider1 for hospitalidade.

  // Fix in list: replace hospitalidade sandra with a user not already in culto_domingo
  // Users in culto_domingo: maria, fernanda, lucas, joao, amanda, sandra, bruno, membro1, pedro, beatriz, ricardo, carla, gabriel, carlos, roberto, juliana, patricia, lider2
  // Available: ana, lider1, admin?
  // I'll fix after building - filter duplicates by (area, user) and also remove second area for same user in same event for culto_domingo.

  const atribuicoesLimpas = [];
  const vistoAreaUser = new Set();
  const vistoEventoUser = new Set();
  const areaToEvento = new Map();
  for (const [key, areas] of Object.entries(areasPorKey)) {
    for (const a of areas) {
      areaToEvento.set(a.id_escala_area, idsPorKey[key]);
    }
  }

  // Corrige hospitalidade do culto_domingo: usa ana (não está no culto)
  const fixed = atribuicoes.map((a) => {
    if (!a) return a;
    const evId = areaToEvento.get(a.id_escala_area);
    if (evId === idsPorKey.culto_domingo && a.id_usuario === sandra?.id_usuario) {
      const arHosp = area("culto_domingo", "Hospitalidade");
      if (arHosp && a.id_escala_area === arHosp.id_escala_area && ana) {
        return {
          ...a,
          id_usuario: ana.id_usuario,
          detalhes: JSON.stringify({
            funcao: "cafe",
            itens: "Café, chá, biscoitos",
          }),
        };
      }
    }
    return a;
  });

  for (const a of fixed) {
    if (!a) continue;
    const keyAU = `${a.id_escala_area}:${a.id_usuario}`;
    const evId = areaToEvento.get(a.id_escala_area);
    const keyEU = `${evId}:${a.id_usuario}`;
    if (vistoAreaUser.has(keyAU) || vistoEventoUser.has(keyEU)) continue;
    vistoAreaUser.add(keyAU);
    vistoEventoUser.add(keyEU);
    atribuicoesLimpas.push(a);
  }

  if (atribuicoesLimpas.length) {
    await knex("escala_atribuicao").insert(atribuicoesLimpas);
  }

  // --- Templates ---
  const cultoAreasPayload = (areasPorKey.culto_domingo || []).map((a) => {
    const slots = atribuicoesLimpas
      .filter((at) => at.id_escala_area === a.id_escala_area)
      .map((at) => ({
        id_usuario: at.id_usuario,
        detalhes: typeof at.detalhes === "string" ? JSON.parse(at.detalhes) : at.detalhes,
      }));
    return {
      nome: a.nome,
      ordem: CULTOS_AREAS.indexOf(a.nome),
      id_ministerio: a.id_ministerio,
      slots,
    };
  });

  const templates = [
    {
      nome: "Escala Padrão Domingo",
      id_criador: admin.id_usuario,
      payload: JSON.stringify({
        titulo: "Culto de Celebração",
        descricao: "Template padrão dominical",
        id_ministerios: cultoAreasPayload.map((a) => a.id_ministerio).filter(Boolean),
        areas: cultoAreasPayload,
      }),
    },
    {
      nome: "Ensaio Louvor + Som",
      id_criador: admin.id_usuario,
      payload: JSON.stringify({
        titulo: "Ensaio de Louvor",
        descricao: "Template de ensaio",
        id_ministerios: [min("Louvor")?.id_ministerio, min("Som")?.id_ministerio].filter(Boolean),
        areas: [
          {
            nome: "Louvor",
            ordem: 0,
            id_ministerio: min("Louvor")?.id_ministerio,
            slots: [
              maria && {
                id_usuario: maria.id_usuario,
                detalhes: { instrumento: "violao", musicas: "A definir" },
              },
              fernanda && {
                id_usuario: fernanda.id_usuario,
                detalhes: { instrumento: "teclado" },
              },
            ].filter(Boolean),
          },
          {
            nome: "Som",
            ordem: 1,
            id_ministerio: min("Som")?.id_ministerio,
            slots: [
              membro1 && {
                id_usuario: membro1.id_usuario,
                detalhes: { funcao: "mesa" },
              },
            ].filter(Boolean),
          },
        ],
      }),
    },
    {
      nome: "Noite de Oração",
      id_criador: admin.id_usuario,
      payload: JSON.stringify({
        titulo: "Culto de Oração",
        descricao: "Template intercessão",
        id_ministerios: [
          min("Intercessão")?.id_ministerio,
          min("Som")?.id_ministerio,
          min("Voluntários")?.id_ministerio,
        ].filter(Boolean),
        areas: [
          {
            nome: "Intercessão",
            ordem: 0,
            id_ministerio: min("Intercessão")?.id_ministerio,
            slots: [
              juliana && {
                id_usuario: juliana.id_usuario,
                detalhes: { tipo: "durante", horario: "Integral" },
              },
            ].filter(Boolean),
          },
          {
            nome: "Som",
            ordem: 1,
            id_ministerio: min("Som")?.id_ministerio,
            slots: [],
          },
          {
            nome: "Voluntários",
            ordem: 2,
            id_ministerio: min("Voluntários")?.id_ministerio,
            slots: [],
          },
        ],
      }),
    },
  ];

  try {
    await knex("escala_template").insert(templates);
  } catch (err) {
    console.warn("Templates não inseridos:", err.message);
  }

  // --- Histórico (para desfazer / auditoria) ---
  const idCulto = idsPorKey.culto_domingo;
  const historicos = [
    {
      id_escala_evento: idCulto,
      id_usuario: admin.id_usuario,
      acao: "criacao",
      dados_antes: null,
      dados_depois: JSON.stringify({ titulo: "Culto de Celebração", status: "publicada" }),
    },
    {
      id_escala_evento: idCulto,
      id_usuario: lider2?.id_usuario || admin.id_usuario,
      acao: "atribuicao",
      dados_antes: null,
      dados_depois: JSON.stringify({
        usuario: maria?.nome,
        area: "Louvor",
        instrumento: "violao",
      }),
    },
    {
      id_escala_evento: idCulto,
      id_usuario: admin.id_usuario,
      acao: "edicao",
      dados_antes: JSON.stringify({ descricao: "Culto dominical" }),
      dados_depois: JSON.stringify({
        descricao: "Culto dominical completo — use para drag-and-drop, publicar, template e desfazer.",
      }),
    },
    {
      id_escala_evento: idCulto,
      id_usuario: admin.id_usuario,
      acao: "publicacao",
      dados_antes: JSON.stringify({ status: "rascunho" }),
      dados_depois: JSON.stringify({ status: "publicada" }),
    },
    {
      id_escala_evento: idsPorKey.hoje_noite,
      id_usuario: admin.id_usuario,
      acao: "criacao",
      dados_antes: null,
      dados_depois: JSON.stringify({ titulo: "Reunião de Líderes — Hoje", status: "rascunho" }),
    },
    {
      id_escala_evento: idsPorKey.culto_passado,
      id_usuario: admin.id_usuario,
      acao: "edicao",
      dados_antes: JSON.stringify({ status: "publicada" }),
      dados_depois: JSON.stringify({ status: "concluida" }),
    },
  ];

  try {
    await knex("escala_historico").insert(historicos);
  } catch (err) {
    console.warn("Histórico não inserido:", err.message);
  }

  // Contagens
  const nEventos = Object.keys(idsPorKey).length;
  const nAreas = Object.values(areasPorKey).reduce((s, a) => s + a.length, 0);
  const nAttr = atribuicoesLimpas.length;

  console.log(
    `✅ Escala completa: ${nEventos} eventos, ${nAreas} áreas, ${nAttr} atribuições, ${templates.length} templates, ${historicos.length} históricos`
  );
  console.log("   Contas úteis:");
  console.log("   - admin@test.com / 123456  → criar/editar/templates/copiar/publicar");
  console.log("   - lider2@test.com / 123456 → Louvor, Voluntários, Mídia, Juventude (escalar/DnD)");
  console.log("   - lider@test.com / 123456  → Som, Casa Kids");
  console.log("   - ana.lider@test.com / 123456 → Intercessão, Adolescentes, Social");
  console.log("   - membro@test.com / 123456 → só visualizar");
}

/** Executa só o seed de escala (sem limpar o resto do banco) */
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.includes("seed_escala")) {
  // no-op: use scripts/seedEscalaOnly.js
}
