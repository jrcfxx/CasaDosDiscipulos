import apiClient from "./apiClient";

export interface EscalaEvento {
  id_escala_evento: number;
  titulo: string;
  data_hora: string;
  data_hora_fim?: string | null;
  descricao?: string | null;
  ativo: boolean;
  status?: "rascunho" | "publicada" | "concluida";
  id_criador?: number | null;
  data_criacao?: string;
  data_atualizacao?: string;
  areas?: EscalaArea[];
  ministerios?: { id_ministerio: number; nome: string }[];
}

export interface EscalaArea {
  id_escala_area: number;
  id_escala_evento: number;
  nome: string;
  ordem: number;
  id_ministerio?: number | null;
  atribuicoes?: EscalaAtribuicao[];
  podeGerenciar?: boolean;
}

export interface EscalaAtribuicao {
  id_escala_atribuicao: number;
  id_escala_area: number;
  id_usuario: number;
  usuario_nome?: string;
  area_nome?: string;
  detalhes?: Record<string, string | number | null>;
}

export interface EscalaEventoCompleto extends EscalaEvento {
  areas: (EscalaArea & { atribuicoes: EscalaAtribuicao[]; podeGerenciar?: boolean })[];
  ministerios?: { id_ministerio: number; nome: string }[];
}

export interface EscalaConflito {
  tipo: string;
  valido?: boolean;
  mensagem: string;
  sugestao?: string;
  skip?: boolean;
}

export interface EscalaTemplate {
  id_escala_template: number;
  nome: string;
  payload?: unknown;
  criador_nome?: string;
}

export interface VisaoAno {
  ano: number;
  meses: { mes: number; total_eventos: number; eventos: EscalaEvento[] }[];
}

export interface SlotMembro {
  id: number;
  membroEscalaId: number;
  ordem: number;
  id_escala_area: number;
  tipoSlot?: string | null;
  detalhes?: Record<string, string | number | null> | null;
  usuario: { id: number; nome: string; telefone?: string | null };
}

export interface EscalaHistoricoItem {
  id_escala_historico: number;
  id_escala_evento: number;
  id_usuario: number | null;
  usuario_nome?: string | null;
  acao: string;
  dados_antes?: unknown;
  dados_depois?: unknown;
  criado_em: string;
}

export interface SlotInstrumento {
  tipo: string;
  nome: string;
  icone: string;
  limite: number | null;
  atual: number;
  ordem: number;
  chaveDetalhe: string | null;
  id_escala_area: number;
  areaNome: string;
  podeGerenciar: boolean;
  membros: SlotMembro[];
}

export interface EventoUnificado {
  id: number;
  escalaId: number;
  nome: string;
  tipo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  data_hora: string;
  data_hora_fim?: string | null;
  status: string;
  descricao?: string | null;
  instrumentos: Record<string, SlotInstrumento>;
  totais: {
    instrumentos: number;
    vagasTotal: number;
    vagasPreenchidas: number;
    vagasDisponiveis: number;
    totalPessoas: number;
  };
}

export interface EstatisticasPessoaRanking {
  id: number;
  nome: string;
  totalEscalas: number;
  diasEscalado?: number;
  funcoesPrincipais?: { nome: string; quantidade: number }[];
}

export interface EstatisticasEscala {
  totalEventos: number;
  totalPessoas: number;
  pessoasUnicas: number;
  pessoaMaisEscalada?: EstatisticasPessoaRanking | null;
  pessoasMaisEscaladas?: EstatisticasPessoaRanking[];
  pessoasMenosEscaladas?: EstatisticasPessoaRanking[];
  instrumentosMaisUsados?: { instrumento?: string; tipo?: string; quantidade: number }[];
  areasMaisUsadas?: { area: string; quantidade: number }[];
  porTipo?: { chave: string; quantidade: number }[];
  porStatus?: { chave: string; quantidade: number }[];
  porDiaSemana?: { chave: string; quantidade: number }[];
  vagasTotal?: number;
  vagasPreenchidas?: number;
  vagasDisponiveis?: number;
  taxaPreenchimento?: number;
  mediaPessoasPorEvento?: number;
  eventosPassados?: number;
  eventosHoje?: number;
  eventosFuturos?: number;
  eventosSemPessoas?: {
    id: number;
    nome: string;
    data: string;
    horaInicio?: string;
    status?: string;
  }[];
  eventosIncompletos?: {
    id: number;
    nome: string;
    data: string;
    horaInicio?: string;
    status?: string;
    vagasDisponiveis?: number;
    slotsVazios?: { tipo: string; nome: string; area: string; atual: number; limite: number | null }[];
  }[];
  totalEventosSemPessoas?: number;
  totalEventosIncompletos?: number;
  alertas?: string[];
  diasComEventos?: number;
  diasVazios?: number;
}

export interface VisualizacaoDia {
  data: string;
  diaDaSemana: string;
  eventos: EventoUnificado[];
  estatisticas: EstatisticasEscala;
}

