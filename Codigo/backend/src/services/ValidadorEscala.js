import EscalaRepository from "../repository/EscalaRepository.js";
import MinisterioModel from "../models/MinisterioModel.js";
import { getConfigPorArea, getLimitesPorArea } from "../config/ministerioCampos.js";

/**
 * Validações de conflito e regras de negócio da Escala
 */
class ValidadorEscala {
  /**
   * Executa todas as validações relevantes.
   * @returns {Promise<{ valido: boolean, conflitos: Array }>}
   */
  async validarTodosConflitos({
    idUsuario,
    idArea,
    areaNome,
    idEvento,
    dataHora,
    dataHoraFim,
    detalhes = null,
    idAtribuicaoExcluir = null,
    excluirMesmoEventoDoOverlap = false,
    idMinisterioDestino = null,
  }) {
    const conflitos = [];

    const duploEvento = await this.validarConflitoDuploEvento(
      idUsuario,
      dataHora,
      dataHoraFim,
      excluirMesmoEventoDoOverlap ? idEvento : null,
      idAtribuicaoExcluir
    );
    if (!duploEvento.valido) conflitos.push(duploEvento);

    const duploArea = await this.validarConflitoMesmoEvento(
      idUsuario,
      idEvento,
      idAtribuicaoExcluir,
      idMinisterioDestino
    );
    if (!duploArea.valido) conflitos.push(duploArea);

    if (detalhes && areaNome) {
      const habilidade = this.validarHabilidadeUsuario(areaNome, detalhes);
      if (!habilidade.valido) conflitos.push(habilidade);

      const limite = await this.validarLimiteInstrumento(idArea, areaNome, detalhes);
      if (!limite.valido) conflitos.push(limite);
    }

    // Disponibilidade/skill: domínio ainda não existe
    conflitos.push({
      tipo: "disponibilidade",
      valido: true,
      mensagem: "Validação de disponibilidade não configurada no sistema",
      skip: true,
    });

    const reais = conflitos.filter((c) => !c.skip && c.valido === false);
    return {
      valido: reais.length === 0,
      conflitos: conflitos.filter((c) => !c.skip || c.valido === false),
    };
  }

  async validarConflitoDuploEvento(
    idUsuario,
    dataHora,
    dataHoraFim,
    idEventoExcluir = null,
    idAtribuicaoExcluir = null
  ) {
    const conflito = await EscalaRepository.buscarConflitoHorario(
      idUsuario,
      dataHora,
      dataHoraFim,
      { idEventoExcluir, idAtribuicaoExcluir }
    );
    if (conflito) {
      return {
        tipo: "duplo_evento",
        valido: false,
        mensagem: `Já escalado em ${conflito.area_nome} no mesmo horário (${conflito.evento_titulo}).`,
        sugestao: "Escolha outro horário ou remova a atribuição conflitante.",
        detalhe: conflito,
      };
    }
    return { tipo: "duplo_evento", valido: true, mensagem: "Sem conflito de horário" };
  }

  /**
   * Bloqueia a mesma pessoa em duas áreas do mesmo evento,
   * exceto quando os ministérios das áreas têm paralelismo configurado.
   */
  async validarConflitoMesmoEvento(
    idUsuario,
    idEvento,
    idAtribuicaoExcluir = null,
    idMinisterioDestino = null
  ) {
    const existentes = await EscalaRepository.listarEscalasUsuarioNoEvento(
      idUsuario,
      idEvento,
      idAtribuicaoExcluir
    );
    if (!existentes.length) {
      return { tipo: "duplo_instrumento", valido: true, mensagem: "Sem conflito no evento" };
    }

    const destino = idMinisterioDestino != null ? Number(idMinisterioDestino) : null;
    const bloqueantes = [];

    for (const existente of existentes) {
      const origem = existente.id_ministerio != null ? Number(existente.id_ministerio) : null;

      // Sem ministério vinculado → mantém bloqueio estrito
      if (!destino || !origem) {
        bloqueantes.push(existente);
        continue;
      }

      // Mesmo ministério em áreas distintas ainda é conflito
      if (origem === destino) {
        bloqueantes.push(existente);
        continue;
      }

      const permitido = await MinisterioModel.permiteParalelismo(origem, destino);
      if (!permitido) bloqueantes.push(existente);
    }

    if (bloqueantes.length) {
      const nomes = [...new Set(bloqueantes.map((b) => b.area_nome).filter(Boolean))];
      return {
        tipo: "duplo_instrumento",
        valido: false,
        mensagem: `Já escalado neste evento em ${nomes.join(", ")}.`,
        sugestao:
          "Remova a atribuição atual, escolha outra pessoa ou configure paralelismo entre os ministérios.",
        detalhe: bloqueantes[0],
      };
    }

    return {
      tipo: "duplo_instrumento",
      valido: true,
      mensagem: "Paralelismo de ministérios permitido",
    };
  }

  validarHabilidadeUsuario(areaNome, detalhes) {
    const config = getConfigPorArea(areaNome);
    if (!config) {
      return { tipo: "habilidade", valido: true, mensagem: "Sem validação específica", skip: true };
    }
    for (const campo of config.campos || []) {
      if (campo.tipo === "select" && campo.opcoes?.length) {
        const valor = detalhes?.[campo.chave];
        if (valor != null && valor !== "" && !campo.opcoes.includes(String(valor))) {
          return {
            tipo: "habilidade",
            valido: false,
            mensagem: `Valor inválido para ${campo.chave}: ${valor}`,
            sugestao: `Use uma das opções: ${campo.opcoes.join(", ")}`,
          };
        }
      }
    }
    return { tipo: "habilidade", valido: true, mensagem: "Função válida" };
  }

  async validarLimiteInstrumento(idArea, areaNome, detalhes) {
    const limites = getLimitesPorArea(areaNome);
    if (!limites) {
      return { tipo: "limite", valido: true, mensagem: "Sem limite configurado", skip: true };
    }
    const chave = detalhes?.instrumento ? "instrumento" : detalhes?.funcao ? "funcao" : null;
    if (!chave) {
      return { tipo: "limite", valido: true, mensagem: "Sem função para limitar", skip: true };
    }
    const valor = detalhes[chave];
    const limite = limites[valor];
    if (limite == null) {
      return { tipo: "limite", valido: true, mensagem: "Função sem limite", skip: true };
    }
    const atual = await EscalaRepository.contarPorFuncaoNaArea(idArea, chave, valor);
    if (atual >= limite) {
      return {
        tipo: "limite",
        valido: false,
        mensagem: `Limite atingido para ${valor}: ${atual}/${limite}`,
        sugestao: "Escolha outra função ou remova alguém da escala.",
        limite,
        atual,
      };
    }
    return { tipo: "limite", valido: true, mensagem: "Dentro do limite", limite, atual };
  }
}

export default new ValidadorEscala();
