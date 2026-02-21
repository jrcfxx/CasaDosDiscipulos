/**
 * Sincroniza escala_area: atualiza "Infantil" para "Casa Kids"
 * quando o ministério foi renomeado via GerirUser
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  const updated = await knex("escala_area").where("nome", "Infantil").update({ nome: "Casa Kids" });
  if (updated > 0) {
    console.log(`[Migration 014] Atualizadas ${updated} área(s) da escala: Infantil -> Casa Kids`);
  }
};

exports.down = async () => {
  // Não revertido: não é possível distinguir áreas que eram "Infantil" das criadas como "Casa Kids"
};
