import api from "./apiClient";
import { ASSETS_BASE } from "../config/api";

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

/** Endereço da imagem: upload do site (/uploads/...) ou endereço completo (ex.: imagens de exemplo) */
export function urlImagemEvento(imagemUrl: string | null | undefined): string {
  if (!imagemUrl) return "";
  return /^https?:\/\//i.test(imagemUrl) ? imagemUrl : `${ASSETS_BASE}${imagemUrl}`;
}

/** Dados que a tela envia; a ordem do carrossel é definida arrastando (reordenarEventos) */
export type EventoForm = Pick<Evento, "titulo" | "imagem_url" | "ativo"> & { descricao?: string };

/** Nova ordem do carrossel: todos os eventos, na ordem desejada */
export async function reordenarEventos(ids: number[]): Promise<Evento[]> {
  const { data } = await api.put<Evento[]>("/evento/ordem", { ids });
  return data;
}

export async function criarEvento(body: EventoForm): Promise<Evento> {
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
