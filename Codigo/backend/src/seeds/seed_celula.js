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
  const ana = lideres[2] ?? lider1;
  const carlos = lideres[3] ?? lider1;

  const celulasData = [
    { nome: "Célula Esperança", endereco: "Rua das Flores, 123 - Centro", dia_reuniao: "quarta", horario_reuniao: "19:30:00", ativa: true },
    { nome: "Célula Renovação", endereco: "Av. Principal, 456 - Bairro Novo", dia_reuniao: "quinta", horario_reuniao: "20:00:00", ativa: true },
    { nome: "Célula Fé e Vida", endereco: "Rua do Comércio, 789 - Vila Rosa", dia_reuniao: "sexta", horario_reuniao: "19:00:00", ativa: true },
    { nome: "Célula Avivamento", endereco: "Rua das Acácias, 50 - Jardim Paulista", dia_reuniao: "terca", horario_reuniao: "20:00:00", ativa: true },
    { nome: "Célula Restauração", endereco: "Av. Brasil, 1200 - Centro", dia_reuniao: "quinta", horario_reuniao: "19:30:00", ativa: true },
    { nome: "Célula Paz", endereco: "Rua Horizonte, 88 - Vila Verde", dia_reuniao: "sabado", horario_reuniao: "17:00:00", ativa: true },
    { nome: "Célula Amor de Cristo", endereco: "Rua Esperança, 200 - Parque dos Lagos", dia_reuniao: "quarta", horario_reuniao: "20:30:00", ativa: true },
    { nome: "Célula Família", endereco: "Rua dos Girassóis, 15 - Residencial Sul", dia_reuniao: "domingo", horario_reuniao: "16:00:00", ativa: true },
  ];

  const ids = [];
  for (const c of celulasData) {
    const [id] = await knex("celula").insert(c);
    ids.push(id);
  }

  const vinculos = [
    { id_celula: ids[0], id_usuario: lider1.id_usuario, principal: true },
    { id_celula: ids[1], id_usuario: lider1.id_usuario, principal: true },
    { id_celula: ids[2], id_usuario: lider2.id_usuario, principal: true },
    { id_celula: ids[3], id_usuario: ana.id_usuario, principal: true },
    { id_celula: ids[4], id_usuario: carlos.id_usuario, principal: true },
    { id_celula: ids[5], id_usuario: carlos.id_usuario, principal: true },
    { id_celula: ids[6], id_usuario: ana.id_usuario, principal: true },
    { id_celula: ids[7], id_usuario: lider2.id_usuario, principal: true },
  ];
  if (lider1.id_usuario !== lider2.id_usuario) {
    vinculos.push({ id_celula: ids[0], id_usuario: lider2.id_usuario, principal: false });
  }
  if (lideres.length >= 4) {
    vinculos.push({ id_celula: ids[7], id_usuario: carlos.id_usuario, principal: false });
  }

  await knex("celula_lider").insert(vinculos);

  console.log(`✅ ${celulasData.length} células inseridas com sucesso!`);
}
