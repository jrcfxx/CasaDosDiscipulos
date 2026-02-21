/**
 * Sincroniza escala_area: atualiza "Recepção" para "Voluntários"
 * quando o ministério foi renomeado via GerirUser
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  const updated = await knex("escala_area").where("nome", "Recepção").update({ nome: "Voluntários" });
  if (updated > 0) {
    console.log(`[Migration 016] Atualizadas ${updated} área(s) da escala: Recepção -> Voluntários`);
  }
};

exports.down = async () => {
  // Não revertido
};
