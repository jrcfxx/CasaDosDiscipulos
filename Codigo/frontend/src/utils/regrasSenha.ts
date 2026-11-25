/**
 * Regras de senha mostradas ao vivo na tela — espelho de backend/src/utils/senha.js.
 * O servidor é quem decide; aqui é só para orientar enquanto a pessoa digita.
 */
export const SENHA_MINIMO = 8;

export interface RegraSenha {
  id: string;
  texto: string;
  ok: boolean;
}

const SEQUENCIAS = ["01234567890123456789", "98765432109876543210"];

/** Mesma lista do servidor: senhas óbvias (sem acento, maiúsculas, símbolos e números no fim) */
const SENHAS_COMUNS = new Set([
  "senha", "password", "qwerty", "qwertyuiop", "asdfghjkl", "abc", "abcdef", "abcdefgh", "iloveyou", "admin",
  "administrador", "mudar", "trocar", "teste", "brasil", "flamengo", "corinthians", "palmeiras", "saopaulo",
  "vasco", "cruzeiro", "gremio", "internacional", "amor", "meuamor", "familia", "felicidade", "princesa",
  "jesus", "jesuscristo", "jesusteama", "jesusmeama", "jesuseamor", "deus", "deuseamor", "deusefiel", "deusefieldemais",
  "deusmeama", "senhor", "senhorjesus", "gloria", "gloriaadeus", "aleluia", "amem", "igreja", "biblia",
  "cristo", "cristao", "espiritosanto", "fe", "esperanca", "graca", "salmos", "salmo",
  "casadosdiscipulos", "casadiscipulos", "discipulo", "discipulos", "celula", "escoladediscipulos",
]);

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/\d+$/, "");
}

export function avaliarSenha(senha: string, dados: { telefone?: string | null; email?: string | null } = {}): RegraSenha[] {
  const s = senha ?? "";
  const digitosTelefone = String(dados.telefone ?? "").replace(/\D/g, "");
  const email = String(dados.email ?? "").toLowerCase();
  const ehTelefone = !!digitosTelefone && s.replace(/\D/g, "") === digitosTelefone && /^[\d\s()+-]+$/.test(s);
  const ehEmail = !!email && (s.toLowerCase() === email || s.toLowerCase() === email.split("@")[0]);
  const fraca = s.length > 0 && (/^(.)\1+$/.test(s) || SEQUENCIAS.some((q) => q.includes(s)));
  const comum = SENHAS_COMUNS.has(normalizar(s)) || (/^\d+$/.test(s) && new Set(s).size <= 2);

  return [
    { id: "tamanho", texto: `Pelo menos ${SENHA_MINIMO} caracteres`, ok: s.length >= SENHA_MINIMO },
    { id: "pessoal", texto: "Diferente do seu telefone e do seu e-mail", ok: s.length > 0 && !ehTelefone && !ehEmail },
    { id: "simples", texto: "Não pode ser sequência (12345678) nem repetição (aaaaaaaa)", ok: s.length > 0 && !fraca },
    { id: "comum", texto: "Não pode ser uma senha óbvia (jesus123, senha2024…)", ok: s.length > 0 && !comum },
  ];
}

export function senhaAceita(senha: string, dados?: { telefone?: string | null; email?: string | null }): boolean {
  return avaliarSenha(senha, dados).every((r) => r.ok);
}
