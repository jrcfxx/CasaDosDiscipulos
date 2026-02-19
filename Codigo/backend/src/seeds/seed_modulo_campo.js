import knex from "../database/index.js";

/**
 * Seed para campos de módulo
 * Define o conteúdo dos módulos usando campos dinâmicos
 */
export async function seed() {
  await knex("modulo_campo").del();

  const campoTexto = await knex("campo_personalizado").where({ tipo_campo: "texto" }).first();
  const campoLink = await knex("campo_personalizado").where({ tipo_campo: "link" }).first();
  const campoUpload = await knex("campo_personalizado").where({ tipo_campo: "upload" }).first();
  const campoVideo = await knex("campo_personalizado").where({ tipo_campo: "video" }).first();
  const campoTextarea = await knex("campo_personalizado").where({ tipo_campo: "textarea" }).first();

  const modulos = await knex("modulo").select("id_modulo", "titulo").orderBy("ordem");

  if (!campoTexto || modulos.length === 0) {
    console.log("Execute seed_modulo.js e seed_campo_personalizado.js primeiro.");
    return;
  }

  const T = campoTexto?.id_campo;
  const L = campoLink?.id_campo;
  const U = campoUpload?.id_campo;
  const V = campoVideo?.id_campo;
  const TA = campoTextarea?.id_campo;

  const conteudos = [
    // Módulo 1 - Fundamentos da Fé
    [
      { id_campo: T, label: "Introdução", conteudo: "Bem-vindo! Aqui você aprenderá os fundamentos da fé cristã: salvação, graça, arrependimento e o plano de Deus.", ordem: 1 },
      { id_campo: L, label: "Vídeo de apresentação", conteudo: "https://youtube.com/watch?v=fundamentos-fe", ordem: 2 },
      { id_campo: T, label: "O que é a fé?", conteudo: "A fé é a certeza daquilo que esperamos e a prova daquilo que não vemos (Hb 11:1).", ordem: 3 },
    ],
    // Módulo 2 - Discipulado
    [
      { id_campo: T, label: "Conteúdo principal", conteudo: "O discipulado é seguir a Cristo diariamente, negando a si mesmo e carregando a cruz.", ordem: 1 },
      { id_campo: U, label: "Material de apoio", conteudo: "/uploads/discipulado-apostila.pdf", ordem: 2 },
      { id_campo: T, label: "Reflexão", conteudo: "Como você tem vivido como discípulo no seu dia a dia?", ordem: 3 },
    ],
    // Módulo 3 - Liderança Cristã
    [
      { id_campo: T, label: "Introdução à liderança", conteudo: "Jesus demonstrou que o líder serve. Liderança cristã é serviço.", ordem: 1 },
      { id_campo: V, label: "Vídeo: perfil do líder", conteudo: "https://youtube.com/watch?v=lideranca-crista", ordem: 2 },
      { id_campo: TA, label: "Exercício", conteudo: "Liste 3 qualidades de um líder que você admira.", ordem: 3 },
    ],
    // Módulo 4 - Vida de Oração
    [
      { id_campo: T, label: "O que é oração?", conteudo: "A oração é conversa íntima com Deus. Ele nos convida a falar com Ele em todo tempo.", ordem: 1 },
      { id_campo: L, label: "Testemunhos", conteudo: "https://exemplo.com/testemunhos-oracao", ordem: 2 },
    ],
    // Módulo 5 - Estudo Bíblico
    [
      { id_campo: T, label: "Como interpretar a Bíblia", conteudo: "Contexto, cultura, propósito do autor e harmonia com outras passagens.", ordem: 1 },
      { id_campo: U, label: "Guia de estudo", conteudo: "/uploads/estudo-biblico.pdf", ordem: 2 },
    ],
    // Módulo 6 - Ministério e Serviço
    [
      { id_campo: T, label: "Dons espirituais", conteudo: "Cada um recebeu um dom para servir à igreja e edificar o corpo de Cristo.", ordem: 1 },
      { id_campo: T, label: "Descobrindo seu lugar", conteudo: "Ore, busque aconselhamento e experimente diferentes ministérios.", ordem: 2 },
    ],
    // Módulo 7 - Evangelismo
    [
      { id_campo: T, label: "A grande comissão", conteudo: "Ide e fazei discípulos de todas as nações (Mt 28:19).", ordem: 1 },
      { id_campo: V, label: "Evangelismo prático", conteudo: "https://youtube.com/watch?v=evangelismo-pratico", ordem: 2 },
    ],
    // Módulo 8 - Viver em Comunidade
    [
      { id_campo: T, label: "A importância da comunidade", conteudo: "Ninguém cresce sozinho. A igreja e as células são essenciais.", ordem: 1 },
      { id_campo: L, label: "Artigo", conteudo: "https://exemplo.com/comunidade-crista", ordem: 2 },
    ],
  ];

  const inserts = [];
  modulos.forEach((mod, idx) => {
    const c = conteudos[idx] ?? conteudos[0];
    c.forEach((item) => {
      if (item.id_campo) {
        inserts.push({
          id_modulo: mod.id_modulo,
          id_campo: item.id_campo,
          label: item.label,
          conteudo: item.conteudo,
          ordem: item.ordem,
        });
      }
    });
  });

  await knex("modulo_campo").insert(inserts);
  console.log(`✅ ${inserts.length} campos de módulo inseridos com sucesso!`);
}
