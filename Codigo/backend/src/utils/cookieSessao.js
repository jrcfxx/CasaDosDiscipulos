/**
 * Sessão em cookie HttpOnly: o JavaScript da página não consegue ler o token
 * (um script injetado não rouba a sessão).
 *  - HttpOnly + SameSite=Strict + Secure (em produção)
 *  - Path=/api: o cookie só vai nas chamadas à API
 */
export const COOKIE_SESSAO = "cd_sessao";
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

function opcoes() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
  };
}

export function gravarCookieSessao(res, token) {
  res.cookie(COOKIE_SESSAO, token, { ...opcoes(), maxAge: SETE_DIAS_MS });
}

export function limparCookieSessao(res) {
  res.clearCookie(COOKIE_SESSAO, opcoes());
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
