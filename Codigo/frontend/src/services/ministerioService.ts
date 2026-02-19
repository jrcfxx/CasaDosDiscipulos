import apiClient from "./apiClient";

export interface Ministerio {
  id_ministerio: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  ordem: number;
  lideres?: { id_usuario: number; nome: string }[];
}

const ministerioService = {
  async getAll(incluirInativos = false): Promise<Ministerio[]> {
    const params = incluirInativos ? "?incluirInativos=true" : "";
    const res = await apiClient.get(`/ministerios${params}`);
    return res.data;
  },

  async getById(id: number): Promise<Ministerio> {
    const res = await apiClient.get(`/ministerios/${id}`);
    return res.data;
  },

  async create(data: { nome: string; descricao?: string; ativo?: boolean; ordem?: number; id_lideres?: number[] }): Promise<Ministerio> {
    const res = await apiClient.post("/ministerios", data);
    return res.data;
  },

  async update(id: number, data: Partial<{ nome: string; descricao: string; ativo: boolean; ordem: number; id_lideres: number[] }>): Promise<Ministerio> {
    const res = await apiClient.put(`/ministerios/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/ministerios/${id}`);
  },

  async getParticipantes(id: number): Promise<{ id_usuario: number; nome: string }[]> {
    const res = await apiClient.get(`/ministerios/${id}/participantes`);
    return res.data;
  },

  async setParticipantes(id: number, idUsuarios: number[]): Promise<void> {
    await apiClient.put(`/ministerios/${id}/participantes`, { id_usuarios: idUsuarios });
  },
};

export default ministerioService;
