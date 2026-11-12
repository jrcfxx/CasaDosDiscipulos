/**
 * Fuso único do sistema: horário de Brasília.
 * Importado antes de tudo (app.js / database) para que Dates criados pelo
 * mysql2 e pelo Joi usem o mesmo fuso em dev (Windows) e produção (Docker).
 */
if (!process.env.TZ) {
  process.env.TZ = "America/Sao_Paulo";
}
