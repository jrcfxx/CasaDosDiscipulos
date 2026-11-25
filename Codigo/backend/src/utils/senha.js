import crypto from "node:crypto";

export const SENHA_MINIMO = 8;

/**
 * Senhas que aparecem no topo dos vazamentos (e as óbvias para uma igreja).
 * Comparadas sem acento, maiúsculas, espaços e números no fim ("Jesus123" = "jesus").
 */
const SENHAS_COMUNS = new Set([
  "senha", "password", "qwerty", "qwertyuiop", "asdfghjkl", "abc", "abcdef", "abcdefgh", "iloveyou", "admin",
  "administrador", "mudar", "trocar", "teste", "brasil", "flamengo", "corinthians", "palmeiras", "saopaulo",
  "vasco", "cruzeiro", "gremio", "internacional", "amor", "meuamor", "familia", "felicidade", "princesa",
  "jesus", "jesuscristo", "jesusteama", "jesusmeama", "jesuseamor", "deus", "deuseamor", "deusefiel", "deusefieldemais",
  "deusmeama", "senhor", "senhorjesus", "gloria", "gloriaadeus", "aleluia", "amem", "igreja", "biblia",
  "cristo", "cristao", "espiritosanto", "fe", "esperanca", "graca", "salmos", "salmo",
  "casadosdiscipulos", "casadiscipulos", "discipulo", "discipulos", "celula", "escoladediscipulos",
]);

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/\d+$/, "");
}

/**
 * Regra única para senhas escolhidas pela própria pessoa.
 * @param {string} senha
 * @param {{ telefone?: string|null, email?: string|null }} [dados] - dados da pessoa, que não podem virar senha
 * @returns {string|null} mensagem de erro ou null se a senha for aceita
 */
export function validarNovaSenha(senha, { telefone, email } = {}) {
  const s = String(senha ?? "");
  if (s.length < SENHA_MINIMO) return `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres`;
  if (s.length > 128) return "A senha pode ter no máximo 128 caracteres";
  if (/^(.)\1+$/.test(s)) return "A senha não pode ser um caractere repetido";
  if ("01234567890123456789".includes(s) || "98765432109876543210".includes(s)) {
    return "A senha não pode ser uma sequência de números";
  }
  if (SENHAS_COMUNS.has(normalizar(s)) || (/^\d+$/.test(s) && new Set(s).size <= 2)) {
    return "Essa senha é muito comum e fácil de adivinhar. Escolha outra (dica: use uma frase)";
  }
  const digitosTelefone = String(telefone || "").replace(/\D/g, "");
  if (digitosTelefone && s.replace(/\D/g, "") === digitosTelefone && /^[\d\s()+-]+$/.test(s)) {
    return "A senha não pode ser o seu telefone";
  }
  const em = String(email || "").toLowerCase();
  if (em && (s.toLowerCase() === em || s.toLowerCase() === em.split("@")[0])) {
    return "A senha não pode ser o seu e-mail";
  }
  return null;
}

/** Senha temporária legível (sem caracteres ambíguos), para o admin repassar */
export function gerarSenhaTemporaria(tamanho = 10) {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: tamanho }, () => alfabeto[crypto.randomInt(alfabeto.length)]).join("");
}
