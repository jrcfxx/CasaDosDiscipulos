import cron from "node-cron";
import knex from "../database/index.js";

/**
 * Marca como "concluída" a escala publicada cujo evento já terminou
 * (fim informado, ou 2 h após o início quando não há fim). Rascunhos não são tocados.
 * A sessão MySQL está em -03:00, então NOW() é o horário de Brasília.
 * @returns {Promise<number>} quantidade de eventos concluídos
 */
export async function concluirEventosPassados() {
  return knex("escala_evento")
    .where("status", "publicada")
    .whereRaw("COALESCE(data_hora_fim, DATE_ADD(data_hora, INTERVAL 2 HOUR)) < NOW()")
    .update({ status: "concluida", data_atualizacao: knex.fn.now() });
}

export function iniciarJobConcluirEscalas() {
  const executar = () =>
    concluirEventosPassados()
      .then((n) => {
        if (n > 0) console.log(`[Job] ${n} escala(s) marcada(s) como concluída(s)`);
      })
      .catch((err) => console.error("[Job concluir escalas] Erro:", err?.message || err));

  executar(); // ao subir, acerta o que passou enquanto o servidor estava fora
  cron.schedule("*/30 * * * *", executar, { timezone: "America/Sao_Paulo" });
}
