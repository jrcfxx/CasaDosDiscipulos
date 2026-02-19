import apiClient from "./apiClient";

export interface LiderCelula {
  id_usuario: number;
  nome: string;
  email?: string;
  principal?: boolean;
}

export interface Celula {
  id_celula: number;
  nome: string;
  endereco?: string;
  dia_reuniao?: string;
  horario_reuniao?: string;
  id_lider: number | null; // primeiro líder (retrocompat)
  id_lideres: number[];
  lideres?: LiderCelula[];
  ativa: boolean;
  nome_lider?: string;
  email_lider?: string;
}

export interface CelulaCreateUpdate {
  nome: string;
  endereco?: string | null;
  id_lideres: number[];
  dia_reuniao?: string | null;
  horario_reuniao?: string | null;
  ativa?: boolean;
}

const celulaService = {
  async getAll(): Promise<Celula[]> {
    const response = await apiClient.get("/celula");
    return response.data ?? [];
  },

  async getById(id: number): Promise<Celula> {
    const response = await apiClient.get(`/celula/${id}`);
    return response.data;
  },

  async getAtivas(): Promise<Celula[]> {
    const response = await apiClient.get("/celula/ativas");
    return response.data ?? [];
  },

  async getByLider(idLider: number): Promise<Celula[]> {
    const response = await apiClient.get(`/celula/lider/${idLider}`);
    return response.data ?? [];
  },

  async create(data: CelulaCreateUpdate): Promise<Celula> {
    const response = await apiClient.post("/celula", data);
    return response.data;
  },

  async update(id: number, data: CelulaCreateUpdate): Promise<Celula> {
    const response = await apiClient.put(`/celula/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/celula/${id}`);
  },
};

export default celulaService;
