/**
 * Segurança de senha e sessão.
 *  - trocar_senha: a pessoa precisa criar a própria senha antes de usar o sistema
 *    (senha inicial = telefone, ou senha definida/redefinida pelo admin).
 *  - sessao_versao: vai no token; trocar ou redefinir a senha incrementa e derruba as sessões antigas.
 *
 * Marca trocar_senha = true para quem nunca entrou ou cuja senha ainda é o próprio telefone.
 * @param { import("knex").Knex } knex
 */
const bcrypt = require("bcrypt");

exports.up = async (knex) => {
  await knex.schema.alterTable("usuario", (table) => {
    table.boolean("trocar_senha").notNullable().defaultTo(false).comment("Obriga criar senha própria no próximo acesso");
    table.integer("sessao_versao").unsigned().notNullable().defaultTo(0).comment("Incrementa para invalidar tokens antigos");
  });

  const usuarios = await knex("usuario").select("id_usuario", "senha", "telefone", "ultimo_login");
  const marcar = [];
  for (const u of usuarios) {
    if (!u.ultimo_login) {
      marcar.push(u.id_usuario);
      continue;
    }
    const digitos = String(u.telefone || "").replace(/\D/g, "");
    if (digitos && u.senha && (await bcrypt.compare(digitos, u.senha))) marcar.push(u.id_usuario);
  }
  if (marcar.length) await knex("usuario").whereIn("id_usuario", marcar).update({ trocar_senha: true });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("usuario", (table) => {
    table.dropColumn("trocar_senha");
    table.dropColumn("sessao_versao");
  });
};
