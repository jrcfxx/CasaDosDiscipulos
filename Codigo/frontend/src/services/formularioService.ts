import apiClient from "./apiClient";

export interface FormularioCampo {
  id: number;
  id_campo: number;
  tipo_campo: string;
  label: string;
  conteudo?: string | null;
  obrigatorio?: boolean;
}

export interface Formulario {
  id_formulario: number;
  titulo: string;
  descricao?: string | null;
  ativo: boolean;
  campos?: FormularioCampo[];
}

const formularioService = {
  async getAll(): Promise<Formulario[]> {
    const response = await apiClient.get("/formulario");
    return response.data;
  },

  async getById(id: number): Promise<Formulario> {
    const response = await apiClient.get(`/formulario/${id}`);
    return response.data;
  },
};

export default formularioService;
