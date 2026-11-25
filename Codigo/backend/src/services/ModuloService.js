import knex from "../database/index.js";
import ModuloModel from "../models/ModuloModel.js";
import ModuloPreRequisitoModel from "../models/ModuloPreRequisitoModel.js";
import NivelModel from "../models/NivelModel.js";
import CampoModel from "../models/CampoModel.js";
import ModuloQuizModel from "../models/ModuloQuizModel.js";
import UsuarioModuloModel from "../models/UsuarioModuloModel.js";
import QuizQuestaoModel from "../models/QuizQuestaoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";
import { conteudoParaTexto, validarConteudoDeModulo, validarListaDeCampos } from "../utils/camposEntidade.js";

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
    const titulo = String(data.titulo ?? "").trim();
    if (titulo.length < 3) throw new ValidationError("O título precisa ter pelo menos 3 letras.");
    const campos = Array.isArray(data.campos) ? data.campos : [];
    await this._validarCampos(campos);
    await this._validarNivel(data.id_nivel);
    const preRequisitos = await this._validarPreRequisitos(null, data.pre_requisitos);

    // Tudo ou nada: um conteúdo inválido não deixa um módulo pela metade
    const idModulo = await knex.transaction(async (trx) => {
      const [id] = await trx("modulo").insert({
        titulo,
        descricao: String(data.descricao ?? "").trim() || null,
        ordem: Number.isInteger(data.ordem) && data.ordem >= 0 ? data.ordem : await this._proximaOrdem(trx),
        ativo: data.ativo ?? true,
        obrigatorio: data.obrigatorio ?? true,
        id_nivel: data.id_nivel ?? null,
      });
      await this._gravarPreRequisitos(trx, id, preRequisitos);
      await this._gravarCampos(trx, id, campos);
      return id;
    });

    return this.getById(idModulo);
  },

  /**
   * Atualiza só o que vier: { ativo } sozinho só liga/desliga (não mexe nos conteúdos).
   * @param {number} id - ID do módulo
   * @param {Object} data - Dados para atualizar
   */
  async update(id, data) {
    const idModulo = this._idValido(id);
    await this.getById(idModulo);

    const dadosAtualizacao = {};
    if (data.titulo !== undefined) {
      dadosAtualizacao.titulo = String(data.titulo).trim();
      if (dadosAtualizacao.titulo.length < 3) throw new ValidationError("O título precisa ter pelo menos 3 letras.");
    }
    if (data.descricao !== undefined) dadosAtualizacao.descricao = String(data.descricao ?? "").trim() || null;
    if (data.ordem !== undefined) dadosAtualizacao.ordem = data.ordem;
    if (data.ativo !== undefined) dadosAtualizacao.ativo = data.ativo;
    if (data.obrigatorio !== undefined) dadosAtualizacao.obrigatorio = data.obrigatorio;
    if (data.id_nivel !== undefined) {
      await this._validarNivel(data.id_nivel);
      dadosAtualizacao.id_nivel = data.id_nivel;
    }
    const preRequisitos = Array.isArray(data.pre_requisitos)
      ? await this._validarPreRequisitos(idModulo, data.pre_requisitos)
      : null;
    const campos = Array.isArray(data.campos) ? data.campos : null;
    if (campos) await this._validarCampos(campos);

    await knex.transaction(async (trx) => {
      if (Object.keys(dadosAtualizacao).length) {
        await trx("modulo").where({ id_modulo: idModulo }).update(dadosAtualizacao);
      }
      if (preRequisitos) await this._gravarPreRequisitos(trx, idModulo, preRequisitos);
      if (campos) {
        await trx("modulo_campo").where({ id_modulo: idModulo }).del();
        await this._gravarCampos(trx, idModulo, campos);
      }
    });

    return this.getById(idModulo);
  },

  /**
   * Nova ordem da trilha: a lista com TODOS os módulos, na ordem desejada.
   * Recusa lista incompleta ou repetida (salvar metade embaralharia o resto).
   */
  async reordenar(ids) {
    const lista = (Array.isArray(ids) ? ids : []).map(Number);
    if (!lista.length || lista.some((n) => !Number.isInteger(n) || n <= 0) || new Set(lista).size !== lista.length) {
      throw new ValidationError("Lista de módulos inválida.");
    }
    const existentes = (await knex("modulo").select("id_modulo")).map((m) => m.id_modulo);
    if (existentes.length !== lista.length || existentes.some((id) => !lista.includes(id))) {
      throw new ValidationError("A lista de módulos mudou. Atualize a página e arraste de novo.");
    }
    await knex.transaction(async (trx) => {
      for (const [i, id] of lista.entries()) {
        await trx("modulo").where({ id_modulo: id }).update({ ordem: i + 1 });
      }
    });
    return this.getAll();
  },

  /** Quantos alunos começaram e quantos concluíram o módulo */
  async contarProgresso(id) {
    const idModulo = this._idValido(id);
    await this.getById(idModulo);
    const linhas = await knex("usuario_modulo").where({ id_modulo: idModulo }).select("status");
    return {
      alunos: linhas.length,
      concluidos: linhas.filter((l) => String(l.status).toLowerCase().startsWith("conclu")).length,
    };
  },

  _idValido(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) throw new ValidationError("ID inválido");
    return n;
  },

  /** Próxima posição na trilha (o novo módulo entra no fim) */
  async _proximaOrdem(trx = knex) {
    const linha = await trx("modulo").max({ maior: "ordem" }).first();
    return Number(linha?.maior || 0) + 1;
  },

  /** Conteúdos: nome, tipo de módulo, sem nomes repetidos e com conteúdo preenchido e válido */
  async _validarCampos(campos) {
    const permitidos = await CampoModel.getByModalidade("modulo");
    // O quiz do módulo é vinculado à parte (POST /modulo/:id/quiz/:idQuiz), não é bloco de conteúdo
    const tipos = new Map(
      permitidos.filter((c) => c.tipo_campo !== "quiz").map((c) => [Number(c.id_campo), c.tipo_campo])
    );
    validarListaDeCampos(campos, { tiposPermitidos: tipos, oQue: "módulo", exigirUm: false });
    validarConteudoDeModulo(campos, tipos);
  },

  async _gravarCampos(trx, idModulo, campos) {
    if (!campos.length) return;
    // A ordem é a da lista (a "ordem" de cada item é ignorada: repetida, batia no índice único)
    await trx("modulo_campo").insert(
      campos.map((c, i) => ({
        id_modulo: idModulo,
        id_campo: Number(c.id_campo),
        label: String(c.label).trim(),
        conteudo: conteudoParaTexto(c.conteudo).trim(),
        ordem: i + 1,
      }))
    );
  },

  async _validarNivel(idNivel) {
    if (idNivel === undefined || idNivel === null) return;
    const nivel = await knex("nivel").where({ id_nivel: idNivel }).first();
    if (!nivel) throw new ValidationError("O nível escolhido não existe mais. Atualize a página.");
  },

  /**
   * Pré-requisitos sem repetição, existentes, sem o próprio módulo e sem ciclo
   * (A exige B e B exige A travaria os dois para sempre).
   */
  async _validarPreRequisitos(idModulo, lista) {
    const ids = [...new Set((lista || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    if (!ids.length) return [];
    if (idModulo && ids.includes(idModulo)) {
      throw new ValidationError("Um módulo não pode ser pré-requisito dele mesmo.");
    }
    const existentes = await knex("modulo").whereIn("id_modulo", ids).select("id_modulo", "titulo");
    if (existentes.length !== ids.length) {
      throw new ValidationError("Algum pré-requisito escolhido não existe mais. Atualize a página.");
    }
    if (idModulo) {
      const arestas = await knex("modulo_pre_requisito").select("id_modulo", "id_modulo_requerido");
      const exige = new Map();
      for (const a of arestas) {
        if (a.id_modulo === idModulo) continue; // os do próprio módulo serão substituídos
        if (!exige.has(a.id_modulo)) exige.set(a.id_modulo, []);
        exige.get(a.id_modulo).push(a.id_modulo_requerido);
      }
      for (const inicio of ids) {
        const pilha = [inicio];
        const visto = new Set();
        while (pilha.length) {
          const atual = pilha.pop();
          if (atual === idModulo) {
            const nome = existentes.find((m) => m.id_modulo === inicio)?.titulo || "outro módulo";
            throw new ValidationError(
              `"${nome}" já depende deste módulo; usá-lo como pré-requisito travaria os dois.`
            );
          }
          if (visto.has(atual)) continue;
          visto.add(atual);
          pilha.push(...(exige.get(atual) || []));
        }
      }
    }
    return ids;
  },

  async _gravarPreRequisitos(trx, idModulo, ids) {
    await trx("modulo_pre_requisito").where({ id_modulo: idModulo }).del();
    if (ids.length) {
      await trx("modulo_pre_requisito").insert(ids.map((r) => ({ id_modulo: idModulo, id_modulo_requerido: r })));
    }
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

    const quiz = await knex("quiz").where({ id_quiz: idQuiz }).first();
    if (!quiz) throw new NotFoundError("Quiz não encontrado");

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
    // Nível oficial (definido pelo admin) prevalece se for maior que o calculado pelos módulos:
    // sem isso, quem ainda não fez módulos no sistema aparecia como "Sem nível".
    const [calculado, usuario, niveis] = await Promise.all([
      this._nivelPorModulos(id_usuario),
      knex("usuario").where({ id_usuario }).select("id_nivel").first(),
      NivelModel.findAll(),
    ]);
    const ordem = (id) => niveis.find((n) => n.id_nivel === id)?.ordem ?? -1;
    const oficial = usuario?.id_nivel ?? null;
    if (!calculado) return oficial;
    if (!oficial) return calculado;
    return ordem(oficial) >= ordem(calculado) ? oficial : calculado;
  },

  /** Nível alcançado pelos módulos concluídos (regra original) */
  async _nivelPorModulos(id_usuario) {
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

  /**
   * Retorna usuários com módulos obrigatórios pendentes e telefone (para lembrete WhatsApp semanal)
   * Considera apenas módulos obrigatórios (obrigatorio !== false) na progressão de nível
   * @returns {Promise<Array<{ id_usuario, nome, telefone, modulos: Array<{ titulo }> }>>}
   */
  async getUsuariosComModulosPendentes() {
    const usuarios = await knex("usuario")
      .where({ ativo: true })
      .whereNotNull("telefone")
      .where("telefone", "!=", "")
      .select("id_usuario", "nome", "telefone");

    const resultado = [];
    for (const u of usuarios) {
      const { modulos } = await this.getActiveWithProgress(u.id_usuario);
      const obrigatorio = (m) => m.obrigatorio !== false && m.obrigatorio !== 0;
      const ativo = (m) => m.ativo !== false && m.ativo !== 0;
      const pendentes = modulos.filter(
        (m) =>
          (m.status === "nao_iniciado" || m.status === "em_andamento") &&
          ativo(m) &&
          obrigatorio(m)
      );
      // Só incluir módulos que o usuário pode acessar (pré-requisitos ok)
      const pendentesAcessiveis = [];
      for (const m of pendentes) {
        const pode = await this.podeAcessarModulo(m.id_modulo, u.id_usuario);
        if (pode) pendentesAcessiveis.push({ titulo: m.titulo });
      }
      if (pendentesAcessiveis.length > 0) {
        resultado.push({
          id_usuario: u.id_usuario,
          nome: u.nome,
          telefone: u.telefone,
          modulos: pendentesAcessiveis,
        });
      }
    }
    return resultado;
  },
};

export default ModuloService;
