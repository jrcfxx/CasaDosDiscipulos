/**
 * Script para testar o envio do lembrete de módulos pendentes via WhatsApp
 * Use: node scripts/testWhatsAppModulos.js
 * Use: node scripts/testWhatsAppModulos.js --debug (para ver diagnóstico)
 *
 * Requer: .env configurado (EVOLUTION_API_URL, etc.) e backend com MySQL acessível
 */

import "dotenv/config";
import knex from "../src/database/index.js";
import ModuloService from "../src/services/ModuloService.js";
import WhatsAppService from "../src/services/WhatsAppService.js";

const DEBUG = process.argv.includes("--debug");

async function diagnostico() {
  const comTelefone = await knex("usuario")
    .where({ ativo: true })
    .whereNotNull("telefone")
    .where("telefone", "!=", "")
    .select("id_usuario", "nome", "telefone", "id_nivel");
  console.log("\n--- Diagnóstico ---");
  console.log("Usuários ativos com telefone:", comTelefone.length);
  comTelefone.forEach((u) => console.log(`  - ${u.nome} (id ${u.id_usuario}) tel: ${u.telefone}`));

  const modulos = await knex("modulo").where({ ativo: true }).select("id_modulo", "titulo", "ordem", "obrigatorio");
  console.log("\nMódulos ativos:", modulos.length);
  modulos.forEach((m) => console.log(`  - ${m.titulo} (ordem ${m.ordem}, obrigatório: ${m.obrigatorio})`));

  console.log("\nUsuário a usuário (pendentes obrigatórios acessíveis):");
  for (const u of comTelefone) {
    const { modulos: mods } = await ModuloService.getActiveWithProgress(u.id_usuario);
    const ativo = (m) => m.ativo !== false && m.ativo !== 0;
    const pendentes = mods.filter(
      (m) =>
        (m.status === "nao_iniciado" || m.status === "em_andamento") &&
        ativo(m) &&
        m.obrigatorio !== false &&
        m.obrigatorio !== 0
    );
    const pendentesAcessiveis = [];
    for (const m of pendentes) {
      const pode = await ModuloService.podeAcessarModulo(m.id_modulo, u.id_usuario);
      if (pode) pendentesAcessiveis.push(m.titulo);
    }
    const emoji = pendentesAcessiveis.length > 0 ? "✓" : " ";
    console.log(`  [${emoji}] ${u.nome} (id ${u.id_usuario}): ${pendentesAcessiveis.length} pendentes`);
    if (pendentesAcessiveis.length > 0) {
      pendentesAcessiveis.forEach((t) => console.log(`      - ${t}`));
    }
  }

  if (comTelefone.length > 0) {
    const u = comTelefone[comTelefone.length - 1];
    console.log(`\n--- Detalhe do último usuário (${u.nome}, id ${u.id_usuario}, id_nivel=${u.id_nivel}) ---`);
    const { modulos: mods } = await ModuloService.getActiveWithProgress(u.id_usuario);
    mods.forEach((m) => {
      console.log(`  Módulo: ${m.titulo} | status=${m.status} | ativo=${m.ativo} | obrigatório=${m.obrigatorio}`);
    });
    const progressos = await knex("usuario_modulo").where("id_usuario", u.id_usuario).select("*");
    console.log(`  Registros em usuario_modulo: ${progressos.length}`);
  }
  console.log("");
}

async function main() {
  if (DEBUG) {
    await diagnostico();
  }

  console.log("Verificando configuração WhatsApp...");
  if (!WhatsAppService.estaConfigurado()) {
    console.error("Erro: WhatsApp não configurado. Defina EVOLUTION_API_URL no .env");
    process.exit(1);
  }

  console.log("Buscando usuários com módulos obrigatórios pendentes...");
  const usuarios = await ModuloService.getUsuariosComModulosPendentes();

  if (usuarios.length === 0) {
    console.log("Nenhum usuário com módulos pendentes e telefone cadastrado.");
    if (!DEBUG) {
      console.log("Dica: rode com --debug para ver diagnóstico: npm run test:whatsapp-modulos -- --debug");
    }
    process.exit(0);
  }

  console.log(`Encontrados ${usuarios.length} usuário(s). Enviando notificações...`);
  for (const u of usuarios) {
    const res = await WhatsAppService.notificarModulosPendentes(
      { nome: u.nome, telefone: u.telefone },
      u.modulos
    );
    console.log(`  ${u.nome} (${u.telefone}): ${res.ok ? "OK" : "Erro: " + res.error}`);
  }
  console.log("Concluído.");
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