export interface VisualizacaoSemana {
  dataInicio: string;
  dataFim: string;
  dias: { data: string; diaDaSemana: string; diaNumero: number; eventos: EventoUnificado[] }[];
  estatisticas: EstatisticasEscala;
}

export interface VisualizacaoMes {
  ano: number;
  mes: number;
  mesNome: string;
  totalDias: number;
  dias: {
    data: string;
    diaDaSemana: string;
    diaNumero: number;
    temEventos: boolean;
    totalEventos: number;
    totalPessoas: number;
    eventos: EventoUnificado[];
  }[];
  estatisticas: EstatisticasEscala;
}

export interface MoverMembroPayload {
  membroEscalaOrigemId: number;
  escalaDestinoId: number;
  instrumentoDestino: string;
  id_escala_area?: number;
  forcarMovimento?: boolean;
}

export interface ValidacaoMover {
  sucesso: boolean;
  valido: boolean;
  podeProsseguir: boolean;
  conflitos: EscalaConflito[];
  avisos: EscalaConflito[];
}

export interface EscalasPessoa {
  usuario: { id: number; nome: string; email?: string };
  periodo: { dataInicio: string; dataFim: string };
  escalas: {
    id: number;
    data: string;
    diaDaSemana: string;
    evento: { id: number; nome: string; tipo: string };
    horario: string;
    instrumento: string;
    area: string;
    status: string;
  }[];
  estatisticas: {
    totalEscalas: number;
    instrumentos: { tipo: string; quantidade: number; percentual: number }[];
    diasEscalado: number;
  };
}

