import bcrypt from "bcrypt";
import knex from "../database/index.js";

/**
 * Seed para usuários iniciais do sistema
 * Cria admin, líderes e membros para testes
 * Depende de: seed_nivel (id_nivel)
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

  const nivelLider = await knex("nivel").where({ nome: "Líder" }).first();
  const nivelDiscipulo = await knex("nivel").where({ nome: "Discípulo" }).first();
  const nivelIniciante = await knex("nivel").where({ nome: "Iniciante" }).first();

  const senhaHash = await bcrypt.hash("123456", 10);

  await knex("usuario").insert([
    {
      nome: "Admin Teste",
      email: "admin@test.com",
      senha: senhaHash,
      tipo: "administrador",
      pontuacao: 0,
      ativo: true,
      id_nivel: nivelLider?.id_nivel ?? null,
    },
    {
      nome: "Líder Teste",
      email: "lider@test.com",
      senha: senhaHash,
      tipo: "lider",
      pontuacao: 0,
      ativo: true,
      id_nivel: nivelLider?.id_nivel ?? null,
    },
    {
      nome: "Líder Silva",
      email: "lider2@test.com",
      senha: senhaHash,
      tipo: "lider",
      pontuacao: 50,
      ativo: true,
      id_nivel: nivelDiscipulo?.id_nivel ?? null,
    },
    {
      nome: "Membro Teste",
      email: "membro@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 0,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Maria Santos",
      email: "maria@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 30,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
  ]);

  console.log("✅ Usuários inseridos com sucesso!");
}
