import knex from "../database/index.js";

/**
 * Seed para vínculo usuário-célula
 * Liga membros e líderes às suas células
 */
export async function seed() {
  await knex("usuario_celula").del();

  const celulas = await knex("celula").select("id_celula", "nome").orderBy("id_celula");
  const usuarios = await knex("usuario").select("id_usuario", "email").where({ ativo: true });
  const getUsuario = (email) => usuarios.find((u) => u.email === email);

  if (celulas.length === 0) {
    console.log("Execute seed_celula primeiro.");
    return;
  }

  const lider = getUsuario("lider@test.com") ?? usuarios.find((u) => u.email?.includes("lider"));
  const lider2 = getUsuario("lider2@test.com");
  const membro1 = getUsuario("membro@test.com");
  const maria = getUsuario("maria@test.com");
  const joao = getUsuario("joao@test.com");
  const fernanda = getUsuario("fernanda@test.com");
  const pedro = getUsuario("pedro@test.com");
  const juliana = getUsuario("juliana@test.com");
  const amanda = getUsuario("amanda@test.com");
  const beatriz = getUsuario("beatriz@test.com");
  const lucas = getUsuario("lucas@test.com");
  const carla = getUsuario("carla@test.com");

  const vinculos = [];

  // Líderes nas células que lideram
  if (lider) {
    vinculos.push({ id_usuario: lider.id_usuario, id_celula: celulas[0].id_celula, principal: true });
    vinculos.push({ id_usuario: lider.id_usuario, id_celula: celulas[1].id_celula, principal: false });
  }
  if (lider2) {
    vinculos.push({ id_usuario: lider2.id_usuario, id_celula: celulas[2].id_celula, principal: true });
    vinculos.push({ id_usuario: lider2.id_usuario, id_celula: celulas[0].id_celula, principal: false });
    if (celulas[7]) vinculos.push({ id_usuario: lider2.id_usuario, id_celula: celulas[7].id_celula, principal: true });
  }
  const ana = getUsuario("ana.lider@test.com");
  const carlos = getUsuario("carlos.lider@test.com");
  if (ana) {
    if (celulas[3]) vinculos.push({ id_usuario: ana.id_usuario, id_celula: celulas[3].id_celula, principal: true });
    if (celulas[6]) vinculos.push({ id_usuario: ana.id_usuario, id_celula: celulas[6].id_celula, principal: true });
  }
  if (carlos) {
    if (celulas[4]) vinculos.push({ id_usuario: carlos.id_usuario, id_celula: celulas[4].id_celula, principal: true });
    if (celulas[5]) vinculos.push({ id_usuario: carlos.id_usuario, id_celula: celulas[5].id_celula, principal: true });
  }

  // Membros nas células
  const membrosCelula0 = [membro1, maria, joao];
  const membrosCelula1 = [fernanda, pedro];
  const membrosCelula2 = [juliana, amanda];
  const membrosCelula3 = [beatriz, lucas, carla];

  [membrosCelula0, membrosCelula1, membrosCelula2, membrosCelula3].forEach((arr, idx) => {
    const cel = celulas[idx];
    if (cel)
      arr.filter(Boolean).forEach((u) => vinculos.push({ id_usuario: u.id_usuario, id_celula: cel.id_celula, principal: true }));
  });

  // Distribuir outros membros
  const outros = usuarios.filter((u) => !vinculos.some((v) => v.id_usuario === u.id_usuario) && u.tipo === "membro");
  outros.slice(0, 5).forEach((u, i) => {
    if (celulas[i % celulas.length])
      vinculos.push({ id_usuario: u.id_usuario, id_celula: celulas[i % celulas.length].id_celula, principal: true });
  });

  if (vinculos.length > 0) {
    await knex("usuario_celula").insert(vinculos);
  }

  console.log(`✅ ${vinculos.length} vínculos usuário-célula inseridos!`);
}
