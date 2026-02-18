/**
 * Serviço de Campos Personalizados
 * Gerencia operações relacionadas a campos personalizados
 */

import apiClient from "./apiClient";
import { Campo } from "../types";

export interface CreateCampoData {
  tipo_campo: string;
  label?: string;
  conteudo?: string | number | boolean | null;
  obrigatorio?: boolean;
  ordem?: number;
  // Campos específicos por tipo
  placeholder?: string;
  min_valor?: number;
  max_valor?: number;
  step?: number;
  data_minima?: string;
  data_maxima?: string;
  tipos_aceitos?: string;
  tamanho_maximo?: number;
  max_caracteres?: number;
  opcoes?: string[];
}

const campoService = {
  /**
   * Lista todos os campos personalizados
   */
  async getAll(): Promise<Campo[]> {
    const response = await apiClient.get("/campo");
    return response.data;
  },

  /**
   * Lista campos permitidos para uma modalidade específica
   * @param modalidade - 'modulo', 'quiz', 'licao', ou 'formulario'
   */
  async getByModalidade(modalidade: string): Promise<Campo[]> {
    const response = await apiClient.get("/campo", {
      params: { modalidade },
    });
    return response.data;
  },

  /**
   * Busca campo por ID
   */
  async getById(id: number): Promise<Campo> {
    const response = await apiClient.get(`/campo/${id}`);
    return response.data;
  },

  /**
   * Cria novo campo
   */
  async create(data: CreateCampoData): Promise<Campo> {
    const response = await apiClient.post("/campo", data);
    return response.data.campo;
  },

  /**
   * Atualiza campo existente
   */
  async update(id: number, data: Partial<CreateCampoData>): Promise<Campo> {
    const response = await apiClient.put(`/campo/${id}`, data);
    return response.data.campo;
  },

  /**
   * Remove campo
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/campo/${id}`);
  },
};

export default campoService;
