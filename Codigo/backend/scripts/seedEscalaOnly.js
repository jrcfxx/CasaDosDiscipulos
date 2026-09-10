/**
 * Reinsere apenas dados de Escala (não limpa usuários/ministérios).
 * Uso: node scripts/seedEscalaOnly.js
 */
import { seed } from "../src/seeds/seed_escala.js";

seed()
  .then(() => {
    console.log("\n✅ Seed de Escala concluído.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nErro no seed de Escala:", err);
    process.exit(1);
  });
