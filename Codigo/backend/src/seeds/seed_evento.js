import knex from "../database/index.js";

/**
 * Seed para eventos da igreja (portal)
 * Eventos exibidos na página inicial
 */
export async function seed() {
  await knex("evento").del();

  const imgPlaceholder = "https://placehold.co/600x400/02869b/ffffff?text=Evento";

  await knex("evento").insert([
    { titulo: "Culto de Celebração", descricao: "Culto dominical de celebração e louvor", imagem_url: imgPlaceholder, ordem: 1, ativo: true },
    { titulo: "Conferência de Jovens", descricao: "Encontro especial para jovens com palestras e workshops", imagem_url: imgPlaceholder, ordem: 2, ativo: true },
    { titulo: "Retiro Espiritual", descricao: "Fim de semana de retiro para crescimento espiritual", imagem_url: imgPlaceholder, ordem: 3, ativo: true },
    { titulo: "Ação Social", descricao: "Dia de ação solidária na comunidade", imagem_url: imgPlaceholder, ordem: 4, ativo: true },
    { titulo: "Encontro de Casais", descricao: "Encontro especial para fortalecimento do casamento", imagem_url: imgPlaceholder, ordem: 5, ativo: true },
    { titulo: "Culto de Oração", descricao: "Noite especial de oração e intercessão", imagem_url: imgPlaceholder, ordem: 6, ativo: true },
    { titulo: "Festa das Células", descricao: "Integração e celebração entre todas as células", imagem_url: imgPlaceholder, ordem: 7, ativo: true },
    { titulo: "Batismo", descricao: "Cerimônia de batismo nas águas", imagem_url: imgPlaceholder, ordem: 8, ativo: true },
    { titulo: "Vigília de Ano Novo", descricao: "Vigília de oração para o ano novo", imagem_url: imgPlaceholder, ordem: 9, ativo: true },
    { titulo: "Escola Bíblica", descricao: "Curso de estudos bíblicos para novos membros", imagem_url: imgPlaceholder, ordem: 10, ativo: true },
    { titulo: "Conferência Missionária", descricao: "Encontro com missionários e visão transcultural", imagem_url: imgPlaceholder, ordem: 11, ativo: true },
    { titulo: "Ceia de Natal", descricao: "Celebração de Natal em família", imagem_url: imgPlaceholder, ordem: 12, ativo: true },
  ]);

  console.log("✅ Eventos inseridos com sucesso!");
}
