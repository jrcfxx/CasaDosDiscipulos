import { AxiosError } from "axios";

/**
 * Extrai mensagem de erro de forma consistente (API ou Error genérico).
 */
export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro"): string {
  if (error instanceof Error) {
    if ("response" in error) {
      const data = (error as AxiosError).response?.data as { error?: string } | undefined;
      return data?.error ?? error.message ?? fallback;
    }
    return error.message;
  }
  return fallback;
}

export { isAxiosError } from "axios";
