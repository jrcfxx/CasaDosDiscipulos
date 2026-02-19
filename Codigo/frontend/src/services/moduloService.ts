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
  obrigatorio?: boolean;
  id_nivel?: number;
  pre_requisitos?: number[];
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
   * Exclui módulo permanentemente
   */
  async deletePermanente(id: number): Promise<void> {
    await apiClient.delete(`/modulo/${id}/permanente`);
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

  /**
   * Lista módulos ativos com progresso do usuário (requer auth)
   * Retorna { modulos, nivel_escola }
   */
  async getActiveWithProgress(): Promise<{
    modulos: (Modulo & { status?: string; nota_quiz?: number | null; data_conclusao?: string | null })[];
    nivel_escola: number;
    nivel_escola_nome?: string | null;
  }> {
    const response = await apiClient.get("/modulo/ativos-com-progresso");
    return response.data;
  },

  /**
   * Inicia módulo (marca como em_andamento)
   */
  async iniciar(id: number): Promise<void> {
    await apiClient.post(`/modulo/${id}/iniciar`);
  },

  /**
   * Conclui módulo sem quiz (apenas conteúdo)
   */
  async concluir(id: number): Promise<void> {
    await apiClient.post(`/modulo/${id}/concluir`);
  },

  /**
   * Ranking de usuários por pontuação
   */
  async getRanking(limit = 10): Promise<Array<{ id_usuario: number; nome: string; pontuacao: number; foto?: string }>> {
    const response = await apiClient.get(`/modulo/ranking?limit=${limit}`);
    return response.data;
  },

  /**
   * Posição do usuário autenticado no ranking (requer auth)
   * Retorna { posicao, pontuacao, nivel_escola, pontuacao_primeiro, pontuacao_anterior }
   */
  async getMinhaPosicao(): Promise<{
    posicao: number;
    pontuacao: number;
    nivel_escola: number;
    pontuacao_primeiro: number;
    pontuacao_anterior: number | null;
  } | null> {
    try {
      const response = await apiClient.get("/modulo/ranking/minha-posicao");
      return response.data;
    } catch {
      return null;
    }
  },
};

export default moduloService;
