import knex from "../database/index.js";
import AuthService from "../services/authService.js";
import SessaoService, { MOTIVOS_REVOGACAO, resolverReferencia } from "../services/SessaoService.js";
import RegistroSegurancaService, { EVENTOS } from "../services/RegistroSegurancaService.js";
import NotificacaoModel from "../models/NotificacaoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";
import { USER_TYPES } from "../utils/constants.js";

function idValido(valor) {
  const id = parseInt(valor, 10);
  if (!id) throw new ValidationError("Usuário inválido");
  return id;
}

/**
 * Painel de segurança (só administrador): registro de acessos, aparelhos conectados e contas bloqueadas.
 */
const SegurancaController = {
  /** GET /api/seguranca/resumo */
  async resumo(req, res, next) {
    try {
      const [[contagem]] = await knex.raw(`
        SELECT
          SUM(evento = 'login' AND resultado = 'sucesso') AS logins,
          SUM(evento = 'login' AND resultado = 'falha') AS falhas,
          SUM(evento = 'conta_bloqueada') AS bloqueios,
          SUM(evento = 'acesso_negado') AS acessos_negados
        FROM log_seguranca WHERE criado_em > NOW() - INTERVAL 1 DAY`);

      const [[{ sessoes_ativas }]] = await knex.raw(
        "SELECT COUNT(*) AS sessoes_ativas FROM sessao WHERE revogada_em IS NULL AND expira_em > NOW()"
      );

      const contas_bloqueadas = await knex("usuario")
        .where("bloqueado_ate", ">", knex.fn.now())
        .select("id_usuario", "nome", "email", "tentativas_falhas", "bloqueado_ate")
        .orderBy("bloqueado_ate", "desc");

      const admins_sem_2fa = await knex("usuario")
        .where({ tipo: USER_TYPES.ADMIN, ativo: true, totp_ativo: false })
        .select("id_usuario", "nome", "email")
        .orderBy("nome");

      // IPs com muitas senhas erradas nas últimas 24 h (possível tentativa de invasão)
      const [ips_suspeitos] = await knex.raw(`
        SELECT ip, COUNT(*) AS falhas, COUNT(DISTINCT COALESCE(email, id_usuario)) AS contas, MAX(criado_em) AS ultima
        FROM log_seguranca
        WHERE evento = 'login' AND resultado IN ('falha', 'bloqueado') AND criado_em > NOW() - INTERVAL 1 DAY AND ip IS NOT NULL
        GROUP BY ip HAVING falhas >= 5 ORDER BY falhas DESC LIMIT 10`);

      const [dias] = await knex.raw(`
        SELECT DATE(criado_em) AS dia,
               SUM(resultado = 'sucesso') AS sucesso,
               SUM(resultado IN ('falha', 'bloqueado')) AS falha
        FROM log_seguranca
        WHERE evento = 'login' AND criado_em >= CURDATE() - INTERVAL 13 DAY
        GROUP BY DATE(criado_em) ORDER BY dia`);

      res.json({
        ultimas_24h: {
          logins: Number(contagem?.logins || 0),
          falhas: Number(contagem?.falhas || 0),
          bloqueios: Number(contagem?.bloqueios || 0),
          acessos_negados: Number(contagem?.acessos_negados || 0),
        },
        sessoes_ativas: Number(sessoes_ativas || 0),
        contas_bloqueadas,
        admins_sem_2fa,
        ips_suspeitos: ips_suspeitos.map((i) => ({ ...i, falhas: Number(i.falhas), contas: Number(i.contas) })),
        logins_por_dia: dias.map((d) => ({ dia: d.dia, sucesso: Number(d.sucesso), falha: Number(d.falha) })),
      });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/seguranca/eventos?evento=&resultado=&id_usuario=&busca=&de=&ate=&pagina= */
  async eventos(req, res, next) {
    try {
      res.json(await RegistroSegurancaService.buscar(req.query));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/seguranca/sessoes — todos os aparelhos conectados agora */
  async sessoes(req, res, next) {
    try {
      const lista = await SessaoService.listarTodas();
      res.json(lista.map((s) => ({ ...s, atual: false })));
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/seguranca/sessoes/:referencia */
  async encerrarSessao(req, res, next) {
    try {
      const id = await resolverReferencia(req.params.referencia);
      if (!id) throw new NotFoundError("Esse acesso já foi encerrado.");
      const sessao = await knex("sessao").where({ id_sessao: id }).first("id_usuario");
      await SessaoService.revogar(id, MOTIVOS_REVOGACAO.PELO_ADMIN);
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.SESSAO_ENCERRADA, id_usuario: sessao?.id_usuario, id_ator: req.usuario.id_usuario,
      });
      res.json({ message: "Acesso encerrado" });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/seguranca/usuarios/:id/encerrar-sessoes */
  async encerrarSessoesDoUsuario(req, res, next) {
    try {
      const id = idValido(req.params.id);
      const exceto = id === req.usuario.id_usuario ? req.sessao.id_sessao : null;
      const n = await SessaoService.revogarDoUsuario(id, MOTIVOS_REVOGACAO.PELO_ADMIN, { exceto });
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.SESSOES_ENCERRADAS, id_usuario: id, id_ator: req.usuario.id_usuario, detalhes: { quantidade: n },
      });
      res.json({ message: n ? `${n} acesso(s) encerrado(s)` : "Essa pessoa não tinha acessos abertos", encerradas: n });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/seguranca/usuarios/:id/desbloquear */
  async desbloquear(req, res, next) {
    try {
      const id = idValido(req.params.id);
      const n = await knex("usuario")
        .where({ id_usuario: id })
        .update({ tentativas_falhas: 0, ultima_falha_em: null, bloqueado_ate: null });
      if (!n) throw new NotFoundError("Usuário não encontrado");
      await RegistroSegurancaService.registrar(req, {
        evento: EVENTOS.CONTA_DESBLOQUEADA, id_usuario: id, id_ator: req.usuario.id_usuario,
      });
      await NotificacaoModel.create({
        id_usuario: id, tipo: "seguranca", titulo: "Acesso liberado",
        mensagem: "A secretaria liberou o acesso à sua conta. Você já pode entrar de novo.",
      }).catch(() => {});
      res.json({ message: "Conta liberada" });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/seguranca/usuarios/:id — situação de segurança de uma pessoa (Gerenciar Usuários) */
  async situacaoUsuario(req, res, next) {
    try {
      const id = idValido(req.params.id);
      const [[u]] = await knex.raw(
        `SELECT id_usuario, totp_ativo, tentativas_falhas, bloqueado_ate, ultimo_login,
                (bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW()) AS bloqueado
         FROM usuario WHERE id_usuario = ?`,
        [id]
      );
      if (!u) throw new NotFoundError("Usuário não encontrado");
      const [[{ sessoes }]] = await knex.raw(
        "SELECT COUNT(*) AS sessoes FROM sessao WHERE id_usuario = ? AND revogada_em IS NULL AND expira_em > NOW()",
        [id]
      );
      res.json({
        ...u,
        totp_ativo: Boolean(u.totp_ativo),
        bloqueado: Boolean(Number(u.bloqueado)),
        sessoes_ativas: Number(sessoes),
      });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/seguranca/usuarios/:id/2fa — pessoa perdeu o celular e os códigos de recuperação */
  async removerDoisFatores(req, res, next) {
    try {
      await AuthService.removerDoisFatores(idValido(req.params.id), req);
      res.json({ message: "Verificação em duas etapas removida. A pessoa entra só com a senha." });
    } catch (err) {
      next(err);
    }
  },
};

export default SegurancaController;
