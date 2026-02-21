import apiClient from "./apiClient";

export interface EscalaEvento {
  id_escala_evento: number;
  titulo: string;
  data_hora: string;
  data_hora_fim?: string | null;
  descricao?: string | null;
  ativo: boolean;
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
  atribuicoes?: EscalaAtribuicao[];
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

const escalaService = {
  async getEventos(params?: { ano?: number; mes?: number; ativo?: boolean }): Promise<EscalaEvento[]> {
    const searchParams = new URLSearchParams();
    if (params?.ano) searchParams.set("ano", String(params.ano));
    if (params?.mes) searchParams.set("mes", String(params.mes));
    if (params?.ativo !== undefined) searchParams.set("ativo", params.ativo ? "1" : "0");
    const qs = searchParams.toString();
    const url = qs ? `/escala/eventos?${qs}` : "/escala/eventos";
    const response = await apiClient.get(url);
    return response.data;
  },

  async getEventoCompleto(id: number): Promise<EscalaEventoCompleto> {
    const response = await apiClient.get(`/escala/eventos/${id}/completo`);
    return response.data;
  },

  async getUsuariosParaEscalar(idEvento: number, nomeArea?: string): Promise<{ id_usuario: number; nome: string }[]> {
    const params = nomeArea ? `?area=${encodeURIComponent(nomeArea)}` : "";
    const response = await apiClient.get(`/escala/eventos/${idEvento}/usuarios-para-escalar${params}`);
    return response.data;
  },

  async createEvento(data: {
    titulo: string;
    data_hora: string;
    data_hora_fim?: string | null;
    descricao?: string;
    ativo?: boolean;
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

  async updateAtribuicao(id: number, detalhes: Record<string, string | number | null>): Promise<EscalaAtribuicao> {
    const response = await apiClient.put(`/escala/atribuicoes/${id}`, { detalhes });
    return response.data;
  },

  async removeAtribuicao(id: number): Promise<void> {
    await apiClient.delete(`/escala/atribuicoes/${id}`);
  },
};

export default escalaService;
