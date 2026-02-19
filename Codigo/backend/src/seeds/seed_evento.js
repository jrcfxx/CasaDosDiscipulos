import knex from "../database/index.js";

/**
 * Seed para eventos da igreja
 * Eventos exibidos no portal
 */
export async function seed() {
  await knex("evento").del();

  const imgPlaceholder = "https://placehold.co/600x400/02869b/ffffff?text=Evento";

  await knex("evento").insert([
    {
      titulo: "Culto de Celebração",
      descricao: "Culto dominical de celebração e louvor",
      imagem_url: imgPlaceholder,
      ordem: 1,
      ativo: true,
    },
    {
      titulo: "Conferência de Jovens",
      descricao: "Encontro especial para jovens com palestras e workshops",
      imagem_url: imgPlaceholder,
      ordem: 2,
      ativo: true,
    },
    {
      titulo: "Retiro Espiritual",
      descricao: "Fim de semana de retiro para crescimento espiritual",
      imagem_url: imgPlaceholder,
      ordem: 3,
      ativo: true,
    },
    {
      titulo: "Ação Social",
      descricao: "Dia de ação solidária na comunidade",
      imagem_url: imgPlaceholder,
      ordem: 4,
      ativo: true,
    },
  ]);

  console.log("✅ Eventos inseridos com sucesso!");
}
