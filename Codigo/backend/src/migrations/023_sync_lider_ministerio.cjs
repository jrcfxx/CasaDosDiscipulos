/**
 * Realinha usuario.lider_ministerio com a tabela ministerio_lider (fonte da verdade).
 * Antes, a flag podia ser editada direto e divergir dos ministérios realmente liderados.
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.raw(`
    UPDATE usuario u
    SET u.lider_ministerio = EXISTS (
      SELECT 1 FROM ministerio_lider ml WHERE ml.id_usuario = u.id_usuario
    )
  `);
};

exports.down = async () => {
  // Sem volta: a flag anterior não é recuperável e a nova é derivada dos dados reais
};
