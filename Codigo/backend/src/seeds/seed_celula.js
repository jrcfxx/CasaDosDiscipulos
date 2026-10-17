import knex from "../database/index.js";

/**
 * Seed oficial — Células da Casa (GD mãe FLECHA)
 * Imagens em /uploads/celulas/
 */
export async function seed() {
  await knex("celula_lider").del();
  await knex("celula").del();

  const byEmail = async (email) =>
    knex("usuario").where({ email }).first();

  const lideres = {
    iza: await byEmail("iza@casadosdiscipulos.org"),
    simone: await byEmail("simone@casadosdiscipulos.org"),
    luana: await byEmail("luana@casadosdiscipulos.org"),
    kelly: await byEmail("valquiria.kelly@casadosdiscipulos.org"),
    arlem: await byEmail("arlem.cleizer@casadosdiscipulos.org"),
    lorrayne: await byEmail("lorrayne.andrade@casadosdiscipulos.org"),
    anaPaula: await byEmail("ana.paula@casadosdiscipulos.org"),
    liderDemo: await byEmail("lider@test.com"),
  };

  const fallback = lideres.liderDemo || lideres.lorrayne || lideres.iza;
  if (!fallback) {
    console.log("Nenhum líder encontrado. Execute seed_usuario.js primeiro.");
    return;
  }

  const celulasData = [
    {
      nome: "Visão",
      categoria: "Célula de Meninas Jovens e Adolescentes",
      endereco: "Rua Albertino Teixeira Dias, 381 - Diamante",
      dia_reuniao: "terça",
      horario_reuniao: "20:00:00",
      modalidade: "presencial",
      imagem_url: "/uploads/celulas/visao.jpg",
      gd_mae: "FLECHA",
      ativa: true,
      liderEmail: "lorrayne",
    },
    {
      nome: "Pérolas",
      categoria: "Célula de Mulheres",
      endereco: "Rua Dos Americanos, 1383 - Milionários",
      dia_reuniao: "terça",
      horario_reuniao: "20:00:00",
      modalidade: "presencial",
      imagem_url: "/uploads/celulas/perolas.jpg",
      gd_mae: "FLECHA",
      ativa: true,
      liderEmail: "iza",
    },
    {
      nome: "Morada",
      categoria: "Célula de Família",
      endereco: "Rua Tadeu Liberato de Carvalho, 42, apto 5 - Brasil Industrial",
      dia_reuniao: "terça",
      horario_reuniao: "20:00:00",
      modalidade: "presencial",
      imagem_url: "/uploads/celulas/morada.jpg",
      gd_mae: "FLECHA",
      ativa: true,
      liderEmail: "kelly",
    },
    {
      nome: "Resgate",
      categoria: "Célula de Família",
      endereco: "Rua Coronel Thibau, 193 - Araguaia",
      dia_reuniao: "terça",
      horario_reuniao: "20:00:00",
      modalidade: "presencial",
      imagem_url: "/uploads/celulas/resgate.jpg",
      gd_mae: "FLECHA",
      ativa: true,
      liderEmail: "arlem",
    },
    {
      nome: "Reino",
      categoria: "Célula de Jovens",
      endereco: "Online",
      dia_reuniao: "quarta",
      horario_reuniao: "20:30:00",
      modalidade: "online",
      imagem_url: "/uploads/celulas/reino.jpg",
      gd_mae: "FLECHA",
      ativa: true,
      liderEmail: "anaPaula",
    },
    {
      nome: "Videira",
      categoria: "Célula de Família",
      endereco: "Belo Horizonte/MG",
      dia_reuniao: "terça",
      horario_reuniao: "20:00:00",
      modalidade: "presencial",
      imagem_url: "/uploads/celulas/hero-celulas.jpg",
      gd_mae: "FLECHA",
      ativa: true,
      liderEmail: "simone",
    },
    {
      nome: "Farol",
      categoria: "Célula de Família",
      endereco: "Belo Horizonte/MG",
      dia_reuniao: "quarta",
      horario_reuniao: "20:00:00",
      modalidade: "presencial",
      imagem_url: "/uploads/celulas/hero-celulas.jpg",
      gd_mae: "FLECHA",
      ativa: true,
      liderEmail: "luana",
    },
  ];

  for (const c of celulasData) {
    const { liderEmail, ...row } = c;
    const lider = lideres[liderEmail] || fallback;
    const [id] = await knex("celula").insert(row);
    await knex("celula_lider").insert({
      id_celula: id,
      id_usuario: lider.id_usuario,
      principal: true,
    });
  }

  console.log(`✅ ${celulasData.length} células oficiais (GD FLECHA) inseridas!`);
}
