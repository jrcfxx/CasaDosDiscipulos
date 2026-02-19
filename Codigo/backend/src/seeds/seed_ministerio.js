import knex from "../database/index.js";

/**
 * Seed para ministérios
 * Cria ministérios, vincula líderes (ministerio_lider) e participantes (usuario_ministerio)
 * Depende de: seed_usuario
 */
export async function seed() {
  await knex("usuario_ministerio").del();
  await knex("ministerio_lider").del();
  await knex("ministerio").del();

  await knex("ministerio").insert([
    { nome: "Louvor", descricao: "Ministério de louvor e música", ativo: true, ordem: 1 },
    { nome: "Som", descricao: "Operação de som e mídia", ativo: true, ordem: 2 },
    { nome: "Recepção", descricao: "Acolhimento e recepção de visitantes", ativo: true, ordem: 3 },
  ]);

  const ministerios = await knex("ministerio").select("id_ministerio", "nome").orderBy("ordem");
  const louvor = ministerios.find((m) => m.nome === "Louvor");
  const som = ministerios.find((m) => m.nome === "Som");
  const recepcao = ministerios.find((m) => m.nome === "Recepção");

  const lider2 = await knex("usuario").where({ email: "lider2@test.com" }).first();
  const lider1 = await knex("usuario").where({ email: "lider@test.com" }).first();
  const membro1 = await knex("usuario").where({ email: "membro@test.com" }).first();
  const maria = await knex("usuario").where({ email: "maria@test.com" }).first();
  const admin = await knex("usuario").where({ email: "admin@test.com" }).first();

  const vinculos = [];
  if (lider2 && louvor) vinculos.push({ id_ministerio: louvor.id_ministerio, id_usuario: lider2.id_usuario });
  if (lider1 && som) vinculos.push({ id_ministerio: som.id_ministerio, id_usuario: lider1.id_usuario });
  if (lider2 && recepcao) vinculos.push({ id_ministerio: recepcao.id_ministerio, id_usuario: lider2.id_usuario });

  if (vinculos.length > 0) {
    await knex("ministerio_lider").insert(vinculos);
    const idsLideres = [...new Set(vinculos.map((v) => v.id_usuario))];
    await knex("usuario").whereIn("id_usuario", idsLideres).update({ lider_ministerio: true });
  }

  const participa = [];
  if (louvor) {
    if (membro1) participa.push({ id_ministerio: louvor.id_ministerio, id_usuario: membro1.id_usuario });
    if (maria) participa.push({ id_ministerio: louvor.id_ministerio, id_usuario: maria.id_usuario });
    if (lider2) participa.push({ id_ministerio: louvor.id_ministerio, id_usuario: lider2.id_usuario });
  }
  if (som && lider1) participa.push({ id_ministerio: som.id_ministerio, id_usuario: lider1.id_usuario });
  if (som && admin) participa.push({ id_ministerio: som.id_ministerio, id_usuario: admin.id_usuario });
  if (recepcao && maria) participa.push({ id_ministerio: recepcao.id_ministerio, id_usuario: maria.id_usuario });
  if (recepcao && membro1) participa.push({ id_ministerio: recepcao.id_ministerio, id_usuario: membro1.id_usuario });

  if (participa.length > 0) {
    await knex("usuario_ministerio").insert(participa);
  }

  console.log("✅ Ministérios inseridos com sucesso!");
}
