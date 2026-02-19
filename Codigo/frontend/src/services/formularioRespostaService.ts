import apiClient from "./apiClient";

export interface FormularioRespostaPayload {
  id_formulario: number;
  id_celula: number;
  campos: Array<{
    id_formulario_campo: number;
    resposta: string | number | null;
  }>;
}

const formularioRespostaService = {
  async criar(payload: FormularioRespostaPayload) {
    const response = await apiClient.post("/formulario-resposta", payload);
    return response.data;
  },

  async listarPorFormulario(idFormulario: number) {
    const response = await apiClient.get(
      `/formulario-resposta/formulario/${idFormulario}`
    );
    return response.data;
  },

  async listarPorCelula(idCelula: number) {
    const response = await apiClient.get(
      `/formulario-resposta/celula/${idCelula}`
    );
    return response.data;
  },

  async getById(id: number) {
    const response = await apiClient.get(`/formulario-resposta/${id}`);
    return response.data;
  },
};

export default formularioRespostaService;
