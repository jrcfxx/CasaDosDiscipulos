import bcrypt from "bcrypt";
import knex from "../database/index.js";

/**
 * Seed para usuários iniciais do sistema
 * Popula o banco com admin, líderes e membros para testes completos
 * Depende de: seed_nivel (id_nivel)
 */
export async function seed() {
  const nivelLider = await knex("nivel").where({ nome: "Líder" }).first();
  const nivelDiscipulo = await knex("nivel").where({ nome: "Discípulo" }).first();
  const nivelDiscipuloAvancado = await knex("nivel").where({ nome: "Discípulo Avançado" }).first();
  const nivelIniciante = await knex("nivel").where({ nome: "Iniciante" }).first();
  const nivelLiderFormacao = await knex("nivel").where({ nome: "Líder em Formação" }).first();

  const senhaHash = await bcrypt.hash("123456", 10);

  const usuarios = [
    // Admin
    {
      nome: "Admin Teste",
      email: "admin@test.com",
      senha: senhaHash,
      tipo: "administrador",
      pontuacao: 100,
      ativo: true,
      id_nivel: nivelLider?.id_nivel ?? null,
    },
    // Líderes
    {
      nome: "Líder Teste",
      email: "lider@test.com",
      senha: senhaHash,
      tipo: "lider",
      pontuacao: 90,
      ativo: true,
      id_nivel: nivelLider?.id_nivel ?? null,
      lider_celula: true,
      lider_ministerio: false,
    },
    {
      nome: "Líder Silva",
      email: "lider2@test.com",
      senha: senhaHash,
      tipo: "lider",
      pontuacao: 85,
      ativo: true,
      id_nivel: nivelDiscipulo?.id_nivel ?? null,
      lider_celula: true,
      lider_ministerio: true,
    },
    {
      nome: "Ana Oliveira",
      email: "ana.lider@test.com",
      senha: senhaHash,
      tipo: "lider",
      pontuacao: 78,
      ativo: true,
      id_nivel: nivelDiscipuloAvancado?.id_nivel ?? null,
      lider_celula: true,
      lider_ministerio: true,
    },
    {
      nome: "Carlos Mendes",
      email: "carlos.lider@test.com",
      senha: senhaHash,
      tipo: "lider",
      pontuacao: 65,
      ativo: true,
      id_nivel: nivelLiderFormacao?.id_nivel ?? null,
      lider_celula: true,
      lider_ministerio: false,
    },
    // Membros - variedade para testes
    {
      nome: "Membro Teste",
      email: "membro@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 45,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Maria Santos",
      email: "maria@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 60,
      ativo: true,
      id_nivel: nivelDiscipulo?.id_nivel ?? null,
    },
    {
      nome: "João Pereira",
      email: "joao@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 35,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Fernanda Costa",
      email: "fernanda@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 72,
      ativo: true,
      id_nivel: nivelDiscipuloAvancado?.id_nivel ?? null,
    },
    {
      nome: "Pedro Almeida",
      email: "pedro@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 28,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Juliana Ribeiro",
      email: "juliana@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 55,
      ativo: true,
      id_nivel: nivelDiscipulo?.id_nivel ?? null,
    },
    {
      nome: "Roberto Lima",
      email: "roberto@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 18,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Amanda Ferreira",
      email: "amanda@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 82,
      ativo: true,
      id_nivel: nivelLiderFormacao?.id_nivel ?? null,
    },
    {
      nome: "Lucas Souza",
      email: "lucas@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 40,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Beatriz Rodrigues",
      email: "beatriz@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 50,
      ativo: true,
      id_nivel: nivelDiscipulo?.id_nivel ?? null,
    },
    {
      nome: "Gabriel Martins",
      email: "gabriel@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 12,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Carla Nascimento",
      email: "carla@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 68,
      ativo: true,
      id_nivel: nivelDiscipulo?.id_nivel ?? null,
    },
    {
      nome: "Bruno Carvalho",
      email: "bruno@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 22,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Patricia Gomes",
      email: "patricia@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 95,
      ativo: true,
      id_nivel: nivelLider?.id_nivel ?? null,
    },
    {
      nome: "Ricardo Teixeira",
      email: "ricardo@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 38,
      ativo: true,
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
    {
      nome: "Sandra Barbosa",
      email: "sandra@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 58,
      ativo: true,
      id_nivel: nivelDiscipulo?.id_nivel ?? null,
    },
    {
      nome: "Marcos Dias",
      email: "marcos@test.com",
      senha: senhaHash,
      tipo: "membro",
      pontuacao: 0,
      ativo: false, // inativo para teste
      id_nivel: nivelIniciante?.id_nivel ?? null,
    },
  ];

  await knex("usuario").del();

  for (const u of usuarios) {
    const { lider_celula, lider_ministerio, ...rest } = u;
    await knex("usuario").insert({
      ...rest,
      lider_celula: lider_celula ?? false,
      lider_ministerio: lider_ministerio ?? false,
    });
  }

  console.log(`✅ ${usuarios.length} usuários inseridos com sucesso!`);
}
