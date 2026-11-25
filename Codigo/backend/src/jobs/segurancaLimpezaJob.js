import cron from "node-cron";
import knex from "../database/index.js";

/**
 * Guarda o registro de segurança por 180 dias e as sessões encerradas/vencidas por 30 dias.
 * Depois disso apaga (LGPD: não manter IP e aparelho de ninguém sem necessidade).
 */
export const RETENCAO = Object.freeze({ registroDias: 180, sessoesDias: 30 });

export async function limparRegistrosAntigos() {
  const registros = await knex("log_seguranca")
    .where("criado_em", "<", knex.raw("NOW() - INTERVAL ? DAY", [RETENCAO.registroDias]))
    .del();
  const sessoes = await knex("sessao")
    .where((q) =>
      q.where("expira_em", "<", knex.raw("NOW() - INTERVAL ? DAY", [RETENCAO.sessoesDias]))
        .orWhere("revogada_em", "<", knex.raw("NOW() - INTERVAL ? DAY", [RETENCAO.sessoesDias]))
    )
    .del();
  return { registros, sessoes };
}

export function iniciarJobLimpezaSeguranca() {
  const executar = () =>
    limparRegistrosAntigos()
      .then(({ registros, sessoes }) => {
        if (registros || sessoes) console.log(`[Job] Limpeza de segurança: ${registros} registro(s), ${sessoes} sessão(ões)`);
      })
      .catch((err) => console.error("[Job limpeza segurança] Erro:", err?.message || err));

  executar();
  cron.schedule("15 3 * * *", executar, { timezone: "America/Sao_Paulo" });
}
