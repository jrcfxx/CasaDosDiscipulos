import apiClient from "./apiClient";

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  pontuacao: number;
  ativo: boolean | number;
  tipo_usuario: string;
  foto?: string | null;
}

const usuarioService = {
  /**
   * Busca todos os usuários
   */
  async getAll(): Promise<Usuario[]> {
    const response = await apiClient.get("/usuarios");
    return response.data;
  },

  /**
   * Busca usuários ativos ordenados por pontuação (ranking)
   */
  async getRanking(limit: number = 20): Promise<Usuario[]> {
    const response = await apiClient.get("/usuarios");
    const usuarios: Usuario[] = response.data;

    return usuarios
      .filter((u) => u.ativo === true || u.ativo === 1)
      .sort((a, b) => (b.pontuacao || 0) - (a.pontuacao || 0))
      .slice(0, limit);
  },

  /**
   * Busca um usuário por ID
   */
  async getById(id: number): Promise<Usuario> {
    const response = await apiClient.get(`/usuarios/${id}`);
    return response.data;
  },

  /**
   * Cria um novo usuário
   */
  async create(data: Partial<Usuario>): Promise<Usuario> {
    const response = await apiClient.post("/usuarios", data);
    return response.data;
  },

  /**
   * Atualiza um usuário
   */
  async update(id: number, data: Partial<Usuario>): Promise<Usuario> {
    const response = await apiClient.put(`/usuarios/${id}`, data);
    return response.data;
  },

  /**
   * Toggle status ativo/inativo do usuário
   */
  async toggleActive(id: number): Promise<Usuario> {
    const response = await apiClient.delete(`/usuarios/${id}`);
    return response.data;
  },

  /**
   * Admin: atribui pontuação manual a um usuário (ex: dinâmicas presenciais).
   * O usuário recebe uma notificação com o motivo.
   */
  async addPontuacaoManual(
    id: number,
    dados: { pontos: number; motivo: string }
  ): Promise<Usuario> {
    const response = await apiClient.post(`/usuarios/${id}/pontuacao-manual`, dados);
    return response.data.usuario;
  },
};

export default usuarioService;
