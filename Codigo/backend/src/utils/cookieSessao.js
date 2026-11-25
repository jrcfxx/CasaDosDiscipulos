/**
 * Sessão em cookie HttpOnly: o JavaScript da página não consegue ler o token
 * (um script injetado não rouba a sessão).
 *  - HttpOnly + SameSite=Strict + Secure (em produção)
 *  - Path=/api: o cookie só vai nas chamadas à API
 */
export const COOKIE_SESSAO = "cd_sessao";
/** Etapa intermediária do login com 2FA (senha certa, falta o código). Só vale para /api/auth. */
export const COOKIE_DESAFIO_2FA = "cd_2fa";
const SETE_DIAS_SEG = 7 * 24 * 60 * 60;

function opcoes(path = "/api") {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path,
  };
}

/** @param {number} [validadeSeg] mesma validade máxima da sessão no servidor */
export function gravarCookieSessao(res, token, validadeSeg = SETE_DIAS_SEG) {
  res.cookie(COOKIE_SESSAO, token, { ...opcoes(), maxAge: validadeSeg * 1000 });
}

export function limparCookieSessao(res) {
  res.clearCookie(COOKIE_SESSAO, opcoes());
}

export function gravarCookieDesafio(res, desafio, validadeSeg) {
  res.cookie(COOKIE_DESAFIO_2FA, desafio, { ...opcoes("/api/auth"), maxAge: validadeSeg * 1000 });
}

export function limparCookieDesafio(res) {
  res.clearCookie(COOKIE_DESAFIO_2FA, opcoes("/api/auth"));
}

/** Lê um cookie do cabeçalho (sem dependência extra) */
export function lerCookie(req, nome) {
  const cabecalho = req.headers?.cookie;
  if (!cabecalho) return null;
  for (const parte of cabecalho.split(";")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === nome) {
      try {
        return decodeURIComponent(parte.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}
