import apiClient from "./apiClient";

export interface Quiz {
  id_quiz: number;
  id_modulo?: number;
  titulo: string;
  descricao: string;
  ativo: boolean | number;
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
};

export default quizService;
