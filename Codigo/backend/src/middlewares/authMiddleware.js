import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../utils/AppError.js";
import { JWT_ALGORITMO } from "../services/authService.js";
import SessaoService from "../services/SessaoService.js";
import { COOKIE_SESSAO, lerCookie } from "../utils/cookieSessao.js";

/**
 * Rotas liberadas enquanto a pessoa ainda precisa criar a própria senha
 * (primeiro acesso ou senha redefinida pelo admin).
 */
const LIBERADAS_SEM_SENHA_PROPRIA = new Set([
  "POST /api/auth/senha",
  "POST /api/auth/logout",
  "GET /api/usuarios/perfil",
]);

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Por que a sessão caiu, em linguagem simples (aparece na tela de login) */
const MENSAGENS_SESSAO_ENCERRADA = {
  senha_alterada: "Sua sessão foi encerrada porque a senha foi alterada. Entre novamente.",
  senha_redefinida: "Sua sessão foi encerrada porque a senha foi redefinida. Entre novamente.",
  encerrada_pelo_usuario: "Este acesso foi encerrado pela própria conta. Entre novamente.",
  encerrada_pelo_admin: "Este acesso foi encerrado pela secretaria. Entre novamente.",
  conta_desativada: "Usuário inativo ou não encontrado. Faça login novamente.",
  limite_de_aparelhos: "Sua conta entrou em aparelhos demais e este acesso foi encerrado. Entre novamente.",
  "2fa_alterado": "Sua sessão foi encerrada porque a verificação em duas etapas foi alterada. Entre novamente.",
  logout: "Você saiu da sua conta. Entre novamente.",
  ociosa: "Sua sessão foi encerrada por inatividade. Entre novamente.",
  expirada: "Sua sessão expirou. Entre novamente.",
};

/**
 * De onde vem a sessão:
 *  - navegador: cookie HttpOnly "cd_sessao" (o JavaScript da página não lê o token);
 *  - scripts e testes: cabeçalho "Authorization: Bearer <token>".
 */
function obterToken(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedError("Formato de token inválido");
    }
    return { token: parts[1], viaCookie: false };
  }
  const doCookie = lerCookie(req, COOKIE_SESSAO);
  return doCookie ? { token: doCookie, viaCookie: true } : null;
}

/**
 * Lê e confere a sessão. Lança UnauthorizedError com o motivo se não valer.
 * @returns {Promise<{ usuario: object, id_sessao: string, viaCookie: boolean, ociosaSeg: number } | null>}
 */
export async function lerSessao(req) {
  const origem = obterToken(req);
  if (!origem) return null;

  let decoded;
  try {
    decoded = jwt.verify(origem.token, process.env.JWT_SECRET, { algorithms: [JWT_ALGORITMO] });
  } catch (err) {
    if (err.name === "TokenExpiredError") throw new UnauthorizedError(MENSAGENS_SESSAO_ENCERRADA.expirada);
    throw new UnauthorizedError("Sua sessão não é mais válida. Entre novamente.");
  }

  // Token sem sessão no servidor (formato antigo ou de outra finalidade) não vale
  if (!decoded.sid || decoded.fim) throw new UnauthorizedError("Sua sessão não é mais válida. Entre novamente.");

  const carregada = await SessaoService.carregar(decoded.sid);
  if (!carregada || Number(carregada.usuario.id_usuario) !== Number(decoded.id_usuario)) {
    throw new UnauthorizedError("Sua sessão não é mais válida. Entre novamente.");
  }
  const { usuario, motivo } = carregada;
  if (!usuario.ativo) throw new UnauthorizedError(MENSAGENS_SESSAO_ENCERRADA.conta_desativada);
  if (motivo) {
    throw new UnauthorizedError(MENSAGENS_SESSAO_ENCERRADA[motivo] || "Sua sessão foi encerrada. Entre novamente.");
  }
  if (Number(decoded.sv || 0) !== Number(usuario.sessao_versao || 0)) {
    throw new UnauthorizedError(MENSAGENS_SESSAO_ENCERRADA.senha_alterada);
  }
  return { usuario, id_sessao: decoded.sid, viaCookie: origem.viaCookie, ociosaSeg: Number(usuario.ociosa_seg) };
}

/**
 * Valida a sessão e revalida no banco a cada requisição:
 *  - a sessão existe, não foi encerrada (sair, troca de senha, admin) e não passou do prazo;
 *  - usuário ainda existe e está ativo;
 *  - quem ainda usa senha provisória só acessa a troca de senha;
 *  - CSRF: com cookie, requisições que alteram dados precisam do cabeçalho X-Requested-With
 *    (outro site não consegue enviá-lo sem a permissão do CORS).
 */
const verificarToken = async (req, res, next) => {
  try {
    const origem = obterToken(req);
    if (!origem) {
      return next(new UnauthorizedError("Faça login para continuar."));
    }

    if (origem.viaCookie && !METODOS_SEGUROS.has(req.method) && req.headers["x-requested-with"] !== "XMLHttpRequest") {
      return next(new ForbiddenError("Requisição bloqueada por segurança. Recarregue a página e tente de novo."));
    }

    const sessao = await lerSessao(req);
    const { usuario } = sessao;

    if (usuario.trocar_senha) {
      const rota = `${req.method} ${req.baseUrl}${req.path}`.replace(/\/$/, "");
      if (!LIBERADAS_SEM_SENHA_PROPRIA.has(rota)) {
        const erro = new ForbiddenError("Crie sua senha para continuar.");
        erro.codigo = "TROCAR_SENHA";
        return next(erro);
      }
    }

    // Checagens automáticas da tela (ex.: contador de notificações) não contam como uso:
    // senão a sessão nunca ficaria ociosa enquanto a aba estivesse aberta.
    if (req.headers["x-atividade"] !== "fundo") SessaoService.tocar(sessao.id_sessao, sessao.ociosaSeg);
    req.usuario = { id_usuario: usuario.id_usuario, tipo: usuario.tipo };
    req.sessao = { id_sessao: sessao.id_sessao, id_usuario: usuario.id_usuario };
    next();
  } catch (err) {
    return next(err.isOperational ? err : new UnauthorizedError("Falha na autenticação"));
  }
};

export default verificarToken;