const escalaService = {
  async getEventos(params?: {
    ano?: number;
    mes?: number;
    ativo?: boolean;
    status?: string;
  }): Promise<EscalaEvento[]> {
    const searchParams = new URLSearchParams();
    if (params?.ano) searchParams.set("ano", String(params.ano));
    if (params?.mes) searchParams.set("mes", String(params.mes));
    if (params?.ativo !== undefined) searchParams.set("ativo", params.ativo ? "1" : "0");
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    const response = await apiClient.get(qs ? `/escala/eventos?${qs}` : "/escala/eventos");
    return response.data;
  },

  async getVisaoDia(data: string): Promise<EscalaEventoCompleto[]> {
    const response = await apiClient.get(`/escala/visao/dia/${data}`);
    return response.data;
  },

  async getVisaoSemana(dataInicio: string): Promise<EscalaEventoCompleto[]> {
    const response = await apiClient.get(`/escala/visao/semana/${dataInicio}`);
    return response.data;
  },

  async getVisaoMes(ano: number, mes: number): Promise<EscalaEventoCompleto[]> {
    const response = await apiClient.get(`/escala/visao/mes/${ano}/${mes}`);
    return response.data;
  },

  async getVisaoAno(ano: number): Promise<VisaoAno> {
    const response = await apiClient.get(`/escala/visao/ano/${ano}`);
    return response.data;
  },

  async getEventoCompleto(id: number): Promise<EscalaEventoCompleto> {
    const response = await apiClient.get(`/escala/eventos/${id}/completo`);
    return response.data;
  },

  async getUsuariosParaEscalar(
    idEvento: number,
    nomeArea?: string
  ): Promise<{ id_usuario: number; nome: string }[]> {
    const params = nomeArea ? `?area=${encodeURIComponent(nomeArea)}` : "";
    const response = await apiClient.get(
      `/escala/eventos/${idEvento}/usuarios-para-escalar${params}`
    );
    return response.data;
  },

  async createEvento(data: {
    titulo: string;
    data_hora: string;
    data_hora_fim?: string | null;
    descricao?: string;
    ativo?: boolean;
    status?: string;
    areas?: string[];
    id_ministerios?: number[];
  }): Promise<EscalaEvento> {
    const response = await apiClient.post("/escala/eventos", data);
    return response.data;
  },

  async updateEvento(
    id: number,
    data: Partial<{
      titulo: string;
      data_hora: string;
      data_hora_fim?: string | null;
      descricao: string;
      ativo: boolean;
      status: string;
      areas: string[];
      id_ministerios: number[];
    }>
  ): Promise<EscalaEvento> {
    const response = await apiClient.put(`/escala/eventos/${id}`, data);
    return response.data;
  },

  async deleteEvento(id: number): Promise<void> {
    await apiClient.delete(`/escala/eventos/${id}`);
  },

  async addAtribuicao(
    id_escala_area: number,
    id_usuario: number,
    detalhes?: Record<string, string | number | null>
  ): Promise<EscalaAtribuicao> {
    const response = await apiClient.post("/escala/atribuicoes", {
      id_escala_area,
      id_usuario,
      detalhes: detalhes || {},
    });
    return response.data;
  },

  async updateAtribuicao(
    id: number,
    detalhes: Record<string, string | number | null>
  ): Promise<EscalaAtribuicao> {
    const response = await apiClient.put(`/escala/atribuicoes/${id}`, { detalhes });
    return response.data;
  },

  async removeAtribuicao(id: number): Promise<void> {
    await apiClient.delete(`/escala/atribuicoes/${id}`);
  },

  async validarAtribuicao(
    idEvento: number,
    data: {
      id_escala_area: number;
      id_usuario: number;
      detalhes?: Record<string, string | number | null>;
    }
  ): Promise<{ sucesso: boolean; conflitos: EscalaConflito[] }> {
    const response = await apiClient.post(`/escala/eventos/${idEvento}/validar`, data);
    return response.data;
  },

  async moverAtribuicao(
    idAtribuicao: number,
    id_escala_area: number,
    detalhes?: Record<string, string | number | null>,
    forcarMovimento = false
  ): Promise<EscalaAtribuicao> {
    const response = await apiClient.post(`/escala/atribuicoes/${idAtribuicao}/mover`, {
      id_escala_area,
      detalhes,
      forcarMovimento: forcarMovimento || undefined,
    });
    return response.data;
  },

  async publicarEvento(id: number): Promise<EscalaEvento> {
    const response = await apiClient.post(`/escala/eventos/${id}/publicar`);
    return response.data;
  },

  async getHistorico(id: number): Promise<EscalaHistoricoItem[]> {
    const response = await apiClient.get(`/escala/eventos/${id}/historico`);
    return response.data;
  },

  async copiarEvento(
    id: number,
    data: { data_hora: string; data_hora_fim?: string | null; titulo?: string }
  ): Promise<{ sucesso: boolean; dados: EscalaEventoCompleto; warnings: unknown[] }> {
    const response = await apiClient.post(`/escala/eventos/${id}/copiar`, data);
    return response.data;
  },

  async copiarSemana(data: {
    data_inicio_origem: string;
    data_inicio_destino: string;
  }): Promise<{ sucesso: boolean; dados: EscalaEventoCompleto[]; warnings: unknown[] }> {
    const response = await apiClient.post("/escala/eventos/copiar-semana", data);
    return response.data;
  },

  async listarTemplates(): Promise<EscalaTemplate[]> {
    const response = await apiClient.get("/escala/templates");
    return response.data;
  },

  async criarTemplate(data: {
    nome: string;
    id_escala_evento?: number;
    payload?: unknown;
  }): Promise<EscalaTemplate> {
    const response = await apiClient.post("/escala/templates", data);
    return response.data;
  },

  async aplicarTemplate(
    id: number,
    data: { data_hora: string; data_hora_fim?: string | null; titulo?: string }
  ): Promise<{ sucesso: boolean; dados: EscalaEventoCompleto; warnings: unknown[] }> {
    const response = await apiClient.post(`/escala/templates/${id}/aplicar`, data);
    return response.data;
  },

  async excluirTemplate(id: number): Promise<void> {
    await apiClient.delete(`/escala/templates/${id}`);
  },

  async desfazer(idEvento: number): Promise<EscalaEventoCompleto> {
    const response = await apiClient.post(`/escala/eventos/${idEvento}/desfazer`);
    return response.data;
  },

  async getVisualizacaoDia(data: string): Promise<VisualizacaoDia> {
    const response = await apiClient.get(`/escala/visualizacao/dia/${data}`);
    return response.data.dados ?? response.data;
  },

  async getVisualizacaoSemana(dataInicio: string): Promise<VisualizacaoSemana> {
    const response = await apiClient.get(`/escala/visualizacao/semana/${dataInicio}`);
    return response.data.dados ?? response.data;
  },

  async getVisualizacaoMes(ano: number, mes: number, modo = "compacto"): Promise<VisualizacaoMes> {
    const response = await apiClient.get(`/escala/visualizacao/mes/${ano}/${mes}?modo=${modo}`);
    return response.data.dados ?? response.data;
  },

  async validarMoverMembro(data: MoverMembroPayload): Promise<ValidacaoMover> {
    const response = await apiClient.post("/escala/mover-membro-validar", data);
    return response.data;
  },

  async moverMembro(data: MoverMembroPayload): Promise<{ sucesso: boolean; mensagem: string }> {
    const response = await apiClient.put("/escala/mover-membro", data);
    return response.data;
  },

  async getEscalasDaPessoa(
    usuarioId: number,
    dataInicio: string,
    dataFim: string
  ): Promise<EscalasPessoa> {
    const response = await apiClient.get(
      `/escala/pessoa/${usuarioId}/periodo?dataInicio=${dataInicio}&dataFim=${dataFim}`
    );
    return response.data.dados ?? response.data;
  },

  async copiarDia(data_origem: string, data_destino: string) {
    const response = await apiClient.post("/escala/eventos/copiar-dia", {
      data_origem,
      data_destino,
    });
    return response.data;
  },
};

export default escalaService;
