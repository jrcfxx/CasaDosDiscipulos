/**
 * Serviço de Lições (Secretaria das Células)
 * Gerencia operações relacionadas a lições
 */

import apiClient from "./apiClient";

export interface LicaoCampo {
  id_campo: number;
  label: string;
  conteudo?: string | number | boolean | null;
  obrigatorio?: boolean;
}

export interface Licao {
  id_licao: number;
  titulo: string;
  descricao?: string | null;
  ativo: number | boolean;
  campos?: LicaoCampo[];
}

export interface LicaoCreateUpdate {
  titulo: string;
  descricao?: string | null;
  ativo: boolean;
  campos: LicaoCampo[];
}

const licaoService = {
  async getAll(): Promise<Licao[]> {
    const response = await apiClient.get<Licao[]>("/licao");
    return response.data ?? [];
  },

  async getById(id: number): Promise<Licao> {
    const response = await apiClient.get<Licao>(`/licao/${id}`);
    return response.data;
  },

  async create(data: LicaoCreateUpdate): Promise<Licao> {
    const response = await apiClient.post<Licao>("/licao", data);
    return response.data;
  },

  async update(id: number, data: LicaoCreateUpdate): Promise<Licao> {
    const response = await apiClient.put<Licao>(`/licao/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/licao/${id}`);
  },
};

export default licaoService;
