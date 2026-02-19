import knex from "../database/index.js";

/**
 * Seed para lições educacionais
 * Lições são conteúdos para estudo das células
 */
export async function seed() {
  await knex("licao").del();

  await knex("licao").insert([
    { titulo: "Fundamentos da Caminhada Cristã", descricao: "Primeira lição sobre os fundamentos da fé", ativo: true },
    { titulo: "A Vida de Oração", descricao: "Como desenvolver uma vida de oração consistente", ativo: true },
    { titulo: "Vivendo em Comunidade", descricao: "A importância da igreja e das células", ativo: true },
    { titulo: "Fruto do Espírito", descricao: "As virtudes que o Espírito produz em nós", ativo: true },
    { titulo: "Fé e Obras", descricao: "A relação entre fé e prática na vida cristã", ativo: true },
    { titulo: "Discernimento Espiritual", descricao: "Como distinguir a voz de Deus", ativo: true },
    { titulo: "Lidando com as Provas", descricao: "Perseverança e esperança nos tempos difíceis", ativo: true },
    { titulo: "Missão e Evangelismo", descricao: "Compartilhando o Evangelho na prática", ativo: true },
  ]);

  console.log("✅ 8 lições inseridas com sucesso!");
}
