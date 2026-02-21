import knex from "../database/index.js";
import UsuarioModel from "../models/UsuarioModel.js";
import NotificacaoModel from "../models/NotificacaoModel.js";
import UsuarioModuloModel from "../models/UsuarioModuloModel.js";
import NivelModel from "../models/NivelModel.js";
import MinisterioModel from "../models/MinisterioModel.js";
import ModuloService from "./ModuloService.js";
import QuizQuestaoModel from "../models/QuizQuestaoModel.js";
import bcrypt from "bcrypt";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from "../utils/AppError.js";
import { USER_TYPES } from "../utils/constants.js";

/**
 * Marca módulos dos níveis anteriores/inclusivo ao do usuário como concluídos.
 * Chamado quando usuário é criado ou atualizado com nível maior que o mínimo.
 */
async function marcarModulosConcluidosPorNivel(id_usuario, id_nivel) {
  if (!id_nivel) return;

  const nivelUsuario = await NivelModel.findById(id_nivel);
  if (!nivelUsuario) return;

  const niveis = await NivelModel.findAll();
  const ordemMinima = Math.min(...niveis.map((n) => n.ordem ?? 999));

  if ((nivelUsuario.ordem ?? 999) <= ordemMinima) return;

  const idsNiveisInclusos = niveis
    .filter((n) => (n.ordem ?? 999) <= (nivelUsuario.ordem ?? 999))
    .map((n) => n.id_nivel);

  if (idsNiveisInclusos.length === 0) return;

  const modulos = await knex("modulo")
    .where("ativo", true)
    .where((qb) => {
      qb.whereIn("id_nivel", idsNiveisInclusos).orWhereNull("id_nivel");
    })
    .select("id_modulo");

  const now = new Date();
  let pontosNovos = 0;

  for (const { id_modulo } of modulos) {
    const existente = await UsuarioModuloModel.getByUsuarioAndModulo(id_usuario, id_modulo);

    if (existente?.status === "concluido") {
      continue;
    }

    const quiz = await ModuloService.getQuizVinculado(id_modulo);
    let pontosModulo = 0;

    if (quiz?.id_quiz) {
      const questoes = await QuizQuestaoModel.getByQuiz(quiz.id_quiz);
      const pontuacaoMaxima = questoes.reduce((s, q) => s + (q.pontos || 0), 0);
      pontosModulo = Math.max(1, Math.floor(pontuacaoMaxima * 0.5));
    } else {
      pontosModulo = 5;
    }

    await UsuarioModuloModel.upsert(id_usuario, id_modulo, {
      status: "concluido",
      nota_quiz: pontosModulo,
      data_conclusao: now,
      auto_completo_por_nivel: true,
    });
    pontosNovos += pontosModulo;
  }

  if (pontosNovos > 0) {
    await UsuarioModel.updateScore(id_usuario, pontosNovos);
  }
}

/**
 * Reverte módulos auto-completados por nível que estão acima do novo nível do usuário.
 * Chamado quando o usuário é rebaixado de nível.
 * @param {number} id_usuario
 * @param {number|null} id_nivel_novo - Novo nível. Se null, reverte todos os auto-completados.
 */
