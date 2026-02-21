import knex from "../database/index.js";

/**
 * Seed para notificações
 * Notificações de exemplo: evento_criado, escalado
 * Depende de: seed_usuario, seed_escala
 */
export async function seed() {
  await knex("notificacao").del();

  const usuarios = await knex("usuario").select("id_usuario", "email").where({ ativo: true });
  const eventos = await knex("escala_evento").select("id_escala_evento", "titulo").orderBy("id_escala_evento");
  const getUsuario = (email) => usuarios.find((u) => u.email === email);

  if (eventos.length === 0) {
    console.log("Execute seed_escala primeiro.");
    return;
  }

  const maria = getUsuario("maria@test.com");
  const membro1 = getUsuario("membro@test.com");
  const fernanda = getUsuario("fernanda@test.com");
  const pedro = getUsuario("pedro@test.com");
  const juliana = getUsuario("juliana@test.com");
  const amanda = getUsuario("amanda@test.com");
  const beatriz = getUsuario("beatriz@test.com");

  const notificacoes = [];

  // evento_criado - notificar vários usuários sobre novos eventos
  eventos.slice(0, 3).forEach((ev, i) => {
    [maria, membro1, fernanda].filter(Boolean).forEach((u, j) => {
      if (i === 0 || j < 2) {
        notificacoes.push({
          id_usuario: u.id_usuario,
          tipo: "evento_criado",
          id_escala_evento: ev.id_escala_evento,
          titulo: `Novo evento: ${ev.titulo}`,
          mensagem: `Foi criado um novo evento na escala: ${ev.titulo}. Confira os detalhes.`,
          lido: i + j > 2,
        });
      }
    });
  });

  // escalado - usuário foi escalado
  const escalados = [
    { user: maria, evento: eventos[0], area: "Louvor" },
    { user: membro1, evento: eventos[0], area: "Som" },
    { user: beatriz, evento: eventos[0], area: "Voluntários" },
    { user: fernanda, evento: eventos[1], area: "Louvor" },
    { user: pedro, evento: eventos[1], area: "Som" },
    { user: juliana, evento: eventos[2], area: "Intercessão" },
    { user: amanda, evento: eventos[3], area: "Juventude" },
  ];

  escalados.forEach(({ user, evento, area }) => {
    if (user)
      notificacoes.push({
        id_usuario: user.id_usuario,
        tipo: "escalado",
        id_escala_evento: evento.id_escala_evento,
        titulo: `Você foi escalado(a) para ${evento.titulo}`,
        mensagem: `Você foi designado(a) para a área ${area} no evento ${evento.titulo}.`,
        area_nome: area,
        lido: false,
      });
  });

  if (notificacoes.length > 0) {
    await knex("notificacao").insert(notificacoes);
  }

  console.log(`✅ ${notificacoes.length} notificações inseridas!`);
}
