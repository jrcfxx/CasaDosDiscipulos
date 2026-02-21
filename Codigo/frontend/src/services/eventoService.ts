import api from "./apiClient";

export interface Evento {
  id_evento: number;
  titulo: string;
  descricao?: string;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
}

/** Eventos ativos (público - homepage) */
export async function getEventosAtivos(): Promise<Evento[]> {
  const { data } = await api.get<Evento[]>("/evento/ativos");
  return data;
}

/** CRUD de eventos (admin) */
export async function listarEventos(): Promise<Evento[]> {
  const { data } = await api.get<Evento[]>("/evento");
  return data;
}

export async function getEventoById(id: number): Promise<Evento> {
  const { data } = await api.get<Evento>(`/evento/${id}`);
  return data;
}

export async function criarEvento(body: Omit<Evento, "id_evento">): Promise<Evento> {
  const { data } = await api.post<Evento>("/evento", body);
  return data;
}

export async function atualizarEvento(id: number, body: Partial<Evento>): Promise<Evento> {
  const { data } = await api.put<Evento>(`/evento/${id}`, body);
  return data;
}

export async function excluirEvento(id: number): Promise<void> {
  await api.delete(`/evento/${id}`);
}

/** Upload de imagem para evento (admin) */
export async function uploadImagemEvento(file: File): Promise<{ imagem_url: string }> {
  const formData = new FormData();
  formData.append("imagem", file);
  const { data } = await api.post<{ imagem_url: string }>("/evento/upload", formData);
  return data;
}