async function reverterModulosAcimaDoNivel(id_usuario, id_nivel_novo) {
  let ordemNovo = 0;
  if (id_nivel_novo) {
    const nivelUsuario = await NivelModel.findById(id_nivel_novo);
    if (!nivelUsuario) return;
    ordemNovo = nivelUsuario.ordem ?? 999;
  }
  const idsNiveisAcima = (await NivelModel.findAll())
    .filter((n) => (n.ordem ?? 999) > ordemNovo)
    .map((n) => n.id_nivel);

  if (idsNiveisAcima.length === 0) return;

  const modulosAcima = await knex("modulo")
    .whereIn("id_nivel", idsNiveisAcima)
    .where("ativo", true)
    .select("id_modulo");

  let pontosRemover = 0;

  for (const { id_modulo } of modulosAcima) {
    const existente = await UsuarioModuloModel.getByUsuarioAndModulo(id_usuario, id_modulo);
    if (!existente || existente.status !== "concluido" || !existente.auto_completo_por_nivel) continue;

    const quiz = await ModuloService.getQuizVinculado(id_modulo);
    let pontosModulo = 0;
    if (quiz?.id_quiz) {
      const questoes = await QuizQuestaoModel.getByQuiz(quiz.id_quiz);
      const pontuacaoMaxima = questoes.reduce((s, q) => s + (q.pontos || 0), 0);
      pontosModulo = Math.max(1, Math.floor(pontuacaoMaxima * 0.5));
    } else {
      pontosModulo = 5;
    }

    await knex("usuario_modulo").where({ id_usuario, id_modulo }).del();
    pontosRemover += pontosModulo;
  }

  if (pontosRemover > 0) {
    await UsuarioModel.updateScore(id_usuario, -pontosRemover);
  }
}

/**
 * Service para operações relacionadas a usuários
 * Contém lógica de negócio para gerenciamento de usuários
 */
