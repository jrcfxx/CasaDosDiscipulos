import knex from "../database/index.js";

/**
 * Seed para Escala (eventos de calendário, áreas e atribuições)
 * Depende de: seed_usuario, seed_ministerio
 */
export async function seed() {
  await knex("escala_atribuicao").del();
  await knex("escala_evento_ministerio").del();
  await knex("escala_area").del();
  await knex("escala_evento").del();

  const admin = await knex("usuario").where({ email: "admin@test.com" }).first();
  const ministerios = await knex("ministerio").select("id_ministerio", "nome").orderBy("ordem");
  const usuarios = await knex("usuario")
    .select("id_usuario", "email")
    .where({ ativo: true });

  const getUsuario = (email) => usuarios.find((u) => u.email === email);
  const membro1 = getUsuario("membro@test.com");
  const maria = getUsuario("maria@test.com");
  const joao = getUsuario("joao@test.com");
  const fernanda = getUsuario("fernanda@test.com");
  const pedro = getUsuario("pedro@test.com");
  const juliana = getUsuario("juliana@test.com");
  const amanda = getUsuario("amanda@test.com");
  const beatriz = getUsuario("beatriz@test.com");

  if (!admin || ministerios.length === 0) {
    console.log("Execute seed_usuario e seed_ministerio primeiro.");
    return;
  }

  const agora = new Date();
  const proximoDomingo = new Date(agora);
  proximoDomingo.setDate(agora.getDate() + ((7 - agora.getDay()) % 7));

  const formatDt = (d, h = 19, m = 0) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  const formatDtFim = (d, h = 21, m = 0) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

  const eventosData = [
    { titulo: "Culto de Celebração", data: proximoDomingo, desc: "Culto dominical de louvor e pregação", h: 18, hf: 20, m: 30 },
    { titulo: "Ensaio de Louvor", data: new Date(proximoDomingo.getTime() - 86400000), desc: "Ensaio do ministério de louvor", h: 18, hf: 20, m: 30 },
    { titulo: "Culto de Oração", data: new Date(proximoDomingo.getTime() + 7 * 86400000), desc: "Noite de oração e intercessão", h: 19, hf: 21 },
    { titulo: "Culto Especial Jovens", data: new Date(proximoDomingo.getTime() + 14 * 86400000), desc: "Culto temático para juventude", h: 19, hf: 21 },
    { titulo: "Ensaio Geral", data: new Date(proximoDomingo.getTime() - 2 * 86400000), desc: "Ensaio geral da equipe de louvor", h: 19, hf: 21, m: 0 },
  ];

  const idsEventos = [];
  for (const ev of eventosData) {
    const [id] = await knex("escala_evento").insert({
      titulo: ev.titulo,
      data_hora: formatDt(ev.data, ev.h ?? 19, ev.m ?? 0),
      data_hora_fim: formatDtFim(ev.data, ev.hf ?? 21, ev.m ?? 0),
      descricao: ev.desc,
      ativo: true,
      id_criador: admin.id_usuario,
    });
    idsEventos.push({ id, ev });
  }

  const areasPorEvento = {
    0: ["Som", "Louvor", "Voluntários", "Mídia", "Liturgia", "Diaconia", "Intercessão"],
    1: ["Louvor", "Som"],
    2: ["Intercessão", "Som", "Voluntários", "Liturgia"],
    3: ["Juventude", "Som", "Louvor", "Voluntários", "Mídia"],
    4: ["Louvor", "Som", "Liturgia"],
  };

  const areasInseridas = {};
  for (let i = 0; i < idsEventos.length; i++) {
    const { id } = idsEventos[i];
    const areas = areasPorEvento[i] ?? ["Louvor", "Som"];
    for (let j = 0; j < areas.length; j++) {
      const [idArea] = await knex("escala_area").insert({
        id_escala_evento: id,
        nome: areas[j],
        ordem: j,
      });
      if (!areasInseridas[id]) areasInseridas[id] = [];
      areasInseridas[id].push({ id_escala_area: idArea, nome: areas[j] });
    }
  }

  // Vincular ministérios aos eventos
  for (let i = 0; i < idsEventos.length; i++) {
    const { id } = idsEventos[i];
    const ministeriosEvento = ministerios.slice(0, 4 + (i % 4));
    await knex("escala_evento_ministerio").insert(
      ministeriosEvento.map((m) => ({ id_escala_evento: id, id_ministerio: m.id_ministerio }))
    );
  }

  // Atribuições com detalhes por ministério
  const detalhesPorArea = {
    Louvor: { instrumento: "Violão", musicas: "Rei dos Reis, Cristo é o Senhor", funcao: "Backing vocal" },
    Som: { funcao: "Operador de mesa", observacoes: "Chegar 30 min antes" },
    Voluntários: { funcao: "Recepcionista principal", observacoes: "Porta de entrada" },
    Mídia: { funcao: "Projeção", observacoes: "Slides e transmissão" },
    Liturgia: { funcao: "Condução geral", observacoes: "" },
    Diaconia: { funcao: "Santa Ceia", observacoes: "" },
    Intercessão: { funcao: "Oração de abertura", observacoes: "" },
    Juventude: { funcao: "Condução", tema: "Identidade em Cristo" },
  };

  const atribuicoes = [];
  const ev0 = areasInseridas[idsEventos[0].id];
  if (ev0) {
    const areaSom = ev0.find((a) => a.nome === "Som");
    const areaLouvor = ev0.find((a) => a.nome === "Louvor");
    const areaVoluntarios = ev0.find((a) => a.nome === "Voluntários");
    if (areaSom && membro1)
      atribuicoes.push({
        id_escala_area: areaSom.id_escala_area,
        id_usuario: membro1.id_usuario,
        detalhes: JSON.stringify(detalhesPorArea.Som),
      });
    if (areaLouvor && maria)
      atribuicoes.push({
        id_escala_area: areaLouvor.id_escala_area,
        id_usuario: maria.id_usuario,
        detalhes: JSON.stringify(detalhesPorArea.Louvor),
      });
    if (areaVoluntarios && beatriz)
      atribuicoes.push({
        id_escala_area: areaVoluntarios.id_escala_area,
        id_usuario: beatriz.id_usuario,
        detalhes: JSON.stringify(detalhesPorArea.Voluntários),
      });
  }

  const ev1 = areasInseridas[idsEventos[1].id];
  if (ev1) {
    const areaLouvor = ev1.find((a) => a.nome === "Louvor");
    const areaSom = ev1.find((a) => a.nome === "Som");
    if (areaLouvor && fernanda)
      atribuicoes.push({
        id_escala_area: areaLouvor.id_escala_area,
        id_usuario: fernanda.id_usuario,
        detalhes: JSON.stringify({ instrumento: "Teclado", musicas: "Ensaio geral", funcao: "Tecladista" }),
      });
    if (areaSom && pedro)
      atribuicoes.push({
        id_escala_area: areaSom.id_escala_area,
        id_usuario: pedro.id_usuario,
        detalhes: JSON.stringify({ funcao: "Operador auxiliar", observacoes: "" }),
      });
  }

  const ev2 = areasInseridas[idsEventos[2].id];
  if (ev2 && juliana) {
    const areaIntercessao = ev2.find((a) => a.nome === "Intercessão");
    if (areaIntercessao)
      atribuicoes.push({
        id_escala_area: areaIntercessao.id_escala_area,
        id_usuario: juliana.id_usuario,
        detalhes: JSON.stringify({ funcao: "Líder de intercessão", observacoes: "" }),
      });
  }

  const ev3 = areasInseridas[idsEventos[3].id];
  if (ev3 && amanda) {
    const areaJuventude = ev3.find((a) => a.nome === "Juventude");
    if (areaJuventude)
      atribuicoes.push({
        id_escala_area: areaJuventude.id_escala_area,
        id_usuario: amanda.id_usuario,
        detalhes: JSON.stringify(detalhesPorArea.Juventude),
      });
  }

  if (atribuicoes.length > 0) {
    await knex("escala_atribuicao").insert(atribuicoes);
  }

  console.log(`✅ Escala: ${eventosData.length} eventos, ${atribuicoes.length} atribuições inseridas!`);
}
