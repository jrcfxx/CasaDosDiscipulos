/**
 * Serviço de Formulários (Secretaria das Células)
 * Gerencia operações relacionadas a formulários
 */

import apiClient from "./apiClient";

export interface FormularioCampo {
  id?: number;
  id_campo: number;
  tipo_campo?: string;
  label: string;
  conteudo?: string | number | boolean | null;
  obrigatorio?: boolean;
  ordem?: number;
}

export type FrequenciaTipo = "semanal" | "quinzenal" | "mensal" | "bimestral" | null;

export interface Formulario {
  id_formulario: number;
  titulo: string;
  descricao?: string | null;
  ativo: number | boolean;
  frequencia?: FrequenciaTipo;
  campos?: FormularioCampo[];
}

export interface FormularioCreateUpdate {
  titulo: string;
  descricao?: string | null;
  ativo: boolean;
  frequencia?: FrequenciaTipo;
  campos?: Array<{
    id_campo: number;
    label: string;
    conteudo?: string | number | boolean | null;
    ordem?: number;
    obrigatorio?: boolean;
  }>;
}

const formularioService = {
  async getAll(): Promise<Formulario[]> {
    const response = await apiClient.get<Formulario[]>("/formulario");
    return response.data ?? [];
  },

  async getById(id: number): Promise<Formulario> {
    const response = await apiClient.get<Formulario>(`/formulario/${id}`);
    return response.data;
  },

  async create(data: FormularioCreateUpdate): Promise<Formulario> {
    const response = await apiClient.post<Formulario>("/formulario", data);
    return response.data;
  },

  async update(id: number, data: FormularioCreateUpdate): Promise<Formulario> {
    const response = await apiClient.put<Formulario>(`/formulario/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/formulario/${id}`);
  },
};

export const FREQUENCIA_OPCOES: Array<{ value: string; label: string }> = [
  { value: "", label: "Sem frequência" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
];

export default formularioService;
