import UsuarioModel from "../models/UsuarioModel.js";
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
   * Busca todos os usuários
   * @returns {Promise<Array>} Lista de usuários
   */
  async getAll() {
    return UsuarioModel.getAll();
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

    // Adiciona id_nivel se fornecido
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

    // Cria usuário
    const novoUsuario = await UsuarioModel.create(novoUsuarioData);

    return novoUsuario;
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

    // Atualiza usuário
    await UsuarioModel.update(id_usuario, dadosAtualizacao);

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
