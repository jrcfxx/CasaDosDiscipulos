import knex from "../database/index.js";
import UsuarioModel from "../models/UsuarioModel.js";
import NivelModel from "../models/NivelModel.js";
import MinisterioModel from "../models/MinisterioModel.js";
import ModuloService from "./ModuloService.js";
import bcrypt from "bcrypt";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../utils/AppError.js";
import { USER_TYPES } from "../utils/constants.js";

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
    // Verifica se usuário existe
    await this.getById(id_usuario);

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
