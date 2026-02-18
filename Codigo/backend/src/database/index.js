import dotenv from "dotenv";
import knexLib from "knex";
import { createRequire } from "node:module";

dotenv.config();

const require = createRequire(import.meta.url);
const knexConfig = require("../../knexfile.cjs");

const environment = process.env.NODE_ENV || "development";
const config = knexConfig[environment];

const knex = knexLib(config);

export default knex;
