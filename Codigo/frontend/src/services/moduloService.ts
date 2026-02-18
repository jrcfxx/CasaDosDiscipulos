/**
 * Serviço de Módulos
 * Gerencia operações relacionadas a módulos da Escola de Discípulos
 */

import apiClient from "./apiClient";
import { Modulo } from "../types";

export interface CampoModulo {
  id_campo: number;
  label: string;
  conteudo?: string | number | boolean;
  ordem?: number;
}

export interface CreateModuloData {
  titulo: string;
  descricao?: string;
  ordem?: number;
  ativo?: boolean;
  campos?: CampoModulo[]; // Campos personalizados com conteúdo
}

export interface UpdateModuloData extends CreateModuloData {
  id_modulo?: number;
}

const moduloService = {
  /**
   * Lista todos os módulos com seus campos
   */
  async getAll(): Promise<Modulo[]> {
    const response = await apiClient.get("/modulo");
    return response.data;
  },

  /**
   * Lista apenas módulos ativos (para usuários)
   */
  async getActive(): Promise<Modulo[]> {
    const response = await apiClient.get("/modulo/active");
    return response.data;
  },

  /**
   * Busca módulo por ID com seus campos
   */
  async getById(id: number): Promise<Modulo> {
    const response = await apiClient.get(`/modulo/${id}`);
    return response.data;
  },

  /**
   * Cria novo módulo
   */
  async create(data: CreateModuloData): Promise<Modulo> {
    const response = await apiClient.post("/modulo", data);
    return response.data;
  },

  /**
   * Atualiza módulo existente
   */
  async update(id: number, data: UpdateModuloData): Promise<Modulo> {
    const response = await apiClient.put(`/modulo/${id}`, data);
    return response.data;
  },

  /**
   * Ativa/desativa módulo (soft delete)
   */
  async toggleActive(id: number): Promise<Modulo> {
    const response = await apiClient.delete(`/modulo/${id}`);
    return response.data.modulo;
  },

  /**
   * Vincula quiz a um módulo
   */
  async vincularQuiz(idModulo: number, idQuiz: number): Promise<void> {
    await apiClient.post(`/modulo/${idModulo}/quiz/${idQuiz}`);
  },

  /**
   * Remove vínculo entre módulo e quiz
   */
  async desvincularQuiz(idModulo: number, idQuiz: number): Promise<void> {
    await apiClient.delete(`/modulo/${idModulo}/quiz/${idQuiz}`);
  },

  /**
   * Busca quiz vinculado a um módulo
   */
  async getQuizVinculado(idModulo: number): Promise<any> {
    const response = await apiClient.get(`/modulo/${idModulo}/quiz`);
    return response.data;
  },
};

export default moduloService;
