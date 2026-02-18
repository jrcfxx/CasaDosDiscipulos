import knex from "../database/index.js";

/**
 * Seed para quizzes
 * Cria quizzes de exemplo vinculados a módulos
 */
export async function seed() {
  await knex("quiz").del();

  // Buscar módulos cadastrados
  const modulos = await knex("modulo").select("id_modulo");

  if (modulos.length === 0) {
    console.log("Nenhum módulo encontrado. Execute seed_modulo.js primeiro.");
    return;
  }

  await knex("quiz").insert([
    {
      id_modulo: modulos[0].id_modulo,
      titulo: "Quiz de Fundamentos da Fé",
      descricao: "Teste seus conhecimentos sobre os fundamentos da fé cristã.",
      ativo: true,
    },
    ...(modulos.length > 1
      ? [
          {
            id_modulo: modulos[1].id_modulo,
            titulo: "Quiz sobre Oração",
            descricao:
              "Avalie seu conhecimento sobre a importância e prática da oração.",
            ativo: true,
          },
        ]
      : []),
  ]);

  console.log("✅ Quizzes inseridos com sucesso!");
}
