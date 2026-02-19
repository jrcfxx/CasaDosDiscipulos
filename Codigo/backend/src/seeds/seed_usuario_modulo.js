import knex from "../database/index.js";

/**
 * Seed para progresso de usuários em módulos (usuario_modulo)
 * Liga usuários aos módulos com status (em andamento, concluído)
 * Depende de: seed_usuario, seed_modulo
 */
export async function seed() {
  await knex("usuario_modulo").del();

  const membro1 = await knex("usuario").where({ email: "membro@test.com" }).first();
  const maria = await knex("usuario").where({ email: "maria@test.com" }).first();
  const lider1 = await knex("usuario").where({ email: "lider@test.com" }).first();
  const modulos = await knex("modulo").select("id_modulo", "ordem").orderBy("ordem");

  if (!membro1 || modulos.length === 0) {
    console.log("Execute seed_usuario e seed_modulo primeiro.");
    return;
  }

  const registros = [];

  // Membro Teste: módulo 1 concluído, módulo 2 em andamento
  if (modulos[0]) {
    registros.push({
      id_usuario: membro1.id_usuario,
      id_modulo: modulos[0].id_modulo,
      status: "concluido",
      nota_quiz: 85.5,
      data_conclusao: new Date(),
    });
  }
  if (modulos[1] && maria) {
    registros.push({
      id_usuario: maria.id_usuario,
      id_modulo: modulos[1].id_modulo,
      status: "em_andamento",
      nota_quiz: null,
      data_conclusao: null,
    });
  }
  if (modulos[0] && lider1) {
    registros.push({
      id_usuario: lider1.id_usuario,
      id_modulo: modulos[0].id_modulo,
      status: "concluido",
      nota_quiz: 92.0,
      data_conclusao: new Date(),
    });
  }

  if (registros.length > 0) {
    await knex("usuario_modulo").insert(registros);
  }

  console.log("✅ Progresso usuário-módulo inserido com sucesso!");
}
