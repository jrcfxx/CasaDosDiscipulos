/**
 * Cria (ou redefine) o administrador do sistema sem usar os seeds de demonstração.
 *
 * Uso (no servidor):
 *   docker compose exec -e ADMIN_EMAIL=... -e ADMIN_NOME="..." backend npm run admin:setup
 *   # opcional: desativa todos os outros usuários (reversível: ativo = false)
 *   docker compose exec -e ADMIN_EMAIL=... backend npm run admin:setup -- --desativar-outros
 *
 * Se ADMIN_SENHA não for informada, uma senha aleatória é gerada e exibida uma única vez.
 */
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import knex from "../src/database/index.js";

async function main() {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const nome = String(process.env.ADMIN_NOME || "Administrador").trim();
  const desativarOutros = process.argv.includes("--desativar-outros");

  if (!email || !email.includes("@")) {
    throw new Error("Informe ADMIN_EMAIL (ex.: -e ADMIN_EMAIL=voce@exemplo.com)");
  }

  const senhaInformada = process.env.ADMIN_SENHA;
  if (senhaInformada && senhaInformada.length < 10) {
    throw new Error("ADMIN_SENHA deve ter pelo menos 10 caracteres");
  }
  const senha = senhaInformada || crypto.randomBytes(12).toString("base64url");
  const senhaHash = await bcrypt.hash(senha, 10);

  const existente = await knex("usuario").where({ email }).first();
  let idAdmin;
  if (existente) {
    await knex("usuario").where({ id_usuario: existente.id_usuario }).update({
      nome,
      senha: senhaHash,
      tipo: "administrador",
      ativo: true,
    });
    idAdmin = existente.id_usuario;
    console.log(`Administrador atualizado: ${email}`);
  } else {
    const [id] = await knex("usuario").insert({
      nome,
      email,
      senha: senhaHash,
      tipo: "administrador",
      ativo: true,
    });
    idAdmin = id;
    console.log(`Administrador criado: ${email}`);
  }

  if (desativarOutros) {
    const qtd = await knex("usuario")
      .whereNot({ id_usuario: idAdmin })
      .where({ ativo: true })
      .update({ ativo: false });
    console.log(`${qtd} outro(s) usuário(s) desativado(s) (não foram apagados).`);
  }

  if (!senhaInformada) {
    console.log("\nSenha gerada (anote agora, ela não será exibida de novo):");
    console.log(`  ${senha}\n`);
    console.log("Troque-a no Perfil após o primeiro login.");
  }
}

main()
  .then(() => knex.destroy())
  .catch(async (err) => {
    console.error("Erro:", err.message);
    await knex.destroy();
    process.exit(1);
  });
