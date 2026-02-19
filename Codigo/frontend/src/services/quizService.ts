import apiClient from "./apiClient";

export interface QuizQuestao {
  id_questao: number;
  tipo_questao: string;
  enunciado: string;
  pontos?: number;
  ordem?: number;
  opcoes?: string | Array<{ id: string; texto: string }>;
  resposta_correta?: string | null;
}

export interface Quiz {
  id_quiz: number;
  id_modulo?: number;
  titulo: string;
  descricao?: string;
  ativo: boolean | number;
  questoes?: QuizQuestao[];
  campos?: Array<{ id?: number; id_campo?: number; tipo_campo?: string; label?: string; conteudo?: unknown }>;
}

const quizService = {
  async getAll(): Promise<Quiz[]> {
    const response = await apiClient.get("/quiz");
    return response.data;
  },

  async getById(id: number): Promise<Quiz> {
    const response = await apiClient.get(`/quiz/${id}`);
    return response.data;
  },

  async create(data: Omit<Quiz, "id_quiz">): Promise<Quiz> {
    const response = await apiClient.post("/quiz", data);
    return response.data;
  },

  async update(id: number, data: Partial<Quiz>): Promise<Quiz> {
    const response = await apiClient.put(`/quiz/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/quiz/${id}`);
  },

  async getActive(): Promise<Quiz[]> {
    const all = await this.getAll();
    return all.filter((quiz) => quiz.ativo === true || quiz.ativo === 1);
  },

  /**
   * Submete respostas do quiz
   * @param idQuiz - ID do quiz
   * @param idModulo - ID do módulo (contexto atual)
   * @param respostas - Array de { id_questao, resposta }
   */
  async responder(
    idQuiz: number,
    idModulo: number,
    respostas: Array<{ id_questao: number; resposta: string }>
  ): Promise<{
    message: string;
    pontos_obtidos: number;
    total_questoes: number;
    pontuacao_maxima?: number;
    atingiu_50?: boolean;
    eh_retentativa?: boolean;
  }> {
    const userStr = localStorage.getItem("usuario");
    const usuario = userStr ? JSON.parse(userStr) : null;
    const id_usuario = usuario?.id_usuario;
    if (!id_usuario) {
      throw new Error("Usuário não autenticado");
    }
    const response = await apiClient.post(`/quiz/${idQuiz}/responder`, {
      id_usuario,
      id_modulo: idModulo,
      respostas,
    });
    return response.data;
  },
};

export default quizService;
