import knex from "../database/index.js";

/**
 * Seed para campos de lição
 * Define o conteúdo das lições usando campos dinâmicos
 */
export async function seed() {
  await knex("licao_campo").del();

  // Buscar IDs dos campos
  const campoTexto = await knex("campo_personalizado")
    .where({ tipo_campo: "texto" })
    .first();
  const campoLink = await knex("campo_personalizado")
    .where({ tipo_campo: "link" })
    .first();

  const licoes = await knex("licao").select("id_licao").orderBy("id_licao");

  if (!campoTexto || !campoLink || licoes.length === 0) {
    console.log(
      "Execute seed_campo_personalizado.js e seed_licao.js primeiro."
    );
    return;
  }

  const campos = [];

  // LIÇÃO 1: Fundamentos da Caminhada Cristã
  if (licoes[0]) {
    campos.push(
      {
        id_licao: licoes[0].id_licao,
        id_campo: campoTexto.id_campo,
        label: "Introdução",
        conteudo:
          "Nesta lição, vamos aprender os fundamentos da caminhada cristã e como desenvolver uma vida de fé sólida.",
        ordem: 1,
      },
      {
        id_licao: licoes[0].id_licao,
        id_campo: campoLink.id_campo,
        label: "Vídeo introdutório",
        conteudo: "https://youtube.com/fundamentos-da-fe",
        ordem: 2,
      },
      {
        id_licao: licoes[0].id_licao,
        id_campo: campoTexto.id_campo,
        label: "Reflexão final",
        conteudo:
          "Como você pode aplicar estes fundamentos em sua vida diária?",
        ordem: 3,
      }
    );
  }

  // LIÇÃO 2: A Vida de Oração
  if (licoes[1]) {
    campos.push(
      {
        id_licao: licoes[1].id_licao,
        id_campo: campoTexto.id_campo,
        label: "O que é oração?",
        conteudo:
          "A oração é uma conversa íntima com Deus, onde compartilhamos nossos pensamentos, gratidão e pedidos.",
        ordem: 1,
      },
      {
        id_licao: licoes[1].id_licao,
        id_campo: campoTexto.id_campo,
        label: "Pergunta reflexiva",
        conteudo:
          "Como você tem buscado se comunicar com Deus em seu dia a dia?",
        ordem: 2,
      },
      {
        id_licao: licoes[1].id_licao,
        id_campo: campoLink.id_campo,
        label: "Testemunhos sobre oração",
        conteudo: "https://exemplo.com/testemunhos-oracao",
        ordem: 3,
      }
    );
  }

  // LIÇÃO 3: Vivendo em Comunidade
  if (licoes[2]) {
    campos.push(
      {
        id_licao: licoes[2].id_licao,
        id_campo: campoTexto.id_campo,
        label: "A importância da comunidade",
        conteudo:
          "Viver em comunidade é essencial para o crescimento espiritual. Ninguém cresce sozinho na fé.",
        ordem: 1,
      },
      {
        id_licao: licoes[2].id_licao,
        id_campo: campoLink.id_campo,
        label: "Artigo recomendado",
        conteudo: "https://exemplo.com/comunidade-crista",
        ordem: 2,
      }
    );
  }

  await knex("licao_campo").insert(campos);

  console.log("✅ Campos de lição inseridos com sucesso!");
}
