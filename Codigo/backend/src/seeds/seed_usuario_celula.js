import knex from "../database/index.js";

/**
 * Seed — vincula membros às células oficiais
 */
export async function seed() {
  await knex("usuario_celula").del();

  const celulas = await knex("celula").select("id_celula", "nome").orderBy("nome");
  const usuarios = await knex("usuario")
    .select("id_usuario", "email", "tipo")
    .where({ ativo: true });
  const getUsuario = (email) => usuarios.find((u) => u.email === email);

  if (celulas.length === 0) {
    console.log("Execute seed_celula primeiro.");
    return;
  }

  const byNome = (nome) => celulas.find((c) => c.nome === nome);

  const vinculos = [];
  const add = (email, nomeCelula, principal = true) => {
    const u = getUsuario(email);
    const c = byNome(nomeCelula);
    if (u && c) {
      vinculos.push({
        id_usuario: u.id_usuario,
        id_celula: c.id_celula,
        principal,
      });
    }
  };

  // Líderes oficiais nas suas células
  add("lorrayne.andrade@casadosdiscipulos.org", "Visão");
  add("iza@casadosdiscipulos.org", "Pérolas");
  add("valquiria.kelly@casadosdiscipulos.org", "Morada");
  add("arlem.cleizer@casadosdiscipulos.org", "Resgate");
  add("ana.paula@casadosdiscipulos.org", "Reino");
  add("simone@casadosdiscipulos.org", "Videira");
  add("luana@casadosdiscipulos.org", "Farol");

  // Membros demo distribuídos
  add("membro@test.com", "Reino");
  add("maria@test.com", "Pérolas");
  add("joao@test.com", "Resgate");
  add("fernanda@test.com", "Visão");
  add("pedro@test.com", "Morada");
  add("juliana@test.com", "Videira");
  add("amanda@test.com", "Farol");
  add("beatriz@test.com", "Reino");
  add("lucas@test.com", "Reino");
  add("carla@test.com", "Pérolas");
  add("sandra@test.com", "Morada");

  if (vinculos.length > 0) {
    await knex("usuario_celula").insert(vinculos);
  }

  console.log(`✅ ${vinculos.length} vínculos usuário-célula inseridos!`);
}
