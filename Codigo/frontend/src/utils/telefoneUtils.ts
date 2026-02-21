/**
 * Utilitários para campo de telefone — reduz erros humanos (traços, espaços, etc.)
 */

/** Aceita apenas dígitos no input, máx. 11 (DDD + 9 dígitos no Brasil) */
const TELEFONE_MAX_DIGITOS = 11;

/**
 * Remove caracteres não numéricos e limita a 11 dígitos
 * @param valor Valor digitado (pode ter traços, parênteses, espaços)
 * @returns Apenas dígitos, máximo 11
 */
export function formatarTelefoneInput(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, TELEFONE_MAX_DIGITOS);
  return digitos;
}

/**
 * Formata para exibição (11) 99999-9999
 * @param digitos Apenas dígitos
 */
export function formatarTelefoneExibicao(digitos: string): string {
  if (!digitos) return "";
  const d = digitos.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Normaliza para envio ao backend — apenas dígitos
 * @param valor
 * @returns Dígitos ou string vazia; null se inválido
 */
export function normalizarTelefoneParaEnvio(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  const s = String(valor).trim();
  if (!s) return null;
  const digitos = s.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  return digitos.slice(0, 11);
}
