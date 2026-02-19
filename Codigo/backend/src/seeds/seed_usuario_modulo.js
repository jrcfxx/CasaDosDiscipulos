import knex from "../database/index.js";

/**
 * Seed para progresso de usuários em módulos (usuario_modulo)
 * Liga usuários aos módulos com status (em andamento, concluído)
 * Depende de: seed_usuario, seed_modulo
 */
export async function seed() {
  await knex("usuario_modulo").del();

  const usuarios = await knex("usuario").select("id_usuario", "email").where({ ativo: true });
  const modulos = await knex("modulo").select("id_modulo", "ordem").orderBy("ordem");
  const getUsuario = (email) => usuarios.find((u) => u.email === email);

  if (modulos.length === 0) {
    console.log("Execute seed_usuario e seed_modulo primeiro.");
    return;
  }

  const registros = [];
  const add = (user, modIdx, status, nota) => {
    if (user && modulos[modIdx])
      registros.push({
        id_usuario: user.id_usuario,
        id_modulo: modulos[modIdx].id_modulo,
        status,
        nota_quiz: nota ?? null,
        data_conclusao: status === "concluido" ? new Date() : null,
      });
  };

  add(getUsuario("membro@test.com"), 0, "concluido", 85.5);
  add(getUsuario("membro@test.com"), 1, "em_andamento", null);
  add(getUsuario("maria@test.com"), 0, "concluido", 78);
  add(getUsuario("maria@test.com"), 1, "concluido", 90);
  add(getUsuario("maria@test.com"), 2, "em_andamento", null);
  add(getUsuario("joao@test.com"), 0, "concluido", 72);
  add(getUsuario("fernanda@test.com"), 0, "concluido", 95);
  add(getUsuario("fernanda@test.com"), 1, "concluido", 88);
  add(getUsuario("fernanda@test.com"), 2, "concluido", 82);
  add(getUsuario("pedro@test.com"), 0, "em_andamento", null);
  add(getUsuario("lider@test.com"), 0, "concluido", 92);
  add(getUsuario("lider@test.com"), 1, "concluido", 88);
  add(getUsuario("lider@test.com"), 2, "concluido", 95);
  add(getUsuario("lider2@test.com"), 0, "concluido", 90);
  add(getUsuario("lider2@test.com"), 1, "concluido", 85);
  add(getUsuario("lider2@test.com"), 2, "concluido", 88);
  add(getUsuario("amanda@test.com"), 0, "concluido", 98);
  add(getUsuario("amanda@test.com"), 1, "concluido", 92);
  add(getUsuario("patricia@test.com"), 0, "concluido", 100);
  add(getUsuario("patricia@test.com"), 1, "concluido", 95);
  add(getUsuario("patricia@test.com"), 2, "concluido", 90);

  if (registros.length > 0) {
    await knex("usuario_modulo").insert(registros);
  }

  console.log(`✅ ${registros.length} registros usuário-módulo inseridos!`);
}
