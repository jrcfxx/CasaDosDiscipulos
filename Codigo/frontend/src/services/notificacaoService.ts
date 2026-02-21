import apiClient from "./apiClient";

export interface Notificacao {
  id_notificacao: number;
  id_usuario: number;
  tipo: "evento_criado" | "escalado" | "pontuacao_manual" | "fala_ai_devocional" | "fala_ai_palavra";
  id_escala_evento: number | null;
  titulo: string;
  mensagem: string | null;
  area_nome: string | null;
  lido: boolean;
  data_criacao: string;
}

const notificacaoService = {
  async getList(params?: { limit?: number; naoLidos?: boolean }): Promise<Notificacao[]> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.naoLidos) qs.set("naoLidos", "true");
    const url = qs.toString() ? `/notificacoes?${qs}` : "/notificacoes";
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCountNaoLidas(): Promise<number> {
    const response = await apiClient.get("/notificacoes/count");
    return response.data.count ?? 0;
  },

  async marcarLido(id: number): Promise<void> {
    await apiClient.put(`/notificacoes/${id}/lido`);
  },

  async marcarTodasLidas(): Promise<void> {
    await apiClient.put("/notificacoes/marcar-todas-lidas");
  },
};

export default notificacaoService;
