import knex from "../database/index.js";

/**
 * Seed para vínculo usuário-célula
 * Liga membros e líderes às suas células
 */
export async function seed() {
  await knex("usuario_celula").del();

  const lider = await knex("usuario").where({ tipo: "lider" }).first();
  const membro1 = await knex("usuario").where({ email: "membro@test.com" }).first();
  const membro2 = await knex("usuario").where({ email: "maria@test.com" }).first();
  const celulas = await knex("celula").select("id_celula", "nome").orderBy("id_celula");

  if (!lider || celulas.length === 0) {
    console.log("Execute seed_usuario e seed_celula primeiro.");
    return;
  }

  const vinculos = [];
  const lider2 = await knex("usuario").where({ email: "lider2@test.com" }).first();

  // Líder 1 nas células que lidera (Esperança, Renovação)
  vinculos.push(
    { id_usuario: lider.id_usuario, id_celula: celulas[0].id_celula, principal: true },
    { id_usuario: lider.id_usuario, id_celula: celulas[1].id_celula, principal: false }
  );

  // Líder 2 na célula Fé e Vida (que lidera)
  if (lider2 && celulas[2]) {
    vinculos.push({ id_usuario: lider2.id_usuario, id_celula: celulas[2].id_celula, principal: true });
  }

  // Membros nas suas células
  if (membro1) {
    vinculos.push({ id_usuario: membro1.id_usuario, id_celula: celulas[0].id_celula, principal: true });
  }
  if (membro2 && celulas[1]) {
    vinculos.push({ id_usuario: membro2.id_usuario, id_celula: celulas[1].id_celula, principal: true });
  }

  if (vinculos.length > 0) {
    await knex("usuario_celula").insert(vinculos);
  }

  console.log("✅ Vínculos usuário-célula inseridos com sucesso!");
}
