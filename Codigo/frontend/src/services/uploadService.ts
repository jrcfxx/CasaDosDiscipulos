/**
 * Serviço centralizado de upload de arquivos
 * Usado por Módulos, Lições, Formulários e Quizzes
 */

import axios from "axios";
import { ASSETS_BASE, API_BASE } from "../config/api";

const UPLOAD_CAMPO_ENDPOINT = `${API_BASE}/upload/campo`;

export interface UploadResult {
  path: string;
  filename: string;
  originalname: string;
  size: number;
}

/**
 * Faz upload de arquivo para campo personalizado (módulos, lições, formulários)
 * Usa axios direto para garantir multipart/form-data correto (sem Content-Type json)
 * @param file - Arquivo a ser enviado
 * @returns Caminho relativo do arquivo (ex: /uploads/campos/arquivo-123.pdf)
 */
export async function uploadCampo(file: File): Promise<string> {
  if (!file || !(file instanceof File)) {
    throw new Error("Arquivo inválido");
  }

  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await axios.post<{
      path?: string;
      url?: string;
      filePath?: string;
    }>(UPLOAD_CAMPO_ENDPOINT, formData, {
      headers,
      timeout: 60000,
      maxContentLength: 15 * 1024 * 1024,
      maxBodyLength: 15 * 1024 * 1024,
    });

    const data = response.data;
    const path = data.path ?? data.url ?? data.filePath;

    if (!path || typeof path !== "string") {
      throw new Error("Resposta do upload inválida: caminho não retornado");
    }

    return path;
  } catch (err: any) {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      "Falha ao enviar o arquivo";
    throw new Error(msg);
  }
}

/**
 * Retorna a URL completa para exibir um arquivo de upload
 */
export function getUploadUrl(path: string): string {
  if (!path || typeof path !== "string") return "";
  // Remove barra inicial duplicada se houver
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${ASSETS_BASE}${normalized}`;
}

/**
 * Verifica se o valor é um caminho de upload válido
 */
export function isUploadPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("/uploads/") || value.includes("/uploads/"))
  );
}

/**
 * Extrai o nome do arquivo do caminho
 */
export function getFileNameFromPath(path: string): string {
  return path.split("/").pop() || "arquivo";
}

/**
 * Verifica se é uma extensão de imagem (para preview)
 */
export const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
];

export function isImagePath(path: string): boolean {
  const ext = getFileNameFromPath(path).split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.includes(ext);
}
