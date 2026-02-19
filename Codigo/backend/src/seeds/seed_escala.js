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
  const ministerios = await knex("ministerio").select("id_ministerio").orderBy("ordem");
  const membro1 = await knex("usuario").where({ email: "membro@test.com" }).first();
  const maria = await knex("usuario").where({ email: "maria@test.com" }).first();

  if (!admin || ministerios.length === 0) {
    console.log("Execute seed_usuario e seed_ministerio primeiro.");
    return;
  }

  const agora = new Date();
  const proximoDomingo = new Date(agora);
  proximoDomingo.setDate(agora.getDate() + ((7 - agora.getDay()) % 7));
  proximoDomingo.setHours(19, 0, 0, 0);

  const [idEvento1] = await knex("escala_evento").insert({
    titulo: "Culto de Celebração",
    data_hora: proximoDomingo.toISOString().slice(0, 19).replace("T", " "),
    descricao: "Culto dominical de louvor e pregação",
    ativo: true,
    id_criador: admin.id_usuario,
  });

  const proximoDomingo2 = new Date(proximoDomingo);
  proximoDomingo2.setDate(proximoDomingo2.getDate() + 7);
  const [idEvento2] = await knex("escala_evento").insert({
    titulo: "Ensaio de Louvor",
    data_hora: proximoDomingo2.toISOString().slice(0, 19).replace("T", " "),
    descricao: "Ensaio do ministério de louvor",
    ativo: true,
    id_criador: admin.id_usuario,
  });

  // Áreas para cada evento
  const areas1 = [
    { id_escala_evento: idEvento1, nome: "Som", ordem: 0 },
    { id_escala_evento: idEvento1, nome: "Louvor", ordem: 1 },
    { id_escala_evento: idEvento1, nome: "Recepção", ordem: 2 },
  ];
  const areas2 = [
    { id_escala_evento: idEvento2, nome: "Louvor", ordem: 0 },
    { id_escala_evento: idEvento2, nome: "Som", ordem: 1 },
  ];

  await knex("escala_area").insert(areas1);
  await knex("escala_area").insert(areas2);

  const areasEvento1 = await knex("escala_area").where({ id_escala_evento: idEvento1 }).orderBy("ordem");
  const evento1Ministerios = ministerios.slice(0, 3).map((m) => ({
    id_escala_evento: idEvento1,
    id_ministerio: m.id_ministerio,
  }));
  if (evento1Ministerios.length > 0) {
    await knex("escala_evento_ministerio").insert(evento1Ministerios);
  }

  await knex("escala_evento_ministerio").insert(
    ministerios.slice(0, 2).map((m) => ({
      id_escala_evento: idEvento2,
      id_ministerio: m.id_ministerio,
    }))
  );

  // Atribuições de exemplo (som e louvor)
  const areaSom = areasEvento1.find((a) => a.nome === "Som");
  const areaLouvor = areasEvento1.find((a) => a.nome === "Louvor");

  const atribuicoes = [];
  if (areaSom && membro1) {
    atribuicoes.push({ id_escala_area: areaSom.id_escala_area, id_usuario: membro1.id_usuario });
  }
  if (areaLouvor && maria) {
    atribuicoes.push({ id_escala_area: areaLouvor.id_escala_area, id_usuario: maria.id_usuario });
  }
  if (atribuicoes.length > 0) {
    await knex("escala_atribuicao").insert(atribuicoes);
  }

  console.log("✅ Escala (eventos e atribuições) inseridos com sucesso!");
}
