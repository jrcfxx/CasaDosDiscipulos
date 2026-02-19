/**
 * Reseta o banco: DROP + CREATE + migrate
 * Uso local apenas. Execute: npm run db:reset
 */
require("dotenv").config();
const knex = require("knex");

const dbName = process.env.DB_NAME || "CasaDosDiscipulos";

const config = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  },
};

async function main() {
  const conn = knex(config);
  try {
    await conn.raw(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await conn.raw(`CREATE DATABASE \`${dbName}\``);
    console.log("Banco recriado.");
  } finally {
    await conn.destroy();
  }

  const { execSync } = require("child_process");
  execSync("npx knex --knexfile knexfile.cjs migrate:latest", {
    stdio: "inherit",
    cwd: require("path").join(__dirname, ".."),
  });
  console.log("✅ Pronto. Execute 'npm run seed' para popular.");
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
