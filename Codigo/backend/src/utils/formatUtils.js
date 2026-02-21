/**
 * Utilitários para normalização de dados e redução de erros humanos
 */

/**
 * Normaliza telefone para armazenamento (apenas dígitos, válido para WhatsApp)
 * Aceita: (11) 99999-9999, 11 999999999, 31993200734, etc.
 * @param {string} telefone
 * @returns {string|null} Apenas dígitos (10-11 para BR) ou null se inválido/vazio
 */
function normalizarTelefone(telefone) {
  if (telefone == null) return null;
  const s = String(telefone).trim();
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return null;
  return digits;
}

export { normalizarTelefone };