const UsuarioService = {
  /**
   * Busca todos os usuários (com nivel_nome e nivel_escola/nivel_escola_nome)
   * nivel_nome: do id_nivel atribuído manualmente
   * nivel_escola: calculado por módulos concluídos (como no perfil)
   * @returns {Promise<Array>} Lista de usuários
   */
  async getAll() {
    const usuarios = await UsuarioModel.getAll();
    const niveis = await NivelModel.findAll();
    const nivelById = new Map(niveis.map((n) => [n.id_nivel, n.nome]));

    const resultado = await Promise.all(
      usuarios.map(async (u) => {
        const nivel_nome = u.id_nivel != null ? nivelById.get(u.id_nivel) || null : null;
        let nivel_escola = null;
        let nivel_escola_nome = null;
        try {
          nivel_escola = await ModuloService.getNivelEscola(u.id_usuario);
          if (nivel_escola != null) {
            nivel_escola_nome = nivelById.get(nivel_escola) || null;
          }
        } catch {
          // getNivelEscola pode falhar se módulos não configurados
        }
        const nivelExibir = nivel_escola_nome ?? nivel_nome;
        return {
          ...u,
          nivel_nome,
          nivel_escola,
          nivel_escola_nome,
          nivel_exibir: nivelExibir || null,
        };
      })
    );

    return resultado;
  },

  /**
   * Busca usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Dados do usuário
   * @throws {ValidationError} Se ID for inválido
   * @throws {NotFoundError} Se usuário não for encontrado
   */
  async getById(id) {
    const numericId = Number(id);

    if (isNaN(numericId) || numericId <= 0) {
      throw new ValidationError("ID inválido");
    }

    const usuario = await UsuarioModel.getById(numericId);
    if (!usuario) {
      throw new NotFoundError("Usuário não encontrado");
    }

    try {
      usuario.ministerios_lider = await MinisterioModel.getMinisteriosByUsuario(numericId);
      usuario.ministerios_participa = await MinisterioModel.getMinisteriosParticipaByUsuario(numericId);
      usuario.id_ministerios_lider = (usuario.ministerios_lider || []).map((m) => m.id_ministerio);
      usuario.id_ministerios_participa = (usuario.ministerios_participa || []).map((m) => m.id_ministerio);
    } catch {
      usuario.ministerios_lider = [];
      usuario.ministerios_participa = [];
      usuario.id_ministerios_lider = [];
      usuario.id_ministerios_participa = [];
    }

    return usuario;
  },

  /**
   * Cria novo usuário
   * @param {Object} data - Dados do usuário
   * @returns {Promise<Object>} Usuário criado
   * @throws {ValidationError} Se dados forem inválidos
   * @throws {ConflictError} Se email já estiver cadastrado
   */
  async create(data) {
    // Validações
    if (!data.nome || data.nome.trim().length < 3) {
      throw new ValidationError("Nome deve ter no mínimo 3 caracteres");
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      throw new ValidationError("Email inválido");
    }

    if (!data.senha || data.senha.length < 6) {
      throw new ValidationError("Senha deve ter no mínimo 6 caracteres");
    }

    if (data.tipo && !Object.values(USER_TYPES).includes(data.tipo)) {
      throw new ValidationError(
        `Tipo de usuário inválido. Valores aceitos: ${Object.values(
          USER_TYPES
        ).join(", ")}`
      );
    }

    // Verifica duplicidade de email
    const existing = await UsuarioModel.getByEmail(data.email);
    if (existing) {
      throw new ConflictError("Email já cadastrado");
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(data.senha, 10);

    // Prepara dados do novo usuário
    const novoUsuarioData = {
      nome: data.nome.trim(),
      email: data.email.toLowerCase().trim(),
      senha: senhaHash,
      tipo: data.tipo || USER_TYPES.MEMBER,
      pontuacao: 0,
      ativo: data.ativo ?? true,
    };

    // Permissões de líder (apenas quando tipo=lider)
    if (data.tipo === USER_TYPES.LEADER) {
      novoUsuarioData.lider_celula = data.lider_celula ?? true;
      novoUsuarioData.lider_ministerio = data.lider_ministerio ?? false;
    }

    // Ministérios que o usuário participa
    const idMinisteriosParticipa = Array.isArray(data.id_ministerios_participa)
      ? data.id_ministerios_participa
      : [];

    // Cria usuário
    if (data.id_nivel !== undefined) {
      if (data.id_nivel !== null) {
        const id_nivel = Number(data.id_nivel);
        if (isNaN(id_nivel) || id_nivel <= 0) {
          throw new ValidationError("ID do nível deve ser um número positivo");
        }
        novoUsuarioData.id_nivel = id_nivel;
      } else {
        novoUsuarioData.id_nivel = null;
      }
    }

    if (data.telefone !== undefined && data.telefone !== null && String(data.telefone).trim()) {
      novoUsuarioData.telefone = String(data.telefone).trim();
    }

    // Cria usuário
    const novoUsuario = await UsuarioModel.create(novoUsuarioData);

    if (data.tipo === USER_TYPES.LEADER && Array.isArray(data.id_ministerios_lider) && data.id_ministerios_lider.length) {
      for (const idMin of data.id_ministerios_lider) {
        const lideres = await MinisterioModel.getLideresByMinisterio(idMin);
        const ids = lideres.map((l) => l.id_usuario);
        if (!ids.includes(novoUsuario.id_usuario)) {
          await knex("ministerio_lider").insert({ id_ministerio: idMin, id_usuario: novoUsuario.id_usuario });
        }
      }
      await UsuarioModel.update(novoUsuario.id_usuario, { lider_ministerio: true });
    }

    if (idMinisteriosParticipa.length) {
      await MinisterioModel.setMinisteriosParticipaByUsuario(novoUsuario.id_usuario, idMinisteriosParticipa);
    }

    if (novoUsuarioData.id_nivel) {
      await marcarModulosConcluidosPorNivel(novoUsuario.id_usuario, novoUsuarioData.id_nivel);
    }

    return this.getById(novoUsuario.id_usuario);
  },

  /**
   * Atualiza dados do usuário
   * @param {number} id_usuario - ID do usuário
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} Usuário atualizado
   * @throws {ValidationError} Se dados forem inválidos
   * @throws {ConflictError} Se email já estiver cadastrado para outro usuário
   */
  async update(id_usuario, data) {
    const usuarioAntigo = await this.getById(id_usuario);

    const dadosAtualizacao = {};

    // Valida e prepara dados para atualização
    if (data.nome !== undefined) {
      if (data.nome.trim().length < 3) {
        throw new ValidationError("Nome deve ter no mínimo 3 caracteres");
      }
      dadosAtualizacao.nome = data.nome.trim();
    }

    if (data.email !== undefined) {
      if (!this.isValidEmail(data.email)) {
        throw new ValidationError("Email inválido");
      }

      // Verifica se email já existe para outro usuário
      const existing = await UsuarioModel.getByEmail(data.email);
      if (existing && existing.id_usuario != id_usuario) {
        throw new ConflictError("Email já cadastrado");
      }

      dadosAtualizacao.email = data.email.toLowerCase().trim();
    }

    if (data.senha !== undefined) {
      if (data.senha.length < 6) {
        throw new ValidationError("Senha deve ter no mínimo 6 caracteres");
      }
      dadosAtualizacao.senha = await bcrypt.hash(data.senha, 10);
    }

    if (data.tipo !== undefined) {
      if (!Object.values(USER_TYPES).includes(data.tipo)) {
        throw new ValidationError("Tipo de usuário inválido");
      }
      dadosAtualizacao.tipo = data.tipo;
    }

    if (data.ativo !== undefined) {
      dadosAtualizacao.ativo = data.ativo;
    }

    if (data.pontuacao !== undefined) {
      const pontuacao = Number(data.pontuacao);
      if (isNaN(pontuacao) || pontuacao < 0) {
        throw new ValidationError("Pontuação deve ser um número positivo");
      }
      dadosAtualizacao.pontuacao = pontuacao;
    }

    if (data.id_nivel !== undefined) {
      // Permite null para remover nível ou número para atribuir
      if (data.id_nivel !== null) {
        const id_nivel = Number(data.id_nivel);
        if (isNaN(id_nivel) || id_nivel <= 0) {
          throw new ValidationError("ID do nível deve ser um número positivo");
        }
        dadosAtualizacao.id_nivel = id_nivel;
      } else {
        dadosAtualizacao.id_nivel = null;
      }
    }

    if (data.foto !== undefined) {
      // Permite string (caminho da foto) ou null para remover
      dadosAtualizacao.foto = data.foto;
    }

    if (data.telefone !== undefined) {
      dadosAtualizacao.telefone = data.telefone === "" || data.telefone === null ? null : String(data.telefone).trim();
    }

    // Permissões de líder (lider_celula = Secretaria, lider_ministerio = Escala)
    if (data.lider_celula !== undefined) dadosAtualizacao.lider_celula = !!data.lider_celula;
    if (data.lider_ministerio !== undefined) dadosAtualizacao.lider_ministerio = !!data.lider_ministerio;

    if (data.id_nivel !== undefined) {
      const nivelAntigo = usuarioAntigo.id_nivel
        ? await NivelModel.findById(usuarioAntigo.id_nivel)
        : null;
      const ordemAntiga = nivelAntigo ? (nivelAntigo.ordem ?? 999) : 0;
      const idNivelNovo = dadosAtualizacao.id_nivel ?? null;
      const nivelNovo = idNivelNovo ? await NivelModel.findById(idNivelNovo) : null;
      const ordemNova = nivelNovo ? (nivelNovo.ordem ?? 999) : 0;

      if (idNivelNovo === null || ordemNova < ordemAntiga) {
        await reverterModulosAcimaDoNivel(id_usuario, idNivelNovo);
      }
    }

    // Atualiza usuário
    await UsuarioModel.update(id_usuario, dadosAtualizacao);

    // Ministérios que lidera (atualiza ministerio_lider)
    if (data.id_ministerios_lider !== undefined) {
      await knex("ministerio_lider").where("id_usuario", id_usuario).del();
      const ids = Array.isArray(data.id_ministerios_lider) ? data.id_ministerios_lider : [];
      if (ids.length) {
        await knex("ministerio_lider").insert(ids.map((idMin) => ({ id_ministerio: idMin, id_usuario })));
        dadosAtualizacao.lider_ministerio = true;
      } else {
        dadosAtualizacao.lider_ministerio = false;
      }
      await UsuarioModel.update(id_usuario, { lider_ministerio: ids.length > 0 });
    }

    // Ministérios em que participa
    if (data.id_ministerios_participa !== undefined) {
      const ids = Array.isArray(data.id_ministerios_participa) ? data.id_ministerios_participa : [];
      await MinisterioModel.setMinisteriosParticipaByUsuario(id_usuario, ids);
    }

    if (dadosAtualizacao.id_nivel) {
      await marcarModulosConcluidosPorNivel(id_usuario, dadosAtualizacao.id_nivel);
    }

    return this.getById(id_usuario);
  },

  /**
   * Alterna status ativo/inativo do usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Usuário atualizado
   */
  async toggleActive(id) {
    const usuario = await this.getById(id);
    await UsuarioModel.update(id, { ativo: !usuario.ativo });
    return this.getById(id);
  },

  /**
   * Remove usuário (soft delete)
   * @param {number} id - ID do usuário
   * @returns {Promise<void>}
   */
  async softDelete(id) {
    await this.getById(id); // Verifica se existe
    await UsuarioModel.softDelete(id);
  },

  /**
   * Remove usuário permanentemente
   * @param {number} id - ID do usuário
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.getById(id); // Verifica se existe
    await UsuarioModel.delete(id);
  },

  /**
   * Adiciona pontos ao usuário
   * @param {number} id_usuario - ID do usuário
   * @param {number} pontos - Quantidade de pontos
   * @returns {Promise<void>}
   */
  async addScore(id_usuario, pontos) {
    await this.getById(id_usuario); // Verifica se existe

    if (isNaN(pontos) || pontos === 0) {
      throw new ValidationError("Pontos devem ser um número diferente de zero");
    }

    await UsuarioModel.updateScore(id_usuario, pontos);
  },

  /**
   * Admin: atribui pontuação manual a um usuário (ex: dinâmicas presenciais).
   * Cria notificação para o usuário com o motivo.
   * @param {number} id_usuario - ID do usuário que receberá os pontos
   * @param {number} pontos - Quantidade de pontos
   * @param {string} motivo - Motivo/descrição (ex: dinâmica presencial)
   * @param {number} id_admin - ID do admin que está atribuindo
   * @returns {Promise<Object>} Usuário atualizado
   */
  async addPontuacaoManual(id_usuario, pontos, motivo, id_admin) {
    const admin = id_admin ? await UsuarioModel.getById(id_admin) : null;
    if (!admin || admin.tipo !== USER_TYPES.ADMIN) {
      throw new ForbiddenError("Apenas administradores podem atribuir pontuação manual");
    }

    if (!pontos || isNaN(Number(pontos)) || Number(pontos) <= 0) {
      throw new ValidationError("Pontos devem ser um número positivo");
    }

    const motivoStr = motivo ? String(motivo).trim() : "";
    if (motivoStr.length < 3) {
      throw new ValidationError("O motivo deve ter no mínimo 3 caracteres");
    }

    const usuario = await this.getById(id_usuario);
    const pts = Number(pontos);

    await UsuarioModel.updateScore(id_usuario, pts);

    await NotificacaoModel.create({
      id_usuario,
      tipo: "pontuacao_manual",
      titulo: `Parabéns! Você ganhou ${pts} ponto${pts !== 1 ? "s" : ""}! 🎉`,
      mensagem: `Por: ${motivoStr}\n\nConfira sua posição no ranking!`,
      area_nome: null,
      id_escala_evento: null,
    });

    return this.getById(id_usuario);
  },

  /**
   * Valida formato de email
   * @param {string} email - Email para validar
   * @returns {boolean} True se válido
   * @private
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};

export default UsuarioService;
