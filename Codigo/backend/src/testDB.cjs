const dotenv = require("dotenv");
dotenv.config();

const knexfile = require("../knexfile.cjs");
const knex = require("knex")(knexfile.development);

knex
  .raw("SELECT 1")
  .then(() => {
    console.log("Conexão com o banco de dados bem-sucedida!");
    return knex.destroy();
  })
  .catch((err) => {
    console.error("Erro de conexão com o banco de dados:");
    console.error(err);
    process.exit(1);
  });
