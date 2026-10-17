import UsuarioService from "../services/UsuarioService.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Controller para operações relacionadas a usuários
 * Camada de apresentação - recebe requisições e delega para o service
 */
const UsuarioController = {
  /**
   * Lista todos os usuários
   * GET /api/usuarios
   */
  async index(req, res, next) {
    try {
      const usuarios = await UsuarioService.getAll();
      res.status(HTTP_STATUS.OK).json(usuarios);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Busca usuário por ID
   * GET /api/usuarios/:id
   */
  async show(req, res, next) {
    try {
      const usuario = await UsuarioService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json(usuario);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Cria novo usuário
   * POST /api/usuarios
   */
  async store(req, res, next) {
    try {
      const usuario = await UsuarioService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json(usuario);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Atualiza usuário
   * PUT /api/usuarios/:id
   */
  async update(req, res, next) {
    try {
      const usuario = await UsuarioService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json(usuario);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Ativa/Desativa usuário
   * PATCH /api/usuarios/:id/toggle
   */
  async toggleActive(req, res, next) {
    try {
      const usuario = await UsuarioService.toggleActive(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        message: `Usuário ${
          usuario.ativo ? "ativado" : "desativado"
        } com sucesso`,
        usuario,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Remove usuário (soft delete)
   * DELETE /api/usuarios/:id
   */
  async destroy(req, res, next) {
    try {
      await UsuarioService.softDelete(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        message: "Usuário desativado com sucesso",
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Busca perfil do usuário autenticado
   * GET /api/usuarios/perfil
   * Inclui nivel_escola (nível conquistado por módulos concluídos)
   */
  async perfil(req, res, next) {
    try {
      const usuarioId = req.usuario?.id_usuario;
      const usuario = await UsuarioService.getById(usuarioId);
      let celula_principal = null;
      let nivel_escola = null;
      try {
        const UsuarioCelulaModel = (await import("../models/UsuarioCelulaModel.js")).default;
        celula_principal = await UsuarioCelulaModel.getPrincipalByUsuario(usuarioId);
      } catch {
        // Tabela usuario_celula pode não existir se migration não rodou
      }
      try {
        const ModuloService = (await import("../services/ModuloService.js")).default;
        nivel_escola = await ModuloService.getNivelEscola(usuarioId);
      } catch {
        // ModuloService pode não estar disponível
      }
      res.status(HTTP_STATUS.OK).json({
        ...usuario,
        celula_principal,
        nivel_escola,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Atualiza perfil do usuário autenticado
   * PUT /api/usuarios/perfil
   */
  async updatePerfil(req, res, next) {
    try {
      const usuarioId = req.usuario?.id_usuario;
      const body = req.body || {};

      // Whitelist estrita — evita escalação (tipo, lider_*, ativo, nível, pontuação)
      const dadosPermitidos = {};
      if (body.nome !== undefined) dadosPermitidos.nome = body.nome;
      if (body.email !== undefined) dadosPermitidos.email = body.email;
      if (body.telefone !== undefined) dadosPermitidos.telefone = body.telefone;
      if (body.foto !== undefined) dadosPermitidos.foto = body.foto;

      if (body.senha !== undefined) {
        if (!body.senhaAtual) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: "Informe a senha atual para alterar a senha",
          });
        }
        const bcrypt = (await import("bcrypt")).default;
        const knex = (await import("../database/index.js")).default;
        const row = await knex("usuario")
          .where({ id_usuario: usuarioId })
          .select("senha")
          .first();
        if (!row?.senha) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: "Não foi possível validar a senha atual",
          });
        }
        const ok = await bcrypt.compare(String(body.senhaAtual), row.senha);
        if (!ok) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: "Senha atual incorreta",
          });
        }
        dadosPermitidos.senha = body.senha;
      }

      // Sem campos permitidos (ex.: tentativa de escalação) — retorna perfil atual
      if (Object.keys(dadosPermitidos).length === 0) {
        const atual = await UsuarioService.getById(usuarioId);
        return res.status(HTTP_STATUS.OK).json(atual);
      }

      const usuario = await UsuarioService.update(usuarioId, dadosPermitidos);
      res.status(HTTP_STATUS.OK).json(usuario);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: atribui pontuação manual a um usuário (ex: dinâmicas presenciais)
   * POST /api/usuarios/:id/pontuacao-manual
   * Body: { pontos: number, motivo: string }
   */
  async addPontuacaoManual(req, res, next) {
    try {
      const id_usuario = parseInt(req.params.id, 10);
      const { pontos, motivo } = req.body;
      const id_admin = req.usuario?.id_usuario;

      const usuario = await UsuarioService.addPontuacaoManual(id_usuario, pontos, motivo, id_admin);
      res.status(HTTP_STATUS.OK).json({
        message: "Pontuação atribuída com sucesso",
        usuario,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Upload de foto de perfil
   * POST /api/usuarios/perfil/foto
   */
  async uploadFoto(req, res, next) {
    try {
      const usuarioId = req.usuario?.id_usuario;

      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Nenhum arquivo enviado",
        });
      }

      // Caminho relativo da foto
      const fotoUrl = `/uploads/perfil/${req.file.filename}`;

      // Atualiza o campo foto no banco
      const usuario = await UsuarioService.update(usuarioId, { foto: fotoUrl });

      res.status(HTTP_STATUS.OK).json({
        message: "Foto atualizada com sucesso",
        foto: fotoUrl,
        usuario,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default UsuarioController;
