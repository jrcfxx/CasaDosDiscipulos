import apiClient from "./apiClient";

export interface Celula {
  id_celula: number;
  nome: string;
  endereco?: string;
  dia_reuniao?: string;
  horario_reuniao?: string;
  id_lider: number;
  ativa: boolean;
  nome_lider?: string;
}

const celulaService = {
  async getAll(): Promise<Celula[]> {
    const response = await apiClient.get("/celula");
    return response.data;
  },

  async getAtivas(): Promise<Celula[]> {
    const response = await apiClient.get("/celula/ativas");
    return response.data;
  },

  async getByLider(idLider: number): Promise<Celula[]> {
    const response = await apiClient.get(`/celula/lider/${idLider}`);
    return response.data;
  },
};

export default celulaService;
