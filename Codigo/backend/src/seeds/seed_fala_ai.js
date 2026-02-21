import knex from "../database/index.js";

/**
 * Seed para Fala Aí - devocional e palavra do dia
 * Depende de: seed_usuario
 */
export async function seed() {
  await knex("fala_ai_comentario").del();
  await knex("fala_ai_post").del();

  const admin = await knex("usuario").where({ email: "admin@test.com" }).first();
  const maria = await knex("usuario").where({ email: "maria@test.com" }).first();
  const lider = await knex("usuario").where({ email: "lider2@test.com" }).first();

  if (!admin || !maria || !lider) {
    console.log("Execute seed_usuario primeiro.");
    return;
  }

  const hoje = new Date().toISOString().slice(0, 10);

  const posts = [
    {
      id_usuario: admin.id_usuario,
      tipo: "palavra_do_dia",
      titulo: null,
      conteudo:
        "O Senhor é meu pastor; nada me faltará. Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso.\n\nConfie no Senhor de todo o seu coração.",
      referencia: "Salmos 23:1-2; Provérbios 3:5",
      imagem_url: null,
      data_publicacao: hoje,
    },
    {
      id_usuario: lider.id_usuario,
      tipo: "devocional",
      titulo: "Confiança no Senhor",
      conteudo:
        "Quando passamos por momentos de incerteza, a Palavra nos lembra que Deus está no controle.\n\nHoje, escolha confiar. Entregue seus planos ao Senhor e veja os resultados.",
      referencia: "Provérbios 16:3",
      imagem_url: null,
      data_publicacao: hoje,
    },
  ];

  const ids = [];
  for (const p of posts) {
    const [id] = await knex("fala_ai_post").insert(p);
    ids.push(id);
  }

  await knex("fala_ai_comentario").insert([
    {
      id_post: ids[0],
      id_usuario: maria.id_usuario,
      texto: "Essa palavra veio no momento certo! Obrigada.",
    },
    {
      id_post: ids[1],
      id_usuario: admin.id_usuario,
      texto: "Que devocional abençoado!",
    },
  ]);

  console.log(`✅ Fala Aí: ${posts.length} posts e 2 comentários inseridos!`);
}
