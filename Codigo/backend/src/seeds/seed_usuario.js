import bcrypt from "bcrypt";
import knex from "../database/index.js";

/**
 * Seed para usuários iniciais do sistema
 * Cria 1 admin, 1 líder e 1 membro para testes
 */
export async function seed() {
  // Remove em ordem reversa de dependências (FK)
  await knex("formulario_resposta_campo").del();
  await knex("formulario_resposta").del();
  await knex("quiz_resposta").del();
  await knex("usuario_modulo").del();
  await knex("usuario_celula").del();
  await knex("celula").del();
  await knex("usuario").del();

  const senhaHash = await bcrypt.hash("123456", 10);

  await knex("usuario").insert([
    {
      nome: "Admin Teste",
      email: "admin@test.com",
      senha: senhaHash,
      tipo: "administrador",
      pontuacao: 0,
      ativo: true,
    },
    {
      nome: "Líder Teste",
      email: "lider@test.com",
      senha: senhaHash,
      tipo: "lider",
      pontuacao: 0,
      ativo: true,
    },
    {
      nome: "Membro Teste",
      email: "membro@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 0,
      ativo: true,
    },
  ]);

  console.log("✅ Usuários inseridos com sucesso!");
}
