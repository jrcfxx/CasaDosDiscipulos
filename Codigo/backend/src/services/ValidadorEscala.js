import EscalaRepository from "../repository/EscalaRepository.js";
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
      idAtribuicaoExcluir
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

  async validarConflitoMesmoEvento(idUsuario, idEvento, idAtribuicaoExcluir = null) {
    const existente = await EscalaRepository.usuarioJaEscaladoNoEvento(
      idUsuario,
      idEvento,
      idAtribuicaoExcluir
    );
    if (existente) {
      return {
        tipo: "duplo_instrumento",
        valido: false,
        mensagem: `Já escalado neste evento em ${existente.area_nome}.`,
        sugestao: "Remova a atribuição atual ou escolha outra pessoa.",
        detalhe: existente,
      };
    }
    return { tipo: "duplo_instrumento", valido: true, mensagem: "Sem conflito no evento" };
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
