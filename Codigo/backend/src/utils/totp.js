import crypto from "node:crypto";

/**
 * Códigos de 6 dígitos que mudam a cada 30 segundos (TOTP, RFC 6238), compatíveis com
 * Google Authenticator, Microsoft Authenticator, Authy, 1Password etc.
 */
const ALFABETO_BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PASSO_SEGUNDOS = 30;
const DIGITOS = 6;
/** Aceita o código anterior e o próximo (relógio do celular um pouco adiantado/atrasado) */
const JANELA = 1;

export function base32Codificar(buffer) {
  let bits = 0;
  let valor = 0;
  let saida = "";
  for (const byte of buffer) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      saida += ALFABETO_BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) saida += ALFABETO_BASE32[(valor << (5 - bits)) & 31];
  return saida;
}

export function base32Decodificar(texto) {
  const limpo = String(texto).toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let valor = 0;
  const bytes = [];
  for (const c of limpo) {
    const i = ALFABETO_BASE32.indexOf(c);
    if (i < 0) throw new Error("Segredo base32 inválido");
    valor = (valor << 5) | i;
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Segredo novo de 160 bits, em base32 */
export function gerarSegredoTotp() {
  return base32Codificar(crypto.randomBytes(20));
}

function codigoDoPasso(segredo, passo) {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(passo));
  const hmac = crypto.createHmac("sha1", base32Decodificar(segredo)).update(contador).digest();
  const deslocamento = hmac[hmac.length - 1] & 0xf;
  const numero = (hmac.readUInt32BE(deslocamento) & 0x7fffffff) % 10 ** DIGITOS;
  return String(numero).padStart(DIGITOS, "0");
}

export function passoAtual(agoraMs = Date.now()) {
  return Math.floor(agoraMs / 1000 / PASSO_SEGUNDOS);
}

/** Código válido agora (usado nos testes) */
export function gerarCodigoTotp(segredo, agoraMs = Date.now()) {
  return codigoDoPasso(segredo, passoAtual(agoraMs));
}

/**
 * Confere o código digitado.
 * @param {string} segredo base32
 * @param {string} codigo digitado
 * @param {number|null} ultimoPassoUsado passo já aceito antes (o mesmo código não vale duas vezes)
 * @returns {number|null} passo aceito, ou null se o código não vale
 */
export function verificarCodigoTotp(segredo, codigo, ultimoPassoUsado = null, agoraMs = Date.now()) {
  const digitado = String(codigo ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(digitado)) return null;
  const atual = passoAtual(agoraMs);
  for (let d = -JANELA; d <= JANELA; d += 1) {
    const passo = atual + d;
    if (ultimoPassoUsado != null && passo <= Number(ultimoPassoUsado)) continue;
    const esperado = codigoDoPasso(segredo, passo);
    if (crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(digitado))) return passo;
  }
  return null;
}

/** Endereço lido pelo app autenticador (vira o QR code) */
export function uriOtpAuth(segredo, conta, emissor = "Casa dos Discípulos") {
  const rotulo = encodeURIComponent(`${emissor}:${conta}`);
  const params = new URLSearchParams({ secret: segredo, issuer: emissor, algorithm: "SHA1", digits: String(DIGITOS), period: String(PASSO_SEGUNDOS) });
  return `otpauth://totp/${rotulo}?${params.toString()}`;
}

/** Códigos de recuperação (uso único) para quem perder o celular: formato xxxx-xxxx */
export function gerarCodigosRecuperacao(quantidade = 8) {
  const alfabeto = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: quantidade }, () => {
    const s = Array.from({ length: 8 }, () => alfabeto[crypto.randomInt(alfabeto.length)]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

export function hashCodigoRecuperacao(codigo) {
  const normalizado = String(codigo ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return crypto.createHash("sha256").update(normalizado).digest("hex");
}
