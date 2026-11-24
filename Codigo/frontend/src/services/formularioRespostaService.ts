import apiClient from "./apiClient";

export interface TotalCampo {
  id: number;
  label: string;
  soma: number;
  media: number | null;
  preenchidos: number;
}

export interface RelatorioFormulario {
  frequencia: string | null;
  inicio: string;
  fim: string;
  inicioEfetivo: string;
  fimEfetivo: string;
  /** Primeiro relatório já recebido neste formulário: antes disso nada conta como atraso */
  inicioUso: string;
  criterioData: { tipo: "campo" | "envio"; label: string };
  janelas: { inicio: string; fim: string; rotulo: string; estado: "encerrada" | "em_andamento" }[];
  celulas: {
    id_celula: number;
    nome: string;
    ativa: boolean;
    lideres: string[];
    janelas: { envios: number; situacao: "enviado" | "faltou" | "aguardando" }[];
    respostas: number;
    encerradas: number;
    cumpridas: number;
    faltas: number;
    emDia: boolean | null;
    ultimoEnvio: string | null;
    totais: TotalCampo[];
  }[];
  resumo: {
    celulas: number;
    emDia: number | null;
    atrasadas: number | null;
    respostas: number;
    enviosEsperados: number;
    enviosCumpridos: number;
    pontualidade: number | null;
    totais: TotalCampo[];
  };
}

/** Valores curtos (data e números) que a lista de respostas mostra sem abrir cada uma */
export interface ResumoCampoResposta {
  id: number;
  label: string;
  tipo: string;
  valor: string | null;
}

export interface FormularioRespostaPayload {
  id_formulario: number;
  id_celula: number;
  campos: Array<{
    id_formulario_campo: number;
    resposta: string | number | null;
  }>;
}

const formularioRespostaService = {
  async criar(payload: FormularioRespostaPayload) {
    const response = await apiClient.post("/formulario-resposta", payload);
    return response.data;
  },

  /** Todas as respostas com todos os campos (para exportar em Excel) */
  async exportacao(idFormulario: number): Promise<import("../utils/exportacoes").ExportacaoRespostas> {
    const response = await apiClient.get(`/formulario-resposta/formulario/${idFormulario}/exportar`);
    return response.data;
  },

  /** Relatório no período: por célula e por janela da frequência (semana, mês...) */
  async relatorio(idFormulario: number, inicio: string, fim: string): Promise<RelatorioFormulario> {
    const response = await apiClient.get(`/formulario-resposta/formulario/${idFormulario}/relatorio`, {
      params: { inicio, fim },
    });
    return response.data;
  },

  async listarPorFormulario(idFormulario: number) {
    const response = await apiClient.get(
      `/formulario-resposta/formulario/${idFormulario}`
    );
    return response.data;
  },

  async listarPorCelula(idCelula: number) {
    const response = await apiClient.get(
      `/formulario-resposta/celula/${idCelula}`
    );
    return response.data;
  },

  async getById(id: number) {
    const response = await apiClient.get(`/formulario-resposta/${id}`);
    return response.data;
  },
};

export default formularioRespostaService;
