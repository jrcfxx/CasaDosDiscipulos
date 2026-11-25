/**
 * Confere as variáveis de ambiente obrigatórias antes de o servidor subir.
 * Melhor falhar na inicialização com uma mensagem clara do que quebrar no primeiro login.
 */
export function verificarAmbiente() {
  const producao = process.env.NODE_ENV === "production";
  const faltando = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME"].filter((v) => !process.env[v]);
  if (faltando.length) {
    throw new Error(`Variáveis de ambiente ausentes: ${faltando.join(", ")}`);
  }
  if (producao && process.env.JWT_SECRET.length < 32) {
    // Não derruba o servidor (evita queda num deploy), mas avisa em todo start
    console.warn(
      "[seguranca] JWT_SECRET tem menos de 32 caracteres. Gere outro com: openssl rand -base64 48 " +
        "(trocar o segredo encerra todas as sessões)."
    );
  }
  if (producao && !process.env.CHAVE_CRIPTOGRAFIA) {
    console.warn(
      "[seguranca] CHAVE_CRIPTOGRAFIA não definida: o segredo do 2FA está sendo protegido com uma chave derivada do JWT_SECRET. " +
        "Defina CHAVE_CRIPTOGRAFIA (openssl rand -base64 48) antes de alguém ativar o 2FA."
    );
  }
}
