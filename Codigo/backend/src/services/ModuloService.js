import knex from "../database/index.js";
import ModuloModel from "../models/ModuloModel.js";
import ModuloPreRequisitoModel from "../models/ModuloPreRequisitoModel.js";
import NivelModel from "../models/NivelModel.js";
import CampoModel from "../models/CampoModel.js";
import ModuloQuizModel from "../models/ModuloQuizModel.js";
import UsuarioModuloModel from "../models/UsuarioModuloModel.js";
import QuizQuestaoModel from "../models/QuizQuestaoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

/**
 * Service para operações relacionadas a módulos
 * Contém lógica de negócio para gerenciamento de módulos e seus campos
 */
const ModuloService = {
  /**
   * Busca todos os módulos com seus campos vinculados
   * @returns {Promise<Array>} Lista de módulos com campos
   */
  async getAll() {
    const modulos = await ModuloModel.getAll();
    const niveis = await NivelModel.findAll();
    const nivelById = new Map(niveis.map((n) => [n.id_nivel, n.nome]));

    const modulosComCampos = await Promise.all(
      modulos.map(async (modulo) => {
        const [campos, pre_requisitos] = await Promise.all([
          CampoModel.getByEntity("modulo", modulo.id_modulo),
          ModuloPreRequisitoModel.getByModulo(modulo.id_modulo),
        ]);
        const nivel_nome = modulo.id_nivel ? nivelById.get(modulo.id_nivel) : null;
        return { ...modulo, nivel_nome, campos, pre_requisitos };
      })
    );

    return modulosComCampos;
  },

  /**
   * Verifica se o usuário pode acessar o módulo
   * - Opcionais: apenas precisa ter pré-requisitos concluídos (se houver)
   * - Obrigatórios: pré-requisitos OU obrigatórios anteriores por ordem (fallback)
   * @param {number} id_modulo - ID do módulo
   * @param {number} id_usuario - ID do usuário
   * @returns {Promise<boolean>} true se pode acessar
   */
  async podeAcessarModulo(id_modulo, id_usuario) {
    const modulo = await ModuloModel.getById(id_modulo);
    if (!modulo) return false;
    if (modulo.ativo === false || modulo.ativo === 0) return false;

    const preRequisitos = await ModuloPreRequisitoModel.getByModulo(id_modulo);

    if (preRequisitos.length > 0) {
      const progressos = await UsuarioModuloModel.getByUsuario(id_usuario);
      const concluidos = new Set(
        progressos
          .filter((p) => p.status === "concluido")
          .map((p) => p.id_modulo)
      );
      return preRequisitos.every((id) => concluidos.has(id));
    }

    const obrigatorio = modulo.obrigatorio !== false && modulo.obrigatorio !== 0;
    if (!obrigatorio) return true;

    const modulosAtivos = await ModuloModel.getActive();
    const obrigatoriosAnteriores = modulosAtivos.filter(
      (m) => m.obrigatorio !== false && m.obrigatorio !== 0 && m.ordem < modulo.ordem
    );
    if (obrigatoriosAnteriores.length === 0) return true;

    const progressos = await UsuarioModuloModel.getByUsuario(id_usuario);
    const concluidos = new Set(
      progressos
        .filter((p) => p.status === "concluido")
        .map((p) => p.id_modulo)
    );

    return obrigatoriosAnteriores.every((m) => concluidos.has(m.id_modulo));
  },

  /**
   * Marca módulo como em_andamento para o usuário (ao acessar o conteúdo)
   * Valida progressão sequencial antes de liberar
   * @param {number} id_modulo - ID do módulo
   * @param {number} id_usuario - ID do usuário
   */
  async iniciarModulo(id_modulo, id_usuario) {
    const modulo = await this.getById(id_modulo);
    if (modulo.ativo === false || modulo.ativo === 0) {
      throw new ValidationError("Este módulo está inativo e não pode ser realizado.");
    }
    const podeAcessar = await this.podeAcessarModulo(id_modulo, id_usuario);
    if (!podeAcessar) {
      throw new ValidationError(
        "Complete os módulos anteriores na sequência para desbloquear este."
      );
    }

    const existente = await UsuarioModuloModel.getByUsuarioAndModulo(
      id_usuario,
      id_modulo
    );
    if (!existente) {
      await UsuarioModuloModel.create({
        id_usuario,
        id_modulo,
        status: "em_andamento",
      });
    }
    return UsuarioModuloModel.getByUsuarioAndModulo(id_usuario, id_modulo);
  },

  /**
   * Conclui módulo sem quiz (para módulos apenas com conteúdo)
   * Valida progressão sequencial e que o módulo não possui quiz
   * @param {number} id_modulo - ID do módulo
   * @param {number} id_usuario - ID do usuário
   */
  async concluirModulo(id_modulo, id_usuario) {
    const modulo = await this.getById(id_modulo);
    if (modulo.ativo === false || modulo.ativo === 0) {
      throw new ValidationError("Este módulo está inativo e não pode ser realizado.");
    }
    const quiz = await this.getQuizVinculado(id_modulo);
    if (quiz?.id_quiz) {
      const questoes = await QuizQuestaoModel.getByQuiz(quiz.id_quiz);
      if (questoes.length > 0) {
        throw new ValidationError(
          "Este módulo possui quiz. Conclua pelo quiz para finalizar."
        );
      }
    }

    const podeAcessar = await this.podeAcessarModulo(id_modulo, id_usuario);
    if (!podeAcessar) {
      throw new ValidationError(
        "Complete os módulos anteriores na sequência para desbloquear este."
      );
    }

    const now = new Date();
    await UsuarioModuloModel.upsert(id_usuario, id_modulo, {
      status: "concluido",
      nota_quiz: null,
      data_conclusao: now,
    });
    return { message: "Módulo concluído com sucesso" };
  },

  /**
   * Busca módulo por ID com seus campos
   * @param {number} id - ID do módulo
   * @returns {Promise<Object>} Módulo com campos
   * @throws {ValidationError} Se ID for inválido
   * @throws {NotFoundError} Se módulo não for encontrado
   */
  async getById(id) {
    const parsedId = Number(id);

    if (isNaN(parsedId) || parsedId <= 0) {
      throw new ValidationError("ID inválido");
    }

    const modulo = await ModuloModel.getById(parsedId);
    if (!modulo) {
      throw new NotFoundError("Módulo não encontrado");
    }

    const campos = await CampoModel.getByEntity("modulo", parsedId);
    const pre_requisitos = await ModuloPreRequisitoModel.getByModulo(parsedId);

    return { ...modulo, campos, pre_requisitos };
  },

  /**
   * Busca apenas módulos ativos
   * @returns {Promise<Array>} Lista de módulos ativos
   */
  async getActive() {
    const modulos = await ModuloModel.getActive();

    const modulosComCampos = await Promise.all(
      modulos.map(async (modulo) => {
        const campos = await CampoModel.getByEntity("modulo", modulo.id_modulo);
        return { ...modulo, campos };
      })
    );

    return modulosComCampos;
  },

  /**
   * Cria módulo com campos vinculados
   * @param {Object} data - Dados do módulo
   * @returns {Promise<Object>} Módulo criado com campos
   * @throws {ValidationError} Se dados forem inválidos
   */
  async createComCampos(data) {
    // Validações básicas
    if (!data.titulo || data.titulo.trim().length < 3) {
      throw new ValidationError(
        "Título do módulo deve ter no mínimo 3 caracteres"
      );
    }

    // Cria o módulo
    const novoModulo = await ModuloModel.create({
      titulo: data.titulo.trim(),
      descricao: data.descricao?.trim() || null,
      ordem: data.ordem || 0,
      ativo: data.ativo ?? true,
      obrigatorio: data.obrigatorio ?? true,
      id_nivel: data.id_nivel ?? null,
    });

    await ModuloPreRequisitoModel.setForModulo(
      novoModulo.id_modulo,
      data.pre_requisitos || []
    );

    // Vincula campos se fornecidos
    if (data.campos && Array.isArray(data.campos) && data.campos.length > 0) {
      for (const campo of data.campos) {
        if (!campo.id_campo) {
          throw new ValidationError("Cada campo deve ter um id_campo válido");
        }

        await CampoModel.linkToEntity(
          "modulo",
          novoModulo.id_modulo,
          campo.id_campo,
          campo.conteudo || "",
          campo.label || "",
          campo.ordem || 0
        );
      }
    }

    // Busca campos vinculados
    const camposVinculados = await CampoModel.getByEntity(
      "modulo",
      novoModulo.id_modulo
    );

    return { ...novoModulo, campos: camposVinculados };
  },

  /**
   * Atualiza módulo e seus campos
   * @param {number} id - ID do módulo
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} Módulo atualizado
   * @throws {NotFoundError} Se módulo não for encontrado
   */
  async update(id, data) {
    // Verifica se módulo existe
    await this.getById(id);

    const dadosAtualizacao = {};

    if (data.titulo !== undefined) dadosAtualizacao.titulo = data.titulo.trim();
    if (data.descricao !== undefined)
      dadosAtualizacao.descricao = data.descricao?.trim() || null;
    if (data.ordem !== undefined) dadosAtualizacao.ordem = data.ordem;
    if (data.ativo !== undefined) dadosAtualizacao.ativo = data.ativo;
    if (data.obrigatorio !== undefined) dadosAtualizacao.obrigatorio = data.obrigatorio;
    if (data.id_nivel !== undefined) dadosAtualizacao.id_nivel = data.id_nivel;

    await ModuloModel.update(id, dadosAtualizacao);

    if (data.pre_requisitos && Array.isArray(data.pre_requisitos)) {
      await ModuloPreRequisitoModel.setForModulo(id, data.pre_requisitos);
    }

    // Se campos foram enviados, atualiza vínculos
    if (data.campos && Array.isArray(data.campos)) {
      // Remove campos antigos
      await CampoModel.unlinkAllFromEntity("modulo", id);

      // Adiciona novos campos
      for (const campo of data.campos) {
        if (!campo.id_campo) continue;

        await CampoModel.linkToEntity(
          "modulo",
          id,
          campo.id_campo,
          campo.conteudo || "",
          campo.label || "",
          campo.ordem || 0
        );
      }
    }

    return this.getById(id);
  },

  /**
   * Alterna status ativo/inativo do módulo
   * @param {number} id - ID do módulo
   * @returns {Promise<Object>} Módulo atualizado
   */
  async toggleActive(id) {
    const modulo = await this.getById(id);
    await ModuloModel.toggleActive(id, !modulo.ativo);
    return this.getById(id);
  },

  /**
   * Remove módulo permanentemente (exclusão real)
   * Remove registros dependentes antes de excluir o módulo
   * @param {number} id - ID do módulo
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.getById(id); // Verifica se existe
    // usuario_modulo não tem CASCADE - remover antes
    await knex("usuario_modulo").where({ id_modulo: id }).del();
    await knex("modulo_pre_requisito")
      .where({ id_modulo: id })
      .orWhere({ id_modulo_requerido: id })
      .del();
    await ModuloModel.delete(id);
  },

  /**
   * Vincula quiz a um módulo
   * @param {number} idModulo - ID do módulo
   * @param {number} idQuiz - ID do quiz
   * @returns {Promise<Object>} Vínculo criado
   */
  async vincularQuiz(idModulo, idQuiz) {
    // Verifica se módulo existe
    await this.getById(idModulo);

    // Verifica se já existe vínculo
    const jaVinculado = await ModuloQuizModel.existeVinculo(idModulo, idQuiz);
    if (jaVinculado) {
      throw new ValidationError("Este quiz já está vinculado a este módulo");
    }

    return ModuloQuizModel.vincular(idModulo, idQuiz);
  },

  /**
   * Remove vínculo entre módulo e quiz
   * @param {number} idModulo - ID do módulo
   * @param {number} idQuiz - ID do quiz
   * @returns {Promise<number>} Número de vínculos removidos
   */
  async desvincularQuiz(idModulo, idQuiz) {
    await this.getById(idModulo);
    return ModuloQuizModel.desvincular(idModulo, idQuiz);
  },

  /**
   * Atualiza quiz vinculado a um módulo
   * @param {number} idModulo - ID do módulo
   * @param {number} novoIdQuiz - ID do novo quiz (ou null para remover)
   * @returns {Promise<Object|null>} Novo vínculo ou null
   */
  async atualizarQuizVinculado(idModulo, novoIdQuiz) {
    await this.getById(idModulo);
    return ModuloQuizModel.atualizarVinculo(idModulo, novoIdQuiz);
  },

  /**
   * Retorna progresso do usuário em um módulo (requer auth)
   * @param {number} id_modulo - ID do módulo
   * @param {number} id_usuario - ID do usuário
   * @returns {Promise<Object|null>} { status, nota_quiz } ou null se sem progresso
   */
  async getProgressoUsuario(id_modulo, id_usuario) {
    const row = await UsuarioModuloModel.getByUsuarioAndModulo(id_usuario, id_modulo);
    if (!row) return null;
    return {
      status: row.status,
      nota_quiz: row.nota_quiz ?? null,
    };
  },

  /**
   * Busca quiz vinculado a um módulo
   * Verifica primeiro modulo_quiz (N:N), depois quiz.id_modulo (vinculação direta)
   * @param {number} idModulo - ID do módulo
   * @returns {Promise<Object|null>} Quiz vinculado ou null
   */
  async getQuizVinculado(idModulo) {
    const viaModuloQuiz = await ModuloQuizModel.getQuizByModulo(idModulo);
    if (viaModuloQuiz) return viaModuloQuiz;

    const quiz = await knex("quiz")
      .where({ id_modulo: idModulo })
      .first();
    return quiz || null;
  },

  /**
   * Busca módulos ativos com progresso do usuário (para página do usuário)
   * Inclui nivel_escola (qtd de módulos concluídos) quando id_usuario presente
   * @param {number} id_usuario - ID do usuário (opcional)
   * @returns {Promise<Array>} Módulos ordenados por ordem, com status de progresso
   */
  async getActiveWithProgress(id_usuario) {
    const modulos = await ModuloModel.getActive();

    let progressMap = new Map();
    let nivelEscola = null;
    let nivelEscolaNome = null;
    if (id_usuario) {
      const progressos = await UsuarioModuloModel.getByUsuario(id_usuario);
      progressMap = new Map(progressos.map((p) => [p.id_modulo, p]));
      nivelEscola = await this.getNivelEscola(id_usuario);
      if (nivelEscola) {
        const n = await NivelModel.findById(nivelEscola);
        nivelEscolaNome = n?.nome ?? null;
      }
    }

    const niveis = await NivelModel.findAll();
    const nivelById = new Map(niveis.map((n) => [n.id_nivel, n.nome]));

    const modulosComCampos = await Promise.all(
      modulos.map(async (modulo) => {
        const [campos, pre_requisitos, quiz] = await Promise.all([
          CampoModel.getByEntity("modulo", modulo.id_modulo),
          ModuloPreRequisitoModel.getByModulo(modulo.id_modulo),
          this.getQuizVinculado(modulo.id_modulo),
        ]);
        const progresso = progressMap.get(modulo.id_modulo);
        let pontuacao_maxima = null;
        if (quiz?.id_quiz) {
          const questoes = await QuizQuestaoModel.getByQuiz(quiz.id_quiz);
          pontuacao_maxima = questoes.reduce((s, q) => s + (q.pontos || 0), 0) || null;
        }
        return {
          ...modulo,
          campos,
          pre_requisitos,
          nivel_nome: modulo.id_nivel ? nivelById.get(modulo.id_nivel) : null,
          status: progresso?.status || "nao_iniciado",
          nota_quiz: progresso?.nota_quiz ?? null,
          pontuacao_maxima,
          data_conclusao: progresso?.data_conclusao ?? null,
        };
      })
    );

    const ordenados = modulosComCampos.sort((a, b) => a.ordem - b.ordem);
    return {
      modulos: ordenados,
      nivel_escola: nivelEscola,
      nivel_escola_nome: nivelEscolaNome,
    };
  },

  /**
   * Retorna ranking de usuários por pontuação (para gamificação)
   * Inclui nivel_escola = quantidade de módulos concluídos
   * @param {number} limit - Quantidade de usuários (padrão 10)
   * @returns {Promise<Array>} Lista ordenada por pontuacao desc
   */
  async getRanking(limit = 10) {
    const usuarios = await knex("usuario")
      .where({ ativo: true })
      .select("id_usuario", "nome", "pontuacao", "foto")
      .orderBy("pontuacao", "desc")
      .orderBy("id_usuario", "asc")
      .limit(limit);

    const nivelPorUsuario = await Promise.all(
      usuarios.map(async (u) => ({
        id_usuario: u.id_usuario,
        nivel_escola: await this.getNivelEscola(u.id_usuario),
      }))
    );
    const mapaNivel = new Map(
      nivelPorUsuario.map((r) => [r.id_usuario, r.nivel_escola])
    );

    const niveis = await NivelModel.findAll();
    const nivelById = new Map(niveis.map((n) => [n.id_nivel, n.nome]));

    return usuarios.map((u) => {
      const idNivel = mapaNivel.get(u.id_usuario);
      return {
        ...u,
        nivel_escola: idNivel,
        nivel_escola_nome: idNivel ? nivelById.get(idNivel) || null : null,
      };
    });
  },

  /**
   * Retorna posição e dados do usuário no ranking (para mensagens motivacionais)
   * @param {number} id_usuario - ID do usuário autenticado
   * @returns {Promise<Object>} { posicao, pontuacao, nivel_escola, pontuacao_primeiro, pontuacao_anterior }
   */
  async getMinhaPosicao(id_usuario) {
    const usuario = await knex("usuario")
      .where({ id_usuario, ativo: true })
      .select("pontuacao")
      .first();
    if (!usuario) return null;

    const pontuacao = Number(usuario.pontuacao) || 0;

    /* Mesmo critério do ranking: pontuacao DESC, id_usuario ASC (desempate) */
    const [posicaoRow] = await knex("usuario")
      .where({ ativo: true })
      .where(function () {
        this.where("pontuacao", ">", pontuacao).orWhere(function () {
          this.where("pontuacao", pontuacao).where("id_usuario", "<", id_usuario);
        });
      })
      .count("* as total");
    const posicao = 1 + (Number(posicaoRow?.total) || 0);

    const primeiro = await knex("usuario")
      .where({ ativo: true })
      .orderBy("pontuacao", "desc")
      .select("pontuacao")
      .first();

    const anterior = await knex("usuario")
      .where({ ativo: true })
      .where("pontuacao", ">", pontuacao)
      .orderBy("pontuacao", "asc")
      .select("pontuacao")
      .first();

    const nivelEscola = await this.getNivelEscola(id_usuario);
    let nivelEscolaNome = null;
    if (nivelEscola) {
      const n = await NivelModel.findById(nivelEscola);
      nivelEscolaNome = n?.nome ?? null;
    }

    return {
      posicao,
      pontuacao,
      nivel_escola: nivelEscola,
      nivel_escola_nome: nivelEscolaNome,
      pontuacao_primeiro: primeiro ? Number(primeiro.pontuacao) : pontuacao,
      pontuacao_anterior: anterior ? Number(anterior.pontuacao) : null,
    };
  },

  /**
   * Retorna o id_nivel da escola do usuário (entidade nivel desbloqueada)
   * Se módulos têm id_nivel: maior ordem entre niveis desbloqueados
   * Caso contrário: fallback por qtd consecutiva obrigatória
   * @param {number} id_usuario - ID do usuário
   * @returns {Promise<number|null>} id_nivel ou null
   */
  async getNivelEscola(id_usuario) {
    const concluidos = await knex("usuario_modulo")
      .where({ id_usuario, status: "concluido" })
      .select("id_modulo")
      .then((rows) => new Set(rows.map((r) => r.id_modulo)));

    const modulosComNivel = await knex("modulo")
      .where({ ativo: true })
      .whereRaw("(obrigatorio IS NULL OR obrigatorio = 1)")
      .whereNotNull("id_nivel")
      .whereIn("id_modulo", Array.from(concluidos))
      .select("id_nivel");

    if (modulosComNivel.length > 0) {
      const ids = [...new Set(modulosComNivel.map((m) => m.id_nivel).filter(Boolean))];
      const niveis = await NivelModel.findAll();
      const byOrdem = ids
        .map((id) => niveis.find((n) => n.id_nivel === id))
        .filter(Boolean)
        .sort((a, b) => (b.ordem || 0) - (a.ordem || 0));
      return byOrdem[0]?.id_nivel ?? null;
    }

    const modulosObrigatorios = await knex("modulo")
      .where({ ativo: true })
      .whereRaw("(obrigatorio IS NULL OR obrigatorio = 1)")
      .orderBy("ordem", "asc")
      .select("id_modulo");

    let count = 0;
    for (const m of modulosObrigatorios) {
      if (!concluidos.has(m.id_modulo)) break;
      count++;
    }

    if (count === 0) return null;
    const niveis = await NivelModel.findAll();
    const nivelByOrdem = niveis.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    const idx = Math.min(count - 1, nivelByOrdem.length - 1);
    return idx >= 0 ? nivelByOrdem[idx].id_nivel : null;
  },
};

export default ModuloService;
