import knex from "../database/index.js";

/**
 * Seed para células da igreja
 * Cria células de exemplo vinculadas aos líderes cadastrados (suporta múltiplos líderes)
 */
export async function seed() {
  await knex("celula_lider").del();
  await knex("celula").del();

  const lideres = await knex("usuario")
    .where({ tipo: "lider" })
    .orderBy("id_usuario");

  if (!lideres.length) {
    console.log("Nenhum líder encontrado. Execute seed_usuario.js primeiro.");
    return;
  }

  const lider1 = lideres[0];
  const lider2 = lideres[1] ?? lider1;

  const celulasData = [
    {
      nome: "Célula Esperança",
      endereco: "Rua das Flores, 123 - Centro",
      dia_reuniao: "quarta",
      horario_reuniao: "19:30:00",
      ativa: true,
    },
    {
      nome: "Célula Renovação",
      endereco: "Av. Principal, 456 - Bairro Novo",
      dia_reuniao: "quinta",
      horario_reuniao: "20:00:00",
      ativa: true,
    },
    {
      nome: "Célula Fé e Vida",
      endereco: "Rua do Comércio, 789 - Vila Rosa",
      dia_reuniao: "sexta",
      horario_reuniao: "19:00:00",
      ativa: true,
    },
  ];

  const ids = [];
  for (const c of celulasData) {
    const [id] = await knex("celula").insert(c);
    ids.push(id);
  }

  await knex("celula_lider").insert([
    { id_celula: ids[0], id_usuario: lider1.id_usuario, principal: true },
    { id_celula: ids[1], id_usuario: lider1.id_usuario, principal: true },
    { id_celula: ids[2], id_usuario: lider2.id_usuario, principal: true },
    // Célula Esperança tem 2 líderes (exemplo de múltiplos líderes)
    ...(lider1.id_usuario !== lider2.id_usuario
      ? [{ id_celula: ids[0], id_usuario: lider2.id_usuario, principal: false }]
      : []),
  ]);

  console.log("✅ Células inseridas com sucesso!");
}
