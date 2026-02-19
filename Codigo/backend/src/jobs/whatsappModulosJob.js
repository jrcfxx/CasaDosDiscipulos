/**
 * Job semanal: notifica usuários com módulos pendentes no WhatsApp
 * Executa toda segunda-feira às 9h (configurável via cron)
 */

import cron from "node-cron";
import ModuloService from "../services/ModuloService.js";
import WhatsAppService from "../services/WhatsAppService.js";

const CRON_SEMANAL = process.env.WHATSAPP_CRON_MODULOS || "0 9 * * 1"; // Segunda 9h

function executarNotificacaoModulos() {
  if (!WhatsAppService.estaConfigurado()) {
    return;
  }
  ModuloService.getUsuariosComModulosPendentes()
    .then((usuarios) => {
      if (usuarios.length === 0) return;
      return Promise.all(
        usuarios.map((u) =>
          WhatsAppService.notificarModulosPendentes(
            { nome: u.nome, telefone: u.telefone },
            u.modulos
          )
        )
      );
    })
    .then(() => {
      // Sucesso silencioso
    })
    .catch((err) => {
      console.error("[Job WhatsApp Módulos] Erro:", err?.message || err);
    });
}

/**
 * Inicia o agendamento do job
 */
export function iniciarJobModulosWhatsApp() {
  cron.schedule(CRON_SEMANAL, executarNotificacaoModulos, {
    timezone: "America/Sao_Paulo",
  });
  console.log(`[Job] Notificação WhatsApp módulos agendada: ${CRON_SEMANAL} (America/Sao_Paulo)`);
}

/**
 * Executa manualmente (útil para testes)
 */
export function executarAgora() {
  executarNotificacaoModulos();
}
