import api from "./apiClient";

/** Item do organograma: grupo, função ou subfunção (árvore) */
export interface StaffItem {
  id_staff_item: number;
  id_pai: number | null;
  titulo: string;
  /** Responsáveis; null = a definir */
  pessoas: string | null;
  ordem: number;
  filhos: StaffItem[];
}

export interface StaffEstrutura {
  titulo: string;
  subtitulo: string;
  itens: StaffItem[];
}

/** Máximo de níveis aceito pelo backend (grupo → função → subfunção → item) */
export const STAFF_PROFUNDIDADE_MAXIMA = 4;

export async function getEstrutura(): Promise<StaffEstrutura> {
  const { data } = await api.get<StaffEstrutura>("/staff");
  return data;
}

export async function atualizarConfig(body: { titulo?: string; subtitulo?: string }): Promise<StaffEstrutura> {
  const { data } = await api.put<StaffEstrutura>("/staff/config", body);
  return data;
}

export async function criarItem(body: {
  id_pai: number | null;
  titulo: string;
  pessoas?: string | null;
}): Promise<StaffItem> {
  const { data } = await api.post<StaffItem>("/staff/itens", body);
  return data;
}

export async function atualizarItem(
  id: number,
  body: { titulo?: string; pessoas?: string | null }
): Promise<StaffItem> {
  const { data } = await api.put<StaffItem>(`/staff/itens/${id}`, body);
  return data;
}

export async function moverItem(id: number, direcao: "cima" | "baixo"): Promise<StaffEstrutura> {
  const { data } = await api.put<StaffEstrutura>(`/staff/itens/${id}/mover`, { direcao });
  return data;
}

export async function excluirItem(id: number): Promise<void> {
  await api.delete(`/staff/itens/${id}`);
}
