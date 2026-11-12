require("dotenv").config();

const shared = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  },
  migrations: {
    directory: "./src/migrations",
  },
  seeds: {
    directory: "./src/seeds",
  },
  pool: {
    min: 2,
    max: 10,
    // Sessão MySQL no horário de Brasília (sem horário de verão desde 2019):
    // NOW() e colunas TIMESTAMP ficam coerentes com o TZ do processo Node.
    afterCreate(conn, done) {
      conn.query("SET time_zone = '-03:00'", (err) => done(err, conn));
    },
  },
};

module.exports = {
  development: shared,
  production: shared,
};
