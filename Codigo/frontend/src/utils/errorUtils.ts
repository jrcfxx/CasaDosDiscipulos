import { AxiosError } from "axios";

/** Formato do erro retornado pela API (via axios), para uso em blocos catch */
export type ErroApi = {
  response?: {
    status?: number;
    data?: { error?: string; errors?: string[]; message?: string; conflitos?: unknown[] };
  };
  message?: string;
};

/**
 * Extrai mensagem de erro de forma consistente (API ou Error genérico).
 */
export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro"): string {
  if (error instanceof Error) {
    if ("response" in error) {
      const data = (error as AxiosError).response?.data as
        | { error?: string; message?: string }
        | undefined;
      return data?.error ?? data?.message ?? error.message ?? fallback;
    }
    return error.message;
  }
  return fallback;
}

export { isAxiosError } from "axios";
