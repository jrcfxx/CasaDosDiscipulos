import crypto from "node:crypto";

/**
 * Criptografia simétrica (AES-256-GCM) para segredos guardados no banco, como o segredo do 2FA.
 * Quem copiar só o banco não consegue gerar os códigos.
 *
 * Chave: CHAVE_CRIPTOGRAFIA (recomendado, 32+ caracteres). Sem ela, deriva uma chave do JWT_SECRET
 * (trocar o JWT_SECRET, nesse caso, desativa o 2FA de todos e eles precisam configurar de novo).
 */
function chave() {
  const base = process.env.CHAVE_CRIPTOGRAFIA || process.env.JWT_SECRET;
  if (!base) throw new Error("Defina CHAVE_CRIPTOGRAFIA ou JWT_SECRET");
  return Buffer.from(crypto.hkdfSync("sha256", base, "casa-dos-discipulos", "segredos-no-banco/v1", 32));
}

/** @returns {string} "v1.<iv>.<tag>.<dados>" em base64url */
export function cifrar(texto) {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([cifra.update(String(texto), "utf8"), cifra.final()]);
  return ["v1", iv.toString("base64url"), cifra.getAuthTag().toString("base64url"), dados.toString("base64url")].join(".");
}

/** @returns {string|null} texto original, ou null se não der para abrir (chave trocada/dado adulterado) */
export function decifrar(pacote) {
  try {
    const [versao, iv, tag, dados] = String(pacote).split(".");
    if (versao !== "v1") return null;
    const decifra = crypto.createDecipheriv("aes-256-gcm", chave(), Buffer.from(iv, "base64url"));
    decifra.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decifra.update(Buffer.from(dados, "base64url")), decifra.final()]).toString("utf8");
  } catch {
    return null;
  }
}
