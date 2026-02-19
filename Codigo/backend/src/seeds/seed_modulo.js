import knex from "../database/index.js";

/**
 * Seed para módulos de treinamento
 * Cada módulo contém conteúdo educacional + quiz avaliativo
 * Depende de: seed_nivel (id_nivel)
 */
export async function seed() {
  await knex("modulo_pre_requisito").del();
  await knex("modulo_campo").del();
  await knex("modulo_quiz").del();
  await knex("modulo").del();

  const niveis = await knex("nivel").select("id_nivel", "ordem").orderBy("ordem");
  const getNivel = (ordem) => niveis.find((n) => n.ordem === ordem)?.id_nivel ?? null;

  await knex("modulo").insert([
    { titulo: "Fundamentos da Fé", descricao: "Aprenda os conceitos básicos da fé cristã", ordem: 1, ativo: true, id_nivel: getNivel(1) },
    { titulo: "Discipulado", descricao: "O caminho do discipulado cristão", ordem: 2, ativo: true, id_nivel: getNivel(2) },
    { titulo: "Liderança Cristã", descricao: "Princípios de liderança segundo a Bíblia", ordem: 3, ativo: true, id_nivel: getNivel(3) },
    { titulo: "Vida de Oração", descricao: "Desenvolvendo uma vida de intimidade com Deus", ordem: 4, ativo: true, id_nivel: getNivel(1) },
    { titulo: "Estudo Bíblico", descricao: "Como estudar e interpretar a Bíblia", ordem: 5, ativo: true, id_nivel: getNivel(2) },
    { titulo: "Ministério e Serviço", descricao: "Descobrindo e exercendo seus dons", ordem: 6, ativo: true, id_nivel: getNivel(2) },
    { titulo: "Evangelismo", descricao: "Compartilhando o Evangelho com outros", ordem: 7, ativo: true, id_nivel: getNivel(3) },
    { titulo: "Viver em Comunidade", descricao: "A importância da igreja e das células", ordem: 8, ativo: true, id_nivel: getNivel(2) },
  ]);

  const modulos = await knex("modulo").select("id_modulo", "ordem").orderBy("ordem");
  const preReqs = [
    { mod: 2, req: 1 },
    { mod: 3, req: 2 },
    { mod: 5, req: 1 },
    { mod: 6, req: 2 },
    { mod: 7, req: 3 },
    { mod: 8, req: 1 },
  ];
  for (const { mod, req } of preReqs) {
    const mMod = modulos.find((m) => m.ordem === mod);
    const mReq = modulos.find((m) => m.ordem === req);
    if (mMod && mReq) {
      await knex("modulo_pre_requisito").insert({
        id_modulo: mMod.id_modulo,
        id_modulo_requerido: mReq.id_modulo,
      });
    }
  }

  console.log(`✅ ${modulos.length} módulos inseridos com sucesso!`);
}
